'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Toolbar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Send, AttachFile } from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import { convertMarkdownToEmail, addEmailStyles } from '@/lib/markdown';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailComposerProps {
  onClose?: () => void;
  onSend?: (emailData: EmailData) => void;
}

export default function EmailComposer({ onClose, onSend }: EmailComposerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendTimer, setSendTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info'
  ) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const actualSendEmail = async () => {
    try {
      const { html, text } = convertMarkdownToEmail(markdown);
      const styledHtml = addEmailStyles(html);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html: styledHtml,
          text,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Email sent successfully!', 'success');
        // Reset form
        setTo('');
        setSubject('');
        setMarkdown('');
        if (onSend) {
          onSend({ to, subject, html: styledHtml, text });
        }
      } else {
        showNotification(result.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('Failed to send email. Please try again.', 'error');
    } finally {
      setIsSending(false);
      setSendTimer(null);
      sendTimeoutRef.current = null;
    }
  };

  const handleSend = () => {
    // Validation
    if (!to.trim()) {
      showNotification('Please enter a recipient email address', 'error');
      return;
    }

    if (!validateEmail(to.trim())) {
      showNotification('Please enter a valid email address', 'error');
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
    setIsSending(true);
    showNotification(
      'Email will be sent in 3 seconds. Click send again to cancel.',
      'info'
    );

    // Set 3-second delay
    const timeout = setTimeout(() => {
      actualSendEmail();
    }, 3000);

    setSendTimer(timeout);
    sendTimeoutRef.current = timeout;
  };

  const handleCancelSend = () => {
    if (sendTimer) {
      clearTimeout(sendTimer);
      setSendTimer(null);
      sendTimeoutRef.current = null;
    }
    setIsSending(false);
    setShowCancelDialog(false);
    showNotification('Email sending cancelled', 'info');
  };

  const renderPreview = () => {
    if (!markdown.trim()) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>No content to preview</Typography>
        </Box>
      );
    }

    const { html } = convertMarkdownToEmail(markdown);

    return (
      <Box
        sx={{
          p: 2,
          height: '100%',
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
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

        {/* Email Fields */}
        <Box
          sx={{ p: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            fullWidth
            size="small"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            margin="dense"
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '14px', sm: '16px' },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '14px', sm: '16px' },
              },
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="dense"
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '14px', sm: '16px' },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '14px', sm: '16px' },
              },
            }}
          />
        </Box>

        {/* Content Area - Responsive Layout */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile, side-by-side on desktop
          }}
        >
          {/* Editor Side */}
          <Box
            sx={{
              flex: 1,
              borderRight: { xs: 0, md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
              minHeight: { xs: '50%', md: 'auto' },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.5, sm: 1 },
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                display: 'flex',
                alignItems: 'center',
                minHeight: { xs: 32, sm: 40 },
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                ✍️ Markdown Editor
              </Typography>
            </Box>
            <Box
              sx={{
                height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 40px)' },
                p: { xs: 0.5, sm: 1 },
              }}
            >
              <MDEditor
                value={markdown}
                onChange={(val) => setMarkdown(val || '')}
                height="100%"
                preview="edit"
                hideToolbar
                visibleDragbar={false}
                data-color-mode="light"
                style={{
                  fontSize: isMobile ? '14px' : '16px',
                }}
              />
            </Box>
          </Box>

          {/* Preview Side */}
          <Box
            sx={{
              flex: 1,
              minHeight: { xs: '50%', md: 'auto' },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.5, sm: 1 },
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                display: 'flex',
                alignItems: 'center',
                minHeight: { xs: 32, sm: 40 },
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                👁️ Live Preview
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1,
                height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 40px)' },
                overflow: 'auto',
                fontSize: { xs: '14px', sm: '16px' },
              }}
            >
              {renderPreview()}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Button
              variant="contained"
              startIcon={
                isSending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Send />
                )
              }
              onClick={handleSend}
              disabled={!to || !subject || !markdown}
              fullWidth={isMobile}
              sx={{
                backgroundColor: isSending ? 'warning.main' : 'primary.main',
                fontSize: { xs: '14px', sm: '16px' },
                minHeight: { xs: 40, sm: 36 },
                '&:hover': {
                  backgroundColor: isSending ? 'warning.dark' : 'primary.dark',
                },
              }}
            >
              {isSending ? 'Cancel Send' : 'Send'}
            </Button>

            <IconButton
              size="small"
              disabled
              sx={{
                display: { xs: 'none', sm: 'inline-flex' }, // Hide on mobile
              }}
            >
              <AttachFile fontSize="small" />
            </IconButton>
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
    </>
  );
}
