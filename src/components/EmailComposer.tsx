'use client';

import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import { AttachFile, Close, Send } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import React, { useRef, useState } from 'react';

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

  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendTimer, setSendTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
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

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // File attachment functions
  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const actualSendEmail = async () => {
    try {
      const { html, text } = convertMarkdownToEmail(markdown);
      const styledHtml = addEmailStyles(html);

      // Process attachments
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          return {
            filename: file.name,
            content: base64,
            encoding: 'base64' as const,
          };
        })
      );

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toRecipients.join(','),
          cc: ccRecipients.length > 0 ? ccRecipients.join(',') : undefined,
          subject,
          html: styledHtml,
          text,
          attachments:
            processedAttachments.length > 0 ? processedAttachments : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Email sent successfully!', 'success');
        // Reset form
        setToRecipients([]);
        setCcRecipients([]);
        setShowCc(false);
        setSubject('');
        setMarkdown('');
        setAttachments([]);
        if (onSend) {
          onSend({
            to: toRecipients.join(','),
            subject,
            html: styledHtml,
            text,
          });
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
    setIsSending(true);
    setCountdown(5);
    showNotification(
      'Email will be sent in 3 seconds. Click send again to cancel.',
      'info'
    );

    // Countdown interval
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set 3-second delay
    const timeout = setTimeout(() => {
      clearInterval(countdownInterval);
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
    setCountdown(0);
    setShowCancelDialog(false);
    showNotification('Email sending cancelled', 'info');
  };

  const renderPreview = () => {
    if (!markdown.trim()) {
      return (
        <Box
          sx={{
            color: 'text.secondary',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography>No content to preview</Typography>
        </Box>
      );
    }

    const { html } = convertMarkdownToEmail(markdown);
    const styledHtml = addEmailStyles(html);

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
      >
        <iframe
          srcDoc={styledHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: 'white',
          }}
          title="Email Preview"
        />
      </Box>
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
          {/* To Field with Autocomplete */}
          <Box sx={{ position: 'relative' }}>
            <Autocomplete
              multiple
              freeSolo
              disableClearable
              value={toRecipients}
              onChange={(event, newValue) => {
                // Filter out invalid emails
                const validEmails = newValue.filter(
                  (email) => typeof email === 'string' && validateEmail(email)
                );
                setToRecipients(validEmails);
              }}
              options={[]} // No predefined options, user types emails
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={index}
                    sx={{
                      fontSize: { xs: '12px', sm: '14px' },
                      height: { xs: 24, sm: 28 },
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="To"
                  size="small"
                  margin="dense"
                  placeholder="recipient@example.com"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '14px', sm: '16px' },
                      paddingRight: showCc
                        ? '16px !important'
                        : '60px !important',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '14px', sm: '16px' },
                    },
                  }}
                />
              )}
            />

            {/* CC link */}
            {!showCc && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: 1,
                }}
                onClick={() => setShowCc(true)}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontSize: { xs: '12px', sm: '14px' },
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  CC
                </Typography>
              </Box>
            )}
          </Box>

          {/* CC Field with Autocomplete - only show when showCc is true */}
          {showCc && (
            <Box sx={{ position: 'relative', mt: 1 }}>
              <Autocomplete
                multiple
                freeSolo
                disableClearable
                value={ccRecipients}
                onChange={(event, newValue) => {
                  // Filter out invalid emails
                  const validEmails = newValue.filter(
                    (email) => typeof email === 'string' && validateEmail(email)
                  );
                  setCcRecipients(validEmails);
                }}
                options={[]} // No predefined options, user types emails
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={index}
                      sx={{
                        fontSize: { xs: '12px', sm: '14px' },
                        height: { xs: 24, sm: 28 },
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="CC"
                    size="small"
                    margin="dense"
                    placeholder="cc@example.com (optional)"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '14px', sm: '16px' },
                        paddingRight: '50px !important',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: { xs: '14px', sm: '16px' },
                      },
                    }}
                  />
                )}
              />

              {/* Close CC button */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  zIndex: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => {
                  setShowCc(false);
                  setCcRecipients([]);
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            size="small"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="dense"
            variant="outlined"
            placeholder="Email subject"
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

        {/* Attachments */}
        {attachments.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'grey.50',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: 'text.secondary' }}
            >
              Attachments ({attachments.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={`${file.name} (${formatFileSize(file.size)})`}
                  onDelete={() => removeAttachment(index)}
                  size="small"
                  sx={{ maxWidth: 300 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end', // Align to the right
              gap: 1,
            }}
          >
            <IconButton
              size="small"
              component="label"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' }, // Hide on mobile
              }}
            >
              <AttachFile fontSize="small" />
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileAttachment}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
              />
            </IconButton>

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
    </>
  );
}
