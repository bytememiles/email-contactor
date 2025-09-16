'use client';

import React, { useState } from 'react';
import { Close, Send, Settings } from '@mui/icons-material';
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

import {
  AttachButton,
  AttachmentManager,
  EmailEditor,
  FilePreview,
  RecipientFields,
  SettingsModal,
  SMTPSelector,
} from '@/components/email-composer';
import { useEmailSender } from '@/hooks';
import { useSMTPConfigsRedux } from '@/hooks/useSMTPConfigsRedux';
import { EmailComposerProps, EmailPriority } from '@/types/email';
import { SMTPConfig } from '@/types/smtp';
import { EmailTemplate } from '@/types/template';

export default function EmailComposer({ onClose, onSend }: EmailComposerProps) {
  // Form state
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [priority, setPriority] = useState<EmailPriority>('normal');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Preview state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSMTPConfig, setSelectedSMTPConfig] =
    useState<SMTPConfig | null>(null);

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

  // SMTP configurations hook
  const {
    selectedConfig,
    setSelectedConfig,
    hasConfigs,
    loading: smtpLoading,
  } = useSMTPConfigsRedux();

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
    setPriority('normal');
    setAttachments([]);
    setPreviewFile(null);
  };

  const handleTemplateApply = (template: EmailTemplate) => {
    setSubject(template.subject);
    setMarkdown(template.content);
    setShowSettings(false); // Close settings modal after applying template
    showNotification(
      `Template "${template.name}" applied successfully!`,
      'success'
    );
  };

  const handleEmailEditorTemplateApply = (subject: string, content: string) => {
    // Clear first to ensure React detects the change
    setSubject('');
    setMarkdown('');

    // Then set the new values in the next render cycle
    requestAnimationFrame(() => {
      setSubject(subject || '');
      setMarkdown(content || '');
    });

    showNotification(
      `Template applied! ${subject ? `Subject: "${subject}"` : 'Template has no subject - you may need to edit older templates to add subjects'}`,
      subject ? 'success' : 'info'
    );
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

    // Check if already sending - cancel immediately
    if (isSending) {
      handleCancelSend();
      return;
    }

    // Start sending process with selected SMTP config
    startSendCountdown(
      toRecipients,
      ccRecipients,
      subject,
      markdown,
      attachments,
      priority,
      selectedConfig || undefined, // Use selected config or default
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

  // Handle sending with a specific SMTP configuration
  const handleSendWithConfig = () => {
    if (!toRecipients.length) {
      showNotification('Please enter at least one recipient', 'error');
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
      handleCancelSend();
      return;
    }

    // Start sending process with selected SMTP config
    startSendCountdown(
      toRecipients,
      ccRecipients,
      subject,
      markdown,
      attachments,
      priority,
      selectedConfig || undefined, // Use selected config or default
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              sx={{ color: 'inherit' }}
              onClick={() => setShowSettings(true)}
              title="SMTP Settings"
            >
              <Settings fontSize="small" />
            </IconButton>
            {onClose && (
              <IconButton
                size="small"
                sx={{ color: 'inherit' }}
                onClick={onClose}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>

        <Divider />

        {/* No SMTP Configurations Alert */}
        {!hasConfigs && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>No SMTP Configuration Found</strong>
            </Typography>
            <Typography variant="body2">
              You need to configure at least one SMTP server to send emails.
              Click the settings icon above to add your SMTP configuration.
            </Typography>
          </Alert>
        )}

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
          priority={priority}
          onPriorityChange={setPriority}
        />

        {/* Email Editor and Preview */}
        <EmailEditor
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          onTemplateApply={handleEmailEditorTemplateApply}
        />

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

            <Box sx={{ position: 'relative' }}>
              <SMTPSelector
                selectedConfig={selectedConfig}
                onConfigSelect={setSelectedConfig}
                onSend={handleSend}
                onSendWithConfig={handleSendWithConfig}
                disabled={toRecipients.length === 0 || !subject || !markdown}
                isSending={isSending}
                countdown={countdown}
              />
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
                    zIndex: 1,
                  }}
                >
                  {countdown}
                </Box>
              )}
            </Box>
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

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onTemplateApply={handleTemplateApply}
      />
    </>
  );
}
