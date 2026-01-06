/**
 * US State to Timezone Mapping
 * Maps US states (by abbreviation or full name) to their primary timezone
 */

export interface StateInfo {
  abbreviation: string;
  fullName: string;
  timezone: string;
}

export const US_STATES: StateInfo[] = [
  { abbreviation: 'AL', fullName: 'Alabama', timezone: 'America/Chicago' },
  { abbreviation: 'AK', fullName: 'Alaska', timezone: 'America/Anchorage' },
  { abbreviation: 'AZ', fullName: 'Arizona', timezone: 'America/Phoenix' },
  { abbreviation: 'AR', fullName: 'Arkansas', timezone: 'America/Chicago' },
  {
    abbreviation: 'CA',
    fullName: 'California',
    timezone: 'America/Los_Angeles',
  },
  { abbreviation: 'CO', fullName: 'Colorado', timezone: 'America/Denver' },
  { abbreviation: 'CT', fullName: 'Connecticut', timezone: 'America/New_York' },
  { abbreviation: 'DE', fullName: 'Delaware', timezone: 'America/New_York' },
  { abbreviation: 'FL', fullName: 'Florida', timezone: 'America/New_York' },
  { abbreviation: 'GA', fullName: 'Georgia', timezone: 'America/New_York' },
  { abbreviation: 'HI', fullName: 'Hawaii', timezone: 'Pacific/Honolulu' },
  { abbreviation: 'ID', fullName: 'Idaho', timezone: 'America/Denver' },
  { abbreviation: 'IL', fullName: 'Illinois', timezone: 'America/Chicago' },
  {
    abbreviation: 'IN',
    fullName: 'Indiana',
    timezone: 'America/Indiana/Indianapolis',
  },
  { abbreviation: 'IA', fullName: 'Iowa', timezone: 'America/Chicago' },
  { abbreviation: 'KS', fullName: 'Kansas', timezone: 'America/Chicago' },
  { abbreviation: 'KY', fullName: 'Kentucky', timezone: 'America/New_York' },
  { abbreviation: 'LA', fullName: 'Louisiana', timezone: 'America/Chicago' },
  { abbreviation: 'ME', fullName: 'Maine', timezone: 'America/New_York' },
  { abbreviation: 'MD', fullName: 'Maryland', timezone: 'America/New_York' },
  {
    abbreviation: 'MA',
    fullName: 'Massachusetts',
    timezone: 'America/New_York',
  },
  { abbreviation: 'MI', fullName: 'Michigan', timezone: 'America/Detroit' },
  { abbreviation: 'MN', fullName: 'Minnesota', timezone: 'America/Chicago' },
  { abbreviation: 'MS', fullName: 'Mississippi', timezone: 'America/Chicago' },
  { abbreviation: 'MO', fullName: 'Missouri', timezone: 'America/Chicago' },
  { abbreviation: 'MT', fullName: 'Montana', timezone: 'America/Denver' },
  { abbreviation: 'NE', fullName: 'Nebraska', timezone: 'America/Chicago' },
  { abbreviation: 'NV', fullName: 'Nevada', timezone: 'America/Los_Angeles' },
  {
    abbreviation: 'NH',
    fullName: 'New Hampshire',
    timezone: 'America/New_York',
  },
  { abbreviation: 'NJ', fullName: 'New Jersey', timezone: 'America/New_York' },
  { abbreviation: 'NM', fullName: 'New Mexico', timezone: 'America/Denver' },
  { abbreviation: 'NY', fullName: 'New York', timezone: 'America/New_York' },
  {
    abbreviation: 'NC',
    fullName: 'North Carolina',
    timezone: 'America/New_York',
  },
  { abbreviation: 'ND', fullName: 'North Dakota', timezone: 'America/Chicago' },
  { abbreviation: 'OH', fullName: 'Ohio', timezone: 'America/New_York' },
  { abbreviation: 'OK', fullName: 'Oklahoma', timezone: 'America/Chicago' },
  { abbreviation: 'OR', fullName: 'Oregon', timezone: 'America/Los_Angeles' },
  {
    abbreviation: 'PA',
    fullName: 'Pennsylvania',
    timezone: 'America/New_York',
  },
  {
    abbreviation: 'RI',
    fullName: 'Rhode Island',
    timezone: 'America/New_York',
  },
  {
    abbreviation: 'SC',
    fullName: 'South Carolina',
    timezone: 'America/New_York',
  },
  { abbreviation: 'SD', fullName: 'South Dakota', timezone: 'America/Chicago' },
  { abbreviation: 'TN', fullName: 'Tennessee', timezone: 'America/Chicago' },
  { abbreviation: 'TX', fullName: 'Texas', timezone: 'America/Chicago' },
  { abbreviation: 'UT', fullName: 'Utah', timezone: 'America/Denver' },
  { abbreviation: 'VT', fullName: 'Vermont', timezone: 'America/New_York' },
  { abbreviation: 'VA', fullName: 'Virginia', timezone: 'America/New_York' },
  {
    abbreviation: 'WA',
    fullName: 'Washington',
    timezone: 'America/Los_Angeles',
  },
  {
    abbreviation: 'WV',
    fullName: 'West Virginia',
    timezone: 'America/New_York',
  },
  { abbreviation: 'WI', fullName: 'Wisconsin', timezone: 'America/Chicago' },
  { abbreviation: 'WY', fullName: 'Wyoming', timezone: 'America/Denver' },
  {
    abbreviation: 'DC',
    fullName: 'District of Columbia',
    timezone: 'America/New_York',
  },
];

