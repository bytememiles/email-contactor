'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';

import { useProfiles } from '@/hooks/useProfiles';
import { useTemplates } from '@/hooks/useTemplates';
import { ProcessedReceiver } from '@/types/receiver';

export interface BulkSendDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (profileId: string, templateId: string) => void;
  receivers: ProcessedReceiver[];
  isSending?: boolean;
  progress?: {
    total: number;
    sent: number;
    failed: number;
    currentReceiver?: ProcessedReceiver;
  };
}

export const BulkSendDialog: React.FC<BulkSendDialogProps> = ({
  open,
  onClose,
  onConfirm,
  receivers,
  isSending = false,
  progress,
}) => {
  const { profiles } = useProfiles();
  const { templates } = useTemplates();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const validReceivers = receivers.filter((r) => r.isValid);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const canSend =
    !isSending &&
    selectedProfileId &&
    selectedTemplateId &&
    validReceivers.length > 0;

  const handleConfirm = () => {
    if (canSend) {
      onConfirm(selectedProfileId, selectedTemplateId);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    progress && progress.total > 0
      ? ((progress.sent + progress.failed) / progress.total) * 100
      : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        {isSending ? 'Sending Bulk Emails' : 'Send Bulk Emails Now'}
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        {isSending && progress ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              Sending emails to {progress.total} receiver(s)...
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Sent: {progress.sent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed: {progress.failed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {progress.total}
              </Typography>
            </Box>
            {progress.currentReceiver && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Current: {progress.currentReceiver.fullName} (
                  {progress.currentReceiver.emails.join(', ')})
                </Typography>
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              <Typography variant="body2">
                You are about to send emails to{' '}
                <strong>{validReceivers.length}</strong> valid receiver(s)
                immediately. This action cannot be undone.
              </Typography>
            </Alert>

            {validReceivers.length === 0 && (
              <Alert severity="error">
                <Typography variant="body2">
                  No valid receivers found. Please ensure you have valid
                  receivers with valid email addresses.
                </Typography>
              </Alert>
            )}

            {profiles.length === 0 && (
              <Alert severity="warning">
                <Typography variant="body2">
                  No profiles found. Please create a profile first in Settings.
                </Typography>
              </Alert>
            )}

            {templates.length === 0 && (
              <Alert severity="warning">
                <Typography variant="body2">
                  No templates found. Please create a template first in
                  Settings.
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Profile</InputLabel>
              <Select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                label="Profile"
                disabled={isSending || profiles.length === 0}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                label="Template"
                disabled={isSending || templates.length === 0}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTemplate && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Template Preview:
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Subject:</strong>{' '}
                  {selectedTemplate.subject || 'No Subject'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    maxHeight: 100,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedTemplate.content.substring(0, 200)}
                  {selectedTemplate.content.length > 200 ? '...' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        {isSending ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Sending emails...
            </Typography>
          </Box>
        ) : (
          <>
            <Button onClick={handleClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="primary"
              disabled={!canSend}
            >
              Send Now
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
