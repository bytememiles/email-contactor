import {
  CSVReceiverInput,
  CSVUploadResult,
  ProcessedReceiver,
  ReceiverValidationResult,
} from '@/types/receiver';

import { timezoneService } from './timezoneService';

/**
 * Parse CSV content and extract receiver data
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

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: CSVReceiverInput[] = [];
    const errors: string[] = [];

    // Validate headers
    const requiredColumns = ['full name', 'email', 'location'];
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        data: [],
        errors: [`Missing required columns: ${missingColumns.join(', ')}`],
        totalRows: lines.length - 1,
        validRows: 0,
      };
    }

    // Find column indices
    const fullNameIndex = headers.indexOf('full name');
    const emailIndex = headers.indexOf('email');
    const locationIndex = headers.indexOf('location');

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const columns = line.split(',').map((col) => col.trim());

      if (
        columns.length <
        Math.max(fullNameIndex, emailIndex, locationIndex) + 1
      ) {
        errors.push(`Row ${i}: Insufficient columns`);
        continue;
      }

      const receiver: CSVReceiverInput = {
        fullName: columns[fullNameIndex] || '',
        email: columns[emailIndex] || '',
        location: columns[locationIndex] || '',
      };

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
 * Validate receiver data with multiple email support
 */
export const validateReceiver = (
  receiver: CSVReceiverInput
): ReceiverValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate full name
  if (!receiver.fullName.trim()) {
    errors.push('Full name is required');
  } else if (receiver.fullName.trim().length < 2) {
    warnings.push('Full name seems too short');
  }

  // Validate emails
  if (!receiver.email.trim()) {
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

  // Validate location
  if (!receiver.location.trim()) {
    warnings.push('Location is empty - timezone will default to UTC');
  }

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
      const { timezone, source } = await timezoneService.detectTimezone(
        receiver.location
      );

      return {
        id: crypto.randomUUID(),
        rowNumber: index + 1,
        fullName: receiver.fullName.trim(),
        emails: emails.map((email) => email.toLowerCase()),
        originalEmailField: receiver.email.trim(),
        location: receiver.location.trim(),
        timezone,
        timezoneSource: source,
        tags: [], // Start with no tags assigned
        isValid: validation.isValid,
        validationErrors: validation.errors,
      };
    })
  );

  return results;
};

/**
 * Format timezone for display
 */
export const formatTimezone = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(now);
    const timeZoneName =
      parts.find((part) => part.type === 'timeZoneName')?.value || timezone;

    return `${timezone} (${timeZoneName})`;
  } catch {
    return timezone;
  }
};
