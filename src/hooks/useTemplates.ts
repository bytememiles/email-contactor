import { useCallback, useEffect, useState } from 'react';

import {
  EmailTemplate,
  REQUIRED_PLACEHOLDERS,
  TemplateForm,
  TemplateValidationResult,
} from '@/types/template';

const STORAGE_KEY = 'email_templates';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedTemplates = JSON.parse(stored).map((template: unknown) => {
          const templateData = template as Omit<
            EmailTemplate,
            'createdAt' | 'updatedAt'
          > & {
            createdAt: string;
            updatedAt: string;
            subject?: string; // Optional for migration
          };
          return {
            ...templateData,
            // Handle migration: add subject if it doesn't exist
            subject: templateData.subject || '',
            createdAt: new Date(templateData.createdAt),
            updatedAt: new Date(templateData.updatedAt),
          };
        });
        setTemplates(parsedTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save templates to localStorage whenever they change
  const saveTemplates = useCallback((newTemplates: EmailTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }, []);

  // Validate template content
  const validateTemplate = useCallback(
    (content: string): TemplateValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for required placeholders
      REQUIRED_PLACEHOLDERS.forEach((placeholder) => {
        const placeholderPattern = new RegExp(`\\[${placeholder}\\]`, 'gi');
        if (!placeholderPattern.test(content)) {
          errors.push(`Missing required placeholder: [${placeholder}]`);
        }
      });

      // Check for malformed placeholders
      const placeholderPattern = /\[[^\]]+\]/g;
      const placeholders = content.match(placeholderPattern) || [];

      placeholders.forEach((placeholder) => {
        // Remove brackets and check if it contains invalid characters
        const placeholderName = placeholder.slice(1, -1);
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(placeholderName)) {
          warnings.push(
            `Potentially invalid placeholder format: ${placeholder}`
          );
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },
    []
  );

  // Add new template
  const addTemplate = useCallback(
    (templateData: TemplateForm) => {
      const validation = validateTemplate(templateData.content);

      const newTemplate: EmailTemplate = {
        id: crypto.randomUUID(),
        name: templateData.name,
        subject: templateData.subject,
        content: templateData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        isValid: validation.isValid,
        validationErrors: validation.errors,
      };

      const updatedTemplates = [...templates, newTemplate];
      saveTemplates(updatedTemplates);
      return newTemplate;
    },
    [templates, validateTemplate, saveTemplates]
  );

  // Update existing template
  const updateTemplate = useCallback(
    (id: string, templateData: TemplateForm) => {
      const validation = validateTemplate(templateData.content);

      const updatedTemplates = templates.map((template) => {
        if (template.id === id) {
          return {
            ...template,
            name: templateData.name,
            subject: templateData.subject,
            content: templateData.content,
            updatedAt: new Date(),
            isValid: validation.isValid,
            validationErrors: validation.errors,
          };
        }
        return template;
      });

      saveTemplates(updatedTemplates);
    },
    [templates, validateTemplate, saveTemplates]
  );

  // Delete template
  const deleteTemplate = useCallback(
    (id: string) => {
      const updatedTemplates = templates.filter(
        (template) => template.id !== id
      );
      saveTemplates(updatedTemplates);
    },
    [templates, saveTemplates]
  );

  // Get template by ID
  const getTemplate = useCallback(
    (id: string) => {
      return templates.find((template) => template.id === id);
    },
    [templates]
  );

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    validateTemplate,
  };
};
