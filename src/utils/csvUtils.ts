import {
  CSVReceiverInput,
  CSVUploadResult,
  ProcessedReceiver,
  ReceiverValidationResult,
} from '@/types/receiver';

import {
  getStateTimezone,
  normalizeState,
  validateState,
} from './stateTimezone';
import { timezoneService } from './timezoneService';

/**
 * Fuzzy column name matching
 * Handles case-insensitive matching and common variations
 */
function fuzzyMatchColumn(header: string, targetNames: string[]): boolean {
  const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, '');

  return targetNames.some((target) => {
    const normalizedTarget = target.trim().toLowerCase().replace(/\s+/g, '');

    // Exact match
    if (normalizedHeader === normalizedTarget) return true;

    // Contains match
    if (
      normalizedHeader.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedHeader)
    ) {
      return true;
    }

    // Handle common variations
    const variations: Record<string, string[]> = {
      firstname: ['first name', 'firstname', 'fname', 'given name'],
      fullname: ['full name', 'fullname', 'name', 'complete name'],
      email: ['e-mail', 'email address', 'mail'],
      github: ['github url', 'github link', 'gh'],
      state: ['us state', 'state code', 'state abbreviation'],
      telegram: ['telegram handle', 'telegram username', 'tg', 'telegram id'],
      no: ['number', 'num', '#', 'row number', 'row'],
    };

    const targetVariations = variations[normalizedTarget] || [];
    return targetVariations.some((variation) => {
      const normalizedVariation = variation.replace(/\s+/g, '');
      return (
        normalizedHeader === normalizedVariation ||
        normalizedHeader.includes(normalizedVariation) ||
        normalizedVariation.includes(normalizedHeader)
      );
    });
  });
}

/**
 * Find column index using fuzzy matching
 */
function findColumnIndex(headers: string[], targetNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    if (fuzzyMatchColumn(headers[i], targetNames)) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse CSV content and extract receiver data with enhanced column validation
 */
export const parseCSV = (content: string): CSVUploadResult => {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        errors: [
          'CSV file must contain at least a header row and one data row',
        ],
        totalRows: 0,
        validRows: 0,
      };
    }

    // Parse headers with better CSV handling (handle quoted values)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) =>
      h.replace(/^"|"$/g, '').trim()
    );

    // Validate required columns with fuzzy matching
    // Note: firstName is optional if fullName is present
    const requiredColumns = [
      { names: ['email', 'e-mail'], mandatory: true, field: 'email' },
      { names: ['state', 'us state'], mandatory: true, field: 'state' },
    ];

    const optionalColumns = [
      {
        names: ['first name', 'firstname', 'fname', 'given name'],
        field: 'firstName',
      },
      {
        names: ['full name', 'fullname', 'name'],
        field: 'fullName',
      },
      { names: ['no', 'number', 'num', '#'], field: 'no' },
      { names: ['github', 'github url'], field: 'github' },
      { names: ['telegram', 'telegram handle'], field: 'telegram' },
      { names: ['location'], field: 'location' },
    ];

    const columnIndices: Record<string, number> = {};
    const missingColumns: string[] = [];

    // Find required columns
    for (const col of requiredColumns) {
      const index = findColumnIndex(headers, col.names);
      if (index === -1 && col.mandatory) {
        missingColumns.push(col.names[0]);
      } else if (index !== -1) {
        columnIndices[col.field] = index;
      }
    }

    // Find optional columns
    for (const col of optionalColumns) {
      const index = findColumnIndex(headers, col.names);
      if (index !== -1) {
        columnIndices[col.field] = index;
      }
    }

    // Validate that we have either firstName or fullName
    if (!columnIndices.firstName && !columnIndices.fullName) {
      return {
        success: false,
        data: [],
        errors: [
          `Missing required column: First Name or Full Name. Found columns: ${headers.join(', ')}`,
        ],
        totalRows: lines.length - 1,
        validRows: 0,
      };
    }

    if (missingColumns.length > 0) {
      return {
        success: false,
        data: [],
        errors: [
          `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`,
        ],
        totalRows: lines.length - 1,
        validRows: 0,
      };
    }

    const data: CSVReceiverInput[] = [];
    const errors: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const columns = parseCSVLine(line).map((col) =>
        col.replace(/^"|"$/g, '').trim()
      );

      // Extract values using column indices
      const receiver: CSVReceiverInput = {
        firstName: columns[columnIndices.firstName] || '',
        email: columns[columnIndices.email] || '',
        state: columns[columnIndices.state] || '',
      };

      // Handle fullName - if present and firstName is empty, extract firstName from fullName
      if (columnIndices.fullName !== undefined) {
        const fullNameValue = columns[columnIndices.fullName] || '';
        receiver.fullName = fullNameValue || undefined;

        // If firstName is empty but fullName exists, extract first name from full name
        if (!receiver.firstName?.trim() && fullNameValue.trim()) {
          receiver.firstName = fullNameValue.trim().split(/\s+/)[0] || '';
        }
      }

      // Add optional fields if present
      if (columnIndices.no !== undefined) {
        receiver.no = columns[columnIndices.no] || undefined;
      }
      if (columnIndices.github !== undefined) {
        receiver.github = columns[columnIndices.github] || undefined;
      }
      if (columnIndices.telegram !== undefined) {
        receiver.telegram = columns[columnIndices.telegram] || undefined;
      }
      if (columnIndices.location !== undefined) {
        receiver.location = columns[columnIndices.location] || undefined;
      }

      data.push(receiver);
    }

    return {
      success: true,
      data,
      errors,
      totalRows: lines.length - 1,
      validRows: data.length,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      totalRows: 0,
      validRows: 0,
    };
  }
};

