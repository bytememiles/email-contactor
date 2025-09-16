import React, { useRef, useState } from 'react';
import { Download, UploadFile } from '@mui/icons-material';
import {
  Alert,
  Box,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';

import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import { EmailEditorProps } from '@/types/email';
import { EmailTemplate } from '@/types/template';

import { TemplateSelector } from './TemplateSelector';

export const EmailEditor: React.FC<EmailEditorProps> = ({
  markdown,
  onMarkdownChange,
  onTemplateApply,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a markdown file
    const allowedExtensions = ['.md', '.markdown', '.txt'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      setUploadStatus({
        open: true,
        message: 'Please upload a markdown file (.md, .markdown, or .txt)',
        severity: 'error',
      });
      event.target.value = ''; // Reset input
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        open: true,
        message: 'File size should be less than 5MB',
        severity: 'error',
      });
      event.target.value = ''; // Reset input
      return;
    }

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onMarkdownChange(content);
        setUploadStatus({
          open: true,
          message: `Successfully loaded "${file.name}"`,
          severity: 'success',
        });
      }
    };

    reader.onerror = () => {
      setUploadStatus({
        open: true,
        message: 'Failed to read the file. Please try again.',
        severity: 'error',
      });
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input for next upload
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCloseUploadStatus = () => {
    setUploadStatus((prev) => ({ ...prev, open: false }));
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    if (onTemplateApply) {
      onTemplateApply(template.subject || '', template.content || '');
      // Don't show notification here - let the parent component handle it
    } else {
      // Fallback: just set the content if no callback provided
      onMarkdownChange(template.content || '');
      setUploadStatus({
        open: true,
        message: `Template "${template.name}" content loaded!`,
        severity: 'success',
      });
    }
  };

  const handleDownload = () => {
    if (!markdown.trim()) {
      setUploadStatus({
        open: true,
        message: 'No content to download. Please write some markdown first.',
        severity: 'error',
      });
      return;
    }

    // Create a blob with the markdown content
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Create a temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-content-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setUploadStatus({
      open: true,
      message: 'Markdown file downloaded successfully!',
      severity: 'success',
    });
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
          borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
          borderBottom: {
            xs: `1px solid ${theme.palette.divider}`,
            md: 'none',
          },
          minHeight: { xs: '50%', md: 'auto' },
        }}
      >
        <Box
          sx={{
            p: { xs: 0.5, sm: 1 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: { xs: 40, sm: 48 }, // Fixed height instead of minHeight
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            ✍️ Markdown Editor
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Template Selector */}
            <TemplateSelector
              onTemplateSelect={handleTemplateSelect}
              disabled={false}
            />

            <Tooltip title="Download Current Content as Markdown">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={!markdown.trim()}
                  sx={{
                    color: markdown.trim() ? 'text.secondary' : 'text.disabled',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                    '&:disabled': {
                      color: 'text.disabled',
                    },
                  }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Upload Markdown File (.md, .markdown, .txt)">
              <IconButton
                size="small"
                onClick={handleUploadClick}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <UploadFile fontSize="small" />
              </IconButton>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            height: { xs: 'calc(100% - 40px)', sm: 'calc(100% - 48px)' },
            p: { xs: 0.5, sm: 1 },
          }}
        >
          <MDEditor
            value={markdown}
            onChange={(val) => onMarkdownChange(val || '')}
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
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            height: { xs: 40, sm: 48 }, // Fixed height to match editor header
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
            height: { xs: 'calc(100% - 40px)', sm: 'calc(100% - 48px)' },
            overflow: 'auto',
            fontSize: { xs: '14px', sm: '16px' },
          }}
        >
          {renderPreview()}
        </Box>
      </Box>

      {/* Upload Status Notification */}
      <Snackbar
        open={uploadStatus.open}
        autoHideDuration={4000}
        onClose={handleCloseUploadStatus}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseUploadStatus}
          severity={uploadStatus.severity}
          sx={{ width: '100%' }}
        >
          {uploadStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
