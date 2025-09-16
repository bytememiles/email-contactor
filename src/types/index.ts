// Re-export types from other modules for convenience
export type { AttachmentData, EmailData, EmailPriority } from './email';
export type {
  CSVReceiverInput,
  CSVUploadResult,
  DEFAULT_TAG_COLORS,
  DEFAULT_TAGS,
  LOCATION_TIMEZONE_MAP,
  ProcessedReceiver,
  ReceiverList,
  ReceiverListForm,
  ReceiverListSummary,
  ReceiverTag,
  ReceiverValidationResult,
  TagForm,
  TimezoneApiResponse,
  TimezoneCacheEntry,
} from './receiver';
export type { SettingsModalProps, SMTPConfig, SMTPConfigForm } from './smtp';
export type {
  EmailTemplate,
  REQUIRED_PLACEHOLDERS,
  RequiredPlaceholder,
  TemplateForm,
  TemplateValidationResult,
} from './template';