/**
 * Normalize state input to standard format
 * Accepts abbreviations, full names, and common variations
 */
export function normalizeState(stateInput: string): {
  normalized: string;
  abbreviation: string;
  fullName: string;
  timezone: string | null;
} {
  if (!stateInput?.trim()) {
    return {
      normalized: '',
      abbreviation: '',
      fullName: '',
      timezone: null,
    };
  }

  const normalized = stateInput.trim();
  const lowerInput = normalized.toLowerCase();

  // Try to find by abbreviation (case-insensitive)
  const byAbbr = US_STATES.find(
    (state) => state.abbreviation.toLowerCase() === lowerInput
  );
  if (byAbbr) {
    return {
      normalized: byAbbr.abbreviation,
      abbreviation: byAbbr.abbreviation,
      fullName: byAbbr.fullName,
      timezone: byAbbr.timezone,
    };
  }

  // Try to find by full name (case-insensitive, handle variations)
  const byFullName = US_STATES.find(
    (state) => state.fullName.toLowerCase() === lowerInput
  );
  if (byFullName) {
    return {
      normalized: byFullName.abbreviation,
      abbreviation: byFullName.abbreviation,
      fullName: byFullName.fullName,
      timezone: byFullName.timezone,
    };
  }

  // Try fuzzy matching for common variations
  const fuzzyMatch = US_STATES.find((state) => {
    const stateLower = state.fullName.toLowerCase();
    // Check if input contains state name or vice versa
    return (
      stateLower.includes(lowerInput) ||
      lowerInput.includes(stateLower) ||
      stateLower.replace(/\s+/g, '') === lowerInput.replace(/\s+/g, '')
    );
  });

  if (fuzzyMatch) {
    return {
      normalized: fuzzyMatch.abbreviation,
      abbreviation: fuzzyMatch.abbreviation,
      fullName: fuzzyMatch.fullName,
      timezone: fuzzyMatch.timezone,
    };
  }

  // No match found
  return {
    normalized: normalized,
    abbreviation: '',
    fullName: '',
    timezone: null,
  };
}

/**
 * Validate if a state is valid
 */
export function validateState(stateInput: string): boolean {
  const result = normalizeState(stateInput);
  return result.timezone !== null;
}

/**
 * Get timezone for a state
 */
export function getStateTimezone(stateInput: string): string | null {
  const result = normalizeState(stateInput);
  return result.timezone;
}
