export interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  validationErrors: string[];
}

export interface TemplateForm {
  name: string;
  content: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateManagerProps {
  // For future use when this becomes a standalone component
  className?: string;
  onTemplateSelect?: (template: EmailTemplate) => void;
  readOnly?: boolean;
}

// Required placeholders that must be present in templates
export const REQUIRED_PLACEHOLDERS = ['first_name', 'sender_name'] as const;

export type RequiredPlaceholder = (typeof REQUIRED_PLACEHOLDERS)[number];
