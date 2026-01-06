'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
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
  initialData?: JobForm;
  mode?: 'create' | 'edit';
}

export const JobCreator: React.FC<JobCreatorProps> = ({
  profiles,
  templates,
  receiverLists,
  onSubmit,
  onCancel,
  initialData,
  mode = 'create',
}) => {
  // Extract time from scheduledTime if editing
  const getInitialSendTime = (): string => {
    if (initialData?.sendTime) {
      return initialData.sendTime;
    }
    return '10:00'; // Default to 10 AM
  };

  // Lazy initialization to avoid setState in effect
  const getInitialFormData = (): JobForm => ({
    profileId: initialData?.profileId || '',
    templateId: initialData?.templateId || '',
    receiverListId: initialData?.receiverListId || '',
    sendTime: getInitialSendTime(),
  });

  const [formData, setFormData] = useState<JobForm>(getInitialFormData);

  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>(
    {}
  );

  // Update form data when initialData changes (e.g., switching between create/edit)
  // Use a ref to track previous initialData to avoid unnecessary updates
  const prevInitialDataRef = useRef(initialData);

  useEffect(() => {
    // Only update if initialData actually changed
    if (prevInitialDataRef.current !== initialData) {
      prevInitialDataRef.current = initialData;

      // Schedule state update in next tick to avoid synchronous setState in effect
      queueMicrotask(() => {
        if (initialData) {
          setFormData({
            profileId: initialData.profileId || '',
            templateId: initialData.templateId || '',
            receiverListId: initialData.receiverListId || '',
            sendTime: initialData.sendTime || '10:00',
          });
        } else {
          // Reset to default values when creating new job
          setFormData({
            profileId: '',
            templateId: '',
            receiverListId: '',
            sendTime: '10:00',
          });
        }
        setErrors({});
      });
    }
  }, [initialData]);

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

      <TextField
        fullWidth
        margin="normal"
        label="Sending Time"
        type="time"
        value={formData.sendTime || '10:00'}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, sendTime: e.target.value }))
        }
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{
          step: 300, // 5 minutes
        }}
        helperText="Time when emails will be sent (default: 10:00 AM)"
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button type="submit" variant="contained">
          {mode === 'edit' ? 'Update Job' : 'Create Job'}
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};
