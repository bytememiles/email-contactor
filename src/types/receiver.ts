export interface CSVReceiverInput {
  fullName: string;
  email: string;
  location: string;
}

export interface ReceiverTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ProcessedReceiver {
  id: string;
  rowNumber: number;
  fullName: string;
  emails: string[]; // Changed from single email to array
  originalEmailField: string; // Keep original for reference
  location: string;
  timezone: string;
  timezoneSource: 'cache' | 'api' | 'fallback';
  tags: ReceiverTag[];
  isValid: boolean;
  validationErrors: string[];
}

export interface ReceiverValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CSVUploadResult {
  success: boolean;
  data: CSVReceiverInput[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface TagForm {
  name: string;
  color: string;
}

export interface TimezoneCacheEntry {
  location: string;
  timezone: string;
  timestamp: number;
  source: 'api' | 'fallback';
}

export interface TimezoneApiResponse {
  timezone: string;
  success: boolean;
  error?: string;
}

export interface ReceiverList {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  sourceFileName?: string;
  totalReceivers: number;
  validReceivers: number;
  receivers: ProcessedReceiver[];
}

export interface ReceiverListForm {
  name: string;
  description?: string;
}

export interface ReceiverListSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  sourceFileName?: string;
  totalReceivers: number;
  validReceivers: number;
}

// Default tag colors
export const DEFAULT_TAG_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#607D8B', // Blue Grey
  '#795548', // Brown
  '#009688', // Teal
] as const;

// Default tags
export const DEFAULT_TAGS: Omit<ReceiverTag, 'id' | 'createdAt'>[] = [
  { name: 'web', color: '#2196F3' },
  { name: 'AI', color: '#4CAF50' },
];

// Timezone mapping for common locations
export const LOCATION_TIMEZONE_MAP: Record<string, string> = {
  // Countries
  usa: 'America/New_York',
  'united states': 'America/New_York',
  canada: 'America/Toronto',
  uk: 'Europe/London',
  'united kingdom': 'Europe/London',
  germany: 'Europe/Berlin',
  france: 'Europe/Paris',
  japan: 'Asia/Tokyo',
  china: 'Asia/Shanghai',
  india: 'Asia/Kolkata',
  australia: 'Australia/Sydney',
  brazil: 'America/Sao_Paulo',
  russia: 'Europe/Moscow',
  singapore: 'Asia/Singapore',
  'south korea': 'Asia/Seoul',
  indonesia: 'Asia/Jakarta',
  thailand: 'Asia/Bangkok',
  vietnam: 'Asia/Ho_Chi_Minh',
  philippines: 'Asia/Manila',
  malaysia: 'Asia/Kuala_Lumpur',

  // Major cities
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  chicago: 'America/Chicago',
  london: 'Europe/London',
  paris: 'Europe/Paris',
  berlin: 'Europe/Berlin',
  tokyo: 'Asia/Tokyo',
  shanghai: 'Asia/Shanghai',
  beijing: 'Asia/Shanghai',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  sydney: 'Australia/Sydney',
  melbourne: 'Australia/Melbourne',
  toronto: 'America/Toronto',
  vancouver: 'America/Vancouver',
  dubai: 'Asia/Dubai',
  'hong kong': 'Asia/Hong_Kong',
  seoul: 'Asia/Seoul',
  bangkok: 'Asia/Bangkok',
  jakarta: 'Asia/Jakarta',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  manila: 'Asia/Manila',
  'ho chi minh': 'Asia/Ho_Chi_Minh',
  hanoi: 'Asia/Ho_Chi_Minh',
};
