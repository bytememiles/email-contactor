import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';

import { JobForm } from '@/types/job';
import { Profile } from '@/types/profile';
import { ReceiverListSummary } from '@/types/receiver';
import { EmailTemplate } from '@/types/template';

interface JobCreatorProps {
  profiles: Profile[];
  templates: EmailTemplate[];
  receiverLists: ReceiverListSummary[];
  onSubmit: (data: JobForm) => void;
  onCancel: () => void;
}

export const JobCreator: React.FC<JobCreatorProps> = ({
  profiles,
  templates,
  receiverLists,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<JobForm>({
    profileId: '',
    templateId: '',
    receiverListId: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>(
    {}
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof JobForm, string>> = {};

    if (!formData.profileId) {
      newErrors.profileId = 'Profile is required';
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Template is required';
    }

    if (!formData.receiverListId) {
      newErrors.receiverListId = 'Receiver list is required';
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

  // Filter templates based on selected profile
  const availableTemplates = formData.profileId
    ? templates.filter((template) => {
        const profile = profiles.find((p) => p.id === formData.profileId);
        return profile?.templateIds.includes(template.id);
      })
    : templates;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <FormControl
        fullWidth
        margin="normal"
        required
        error={!!errors.profileId}
      >
        <InputLabel>Profile</InputLabel>
        <Select
          value={formData.profileId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              profileId: e.target.value,
              templateId: '',
            }))
          }
          label="Profile"
        >
          {profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              {profile.fullName}
            </MenuItem>
          ))}
        </Select>
        {errors.profileId && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1.75 }}
          >
            {errors.profileId}
          </Typography>
        )}
      </FormControl>

      <FormControl
        fullWidth
        margin="normal"
        required
        error={!!errors.templateId}
      >
        <InputLabel>Template</InputLabel>
        <Select
          value={formData.templateId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, templateId: e.target.value }))
          }
          label="Template"
          disabled={!formData.profileId || availableTemplates.length === 0}
        >
          {availableTemplates.length === 0 ? (
            <MenuItem disabled>
              {formData.profileId
                ? 'No templates available for this profile'
                : 'Select a profile first'}
            </MenuItem>
          ) : (
            availableTemplates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))
          )}
        </Select>
        {errors.templateId && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1.75 }}
          >
            {errors.templateId}
          </Typography>
        )}
      </FormControl>

      <FormControl
        fullWidth
        margin="normal"
        required
        error={!!errors.receiverListId}
      >
        <InputLabel>Receiver List</InputLabel>
        <Select
          value={formData.receiverListId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, receiverListId: e.target.value }))
          }
          label="Receiver List"
        >
          {receiverLists.map((list) => (
            <MenuItem key={list.id} value={list.id}>
              {list.name} ({list.validReceivers} valid receivers)
            </MenuItem>
          ))}
        </Select>
        {errors.receiverListId && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1.75 }}
          >
            {errors.receiverListId}
          </Typography>
        )}
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button type="submit" variant="contained">
          Create Job
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};
