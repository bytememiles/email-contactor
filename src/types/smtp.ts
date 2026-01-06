import { EmailTemplate } from './template';

export interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromAddress: string;
  fromName?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SMTPConfigForm {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromAddress: string;
  fromName?: string;
}

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onTemplateApply?: (template: EmailTemplate) => void;
}

export interface SMTPSelectorProps {
  selectedConfig: SMTPConfig | null;
  onConfigSelect: (config: SMTPConfig | null) => void;
  onSend: () => void;
  onSendWithConfig?: () => void;
  disabled?: boolean;
  isSending?: boolean;
  countdown?: number;
}
