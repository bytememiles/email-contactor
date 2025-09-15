'use client';

import React, { useState } from 'react';
import { Close, Send } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Toolbar,
  Typography,
} from '@mui/material';

import { EmailComposerProps } from '@/types/email';
import { useEmailSender } from '@/hooks';
import {
  RecipientFields,
  EmailEditor,
  AttachmentManager,
  AttachButton,
  FilePreview,
} from '@/components/email-composer';

export default function EmailComposer({ onClose, onSend }: EmailComposerProps) {
  // Form state
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Preview state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Email sending hook
  const {
    isSending,
    countdown,
    notification,
    handleCloseNotification,
    startSendCountdown,
    cancelSend,
    showNotification,
  } = useEmailSender();

  // Form handlers
  const handleAddFiles = (newFiles: File[]) => {
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewFile = (file: File) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const resetForm = () => {
    setToRecipients([]);
    setCcRecipients([]);
    setShowCc(false);
    setSubject('');
    setMarkdown('');
    setAttachments([]);
    setPreviewFile(null);
  };

  const handleSend = () => {
    // Validation
    if (toRecipients.length === 0) {
      showNotification(
        'Please enter at least one recipient email address',
        'error'
      );
      return;
    }

    if (!subject.trim()) {
      showNotification('Please enter a subject', 'error');
      return;
    }

    if (!markdown.trim()) {
      showNotification('Please enter a message', 'error');
      return;
    }

    // Check if already sending
    if (isSending) {
      setShowCancelDialog(true);
      return;
    }

    // Start sending process
    startSendCountdown(
      toRecipients,
      ccRecipients,
      subject,
      markdown,
      attachments,
      () => {
        resetForm();
        if (onSend) {
          onSend({
            to: toRecipients.join(','),
            subject,
            html: '', // Will be filled by the hook
            text: '', // Will be filled by the hook
          });
        }
      }
    );
  };

  const handleCancelSend = () => {
    cancelSend();
    setShowCancelDialog(false);
  };

  return (
    <>
      <Paper
        sx={{
          height: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        {/* Header */}
        <Toolbar
          sx={{
            backgroundColor: 'primary.dark',
            color: 'primary.contrastText',
            minHeight: '48px !important',
            px: 2,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '16px' }}>
            Compose Email
          </Typography>
          {onClose && (
            <IconButton
              size="small"
              sx={{ color: 'inherit' }}
              onClick={onClose}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Toolbar>

        <Divider />

        {/* Recipient Fields */}
        <RecipientFields
          toRecipients={toRecipients}
          ccRecipients={ccRecipients}
          showCc={showCc}
          onToRecipientsChange={setToRecipients}
          onCcRecipientsChange={setCcRecipients}
          onShowCcChange={setShowCc}
          subject={subject}
          onSubjectChange={setSubject}
        />

        {/* Email Editor and Preview */}
        <EmailEditor markdown={markdown} onMarkdownChange={setMarkdown} />

        {/* Attachments */}
        <AttachmentManager
          attachments={attachments}
          onRemoveFile={handleRemoveFile}
          onPreviewFile={handlePreviewFile}
        />

        {/* Footer */}
        <Box sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <AttachButton onAddFiles={handleAddFiles} />

            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSend}
              disabled={toRecipients.length === 0 || !subject || !markdown}
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                minHeight: { xs: 40, sm: 36 },
                position: 'relative',
              }}
            >
              Send
              {isSending && countdown > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: 'warning.main',
                    color: 'warning.contrastText',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {countdown}
                </Box>
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
      >
        <DialogTitle>Cancel Email?</DialogTitle>
        <DialogContent>
          <Typography>Do you want to cancel sending this email?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Continue Sending
          </Button>
          <Button onClick={handleCancelSend} color="error" variant="contained">
            Cancel Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* File Preview Dialog */}
      <FilePreview
        file={previewFile}
        isOpen={!!previewFile}
        onClose={handleClosePreview}
      />
    </>
  );
}
