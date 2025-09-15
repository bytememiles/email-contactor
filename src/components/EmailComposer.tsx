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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Close, Send, AttachFile, Preview, Edit } from '@mui/icons-material';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function EmailComposer({ onClose, onSend }: EmailComposerProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [tabValue, setTabValue] = useState(0);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          minHeight: 200,
          maxHeight: 400,
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
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 20,
          width: 600,
          maxWidth: 'calc(100vw - 40px)',
          height: 500,
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
        }}
      >
        {/* Header */}
        <Toolbar
          sx={{
            backgroundColor: 'primary.dark',
            color: 'primary.contrastText',
            minHeight: '48px !important',
            px: 2,
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '14px' }}>
            New Message
          </Typography>
          <IconButton size="small" sx={{ color: 'inherit' }} onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Toolbar>

        <Divider />

        {/* Email Fields */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            margin="dense"
            variant="outlined"
          />
          <TextField
            fullWidth
            size="small"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="dense"
            variant="outlined"
          />
        </Box>

        {/* Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<Edit fontSize="small" />}
              label="Edit"
              iconPosition="start"
              sx={{ minHeight: 40 }}
            />
            <Tab
              icon={<Preview fontSize="small" />}
              label="Preview"
              iconPosition="start"
              sx={{ minHeight: 40 }}
            />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ height: '100%', p: 1 }}>
              <MDEditor
                value={markdown}
                onChange={(val) => setMarkdown(val || '')}
                height={250}
                preview="edit"
                hideToolbar
                visibleDragbar={false}
                data-color-mode="light"
              />
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              {renderPreview()}
            </Box>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              sx={{
                backgroundColor: isSending ? 'warning.main' : 'primary.main',
                '&:hover': {
                  backgroundColor: isSending ? 'warning.dark' : 'primary.dark',
                },
              }}
            >
              {isSending ? 'Cancel Send' : 'Send'}
            </Button>

            <IconButton size="small" disabled>
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
