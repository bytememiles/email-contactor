import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { convertMarkdownToEmail, addEmailStyles } from '@/lib/markdown';
import { EmailEditorProps } from '@/types/email';

export const EmailEditor: React.FC<EmailEditorProps> = ({
  markdown,
  onMarkdownChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  );
};
