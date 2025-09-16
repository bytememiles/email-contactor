export type EmailPriority = 'low' | 'normal' | 'high';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  priority?: EmailPriority;
}

export interface EmailComposerProps {
  onClose?: () => void;
  onSend?: (emailData: EmailData) => void;
}

export interface AttachmentData {
  filename: string;
  content: string;
  encoding: string;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export interface FilePreviewProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface AttachmentManagerProps {
  attachments: File[];
  onRemoveFile: (index: number) => void;
  onPreviewFile: (file: File) => void;
}

export interface RecipientFieldsProps {
  toRecipients: string[];
  ccRecipients: string[];
  showCc: boolean;
  onToRecipientsChange: (recipients: string[]) => void;
  onCcRecipientsChange: (recipients: string[]) => void;
  onShowCcChange: (show: boolean) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  priority: EmailPriority;
  onPriorityChange: (priority: EmailPriority) => void;
}

export interface EmailEditorProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  onTemplateApply?: (subject: string, content: string) => void;
}