/**
 * Parse email field to extract multiple emails
 */
export const parseEmails = (emailField: string): string[] => {
  if (!emailField?.trim()) return [];

  // Remove quotes and split by comma
  const cleaned = emailField.replace(/["']/g, '').trim();
  const emails = cleaned
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  return emails;
};

/**
 * Validate email address format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format (for GitHub)
 */
export const validateURL = (url: string): boolean => {
  if (!url?.trim()) return true; // Optional field
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate receiver data with new column requirements
 */
export const validateReceiver = (
  receiver: CSVReceiverInput
): ReceiverValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate first name or full name (at least one is required)
  if (!receiver.firstName?.trim() && !receiver.fullName?.trim()) {
    errors.push('First name or full name is required');
  } else {
    // If we have fullName but no firstName, extract it
    if (!receiver.firstName?.trim() && receiver.fullName?.trim()) {
      // This will be handled during processing, but validate here
      const extractedFirstName = receiver.fullName.trim().split(/\s+/)[0];
      if (extractedFirstName.length < 2) {
        warnings.push('Extracted first name seems too short');
      }
    } else if (
      receiver.firstName?.trim() &&
      receiver.firstName.trim().length < 2
    ) {
      warnings.push('First name seems too short');
    }
  }

  // Validate emails (mandatory)
  if (!receiver.email?.trim()) {
    errors.push('Email is required');
  } else {
    const emails = parseEmails(receiver.email);
    if (emails.length === 0) {
      errors.push('No valid emails found');
    } else {
      const invalidEmails = emails.filter((email) => !validateEmail(email));
      if (invalidEmails.length > 0) {
        errors.push(`Invalid email format: ${invalidEmails.join(', ')}`);
      }
      if (emails.length > 1) {
        warnings.push(`Multiple emails detected: ${emails.length} emails`);
      }
    }
  }

  // Validate state (mandatory, US states)
  if (!receiver.state?.trim()) {
    errors.push('State is required');
  } else {
    const isValidState = validateState(receiver.state);
    if (!isValidState) {
      errors.push(`Invalid US state: ${receiver.state}`);
    }
  }

  // Validate GitHub URL (optional)
  if (receiver.github?.trim() && !validateURL(receiver.github)) {
    warnings.push(`Invalid GitHub URL format: ${receiver.github}`);
  }

  // Ensure we have a valid name (either firstName or extracted from fullName)
  // This validation is already handled above, but keep for clarity

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Process CSV receivers into validated and normalized format
 */
export const processReceivers = async (
  csvData: CSVReceiverInput[]
): Promise<ProcessedReceiver[]> => {
  const results = await Promise.all(
    csvData.map(async (receiver, index) => {
      const validation = validateReceiver(receiver);
      const emails = parseEmails(receiver.email);

      // Determine timezone from state (preferred) or location (fallback)
      let timezone = 'UTC';
      let timezoneSource: 'cache' | 'api' | 'fallback' | 'state' = 'fallback';

      if (receiver.state?.trim()) {
        const stateTimezone = getStateTimezone(receiver.state);
        if (stateTimezone) {
          timezone = stateTimezone;
          timezoneSource = 'state';
        }
      }

      // Fallback to location-based timezone if state didn't work
      if (timezoneSource === 'fallback' && receiver.location?.trim()) {
        const { timezone: locationTimezone, source } =
          await timezoneService.detectTimezone(receiver.location);
        timezone = locationTimezone;
        timezoneSource = source;
      }

      // Normalize state
      const stateInfo = normalizeState(receiver.state || '');

      // Extract firstName from fullName if firstName is missing
      let firstName = receiver.firstName?.trim() || '';
      if (!firstName && receiver.fullName?.trim()) {
        firstName = receiver.fullName.trim().split(/\s+/)[0] || '';
      }

      // Compute fullName from firstName or use provided fullName
      const fullName =
        receiver.fullName?.trim() || receiver.firstName?.trim() || '';

      return {
        id: crypto.randomUUID(),
        rowNumber: index + 1,
        no: receiver.no,
        firstName,
        fullName,
        emails: emails.map((email) => email.toLowerCase()),
        originalEmailField: receiver.email?.trim() || '',
        github: receiver.github?.trim() || undefined,
        state: receiver.state?.trim() || '',
        stateNormalized: stateInfo.abbreviation || undefined,
        telegram: receiver.telegram?.trim() || undefined,
        location: receiver.location?.trim() || undefined,
        timezone,
        timezoneSource,
        tags: [], // Start with no tags assigned
        isValid: validation.isValid,
        validationErrors: validation.errors,
      };
    })
  );

  return results;
};

/**
 * Get timezone abbreviation (EST, CST, PST, etc.)
 * Automatically handles DST (EDT, CDT, PDT, etc.)
 */
export const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(now);
    const timeZoneName =
      parts.find((part) => part.type === 'timeZoneName')?.value || '';

    // Return the abbreviation (e.g., "EST", "EDT", "CST", "CDT", "PST", "PDT")
    return timeZoneName || timezone;
  } catch {
    return timezone;
  }
};

/**
 * Get current time in a specific timezone
 */
export const getCurrentTimeInTimezone = (
  timezone: string,
  options?: {
    includeDate?: boolean;
    includeSeconds?: boolean;
  }
): string => {
  try {
    const now = new Date();
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    if (options?.includeDate) {
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
    }

    if (options?.includeSeconds) {
      formatOptions.second = '2-digit';
    }

    const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
    return formatter.format(now);
  } catch {
    return 'N/A';
  }
};

/**
 * Format timezone for display (legacy function - now returns abbreviation)
 */
export const formatTimezone = (timezone: string): string => {
  return getTimezoneAbbreviation(timezone);
};
