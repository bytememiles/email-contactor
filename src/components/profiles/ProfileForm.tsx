import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { Profile, ProfileForm as ProfileFormData } from '@/types/profile';
import { SMTPConfig } from '@/types/smtp';
import { EmailTemplate } from '@/types/template';

interface ProfileFormProps {
  profile?: Profile | null;
  smtpConfigs: SMTPConfig[];
  templates: EmailTemplate[];
  onSubmit: (data: ProfileFormData) => void;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  smtpConfigs,
  templates,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: profile?.fullName || '',
    smtpConfigId: profile?.smtpConfigId || '',
    templateIds: profile?.templateIds || [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.smtpConfigId) {
      newErrors.smtpConfigId = 'SMTP configuration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleTemplateToggle = (templateId: string) => {
    setFormData((prev) => {
      const currentIds = prev.templateIds;
      if (currentIds.includes(templateId)) {
        return {
          ...prev,
          templateIds: currentIds.filter((id) => id !== templateId),
        };
      } else {
        return {
          ...prev,
          templateIds: [...currentIds, templateId],
        };
      }
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Full Name"
        value={formData.fullName}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, fullName: e.target.value }))
        }
        error={!!errors.fullName}
        helperText={errors.fullName}
        margin="normal"
        required
      />

      <FormControl
        fullWidth
        margin="normal"
        required
        error={!!errors.smtpConfigId}
      >
        <InputLabel>SMTP Configuration</InputLabel>
        <Select
          value={formData.smtpConfigId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, smtpConfigId: e.target.value }))
          }
          label="SMTP Configuration"
        >
          {smtpConfigs.map((config) => (
            <MenuItem key={config.id} value={config.id}>
              {config.name} ({config.host})
            </MenuItem>
          ))}
        </Select>
        {errors.smtpConfigId && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1.75 }}
          >
            {errors.smtpConfigId}
          </Typography>
        )}
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Templates (Select multiple)
        </Typography>
        {templates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No templates available. Create templates first.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
            }}
          >
            {templates.map((template) => (
              <Box
                key={template.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.5,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Checkbox
                  checked={formData.templateIds.includes(template.id)}
                  onChange={() => handleTemplateToggle(template.id)}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{template.name}</Typography>
                  {template.subject && (
                    <Typography variant="caption" color="text.secondary">
                      Subject: {template.subject}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button type="submit" variant="contained">
          {profile ? 'Update' : 'Create'} Profile
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};
