import React, { useRef, useState } from 'react';
import {
  Add,
  CheckCircle,
  CloudUpload,
  Delete,
  Edit,
  Error,
  Visibility,
} from '@mui/icons-material';
import {
  Alert,
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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTemplates } from '@/hooks/useTemplates';
import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import { EmailTemplate, TemplateForm } from '@/types/template';

interface TemplatesTabProps {
  onTemplateApply?: (template: EmailTemplate) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  onTemplateApply,
}) => {
  const {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    validateTemplate,
  } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TemplateForm>({
    name: '',
    subject: '',
    content: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    subject?: string;
    content?: string;
  }>({});

  const resetForm = () => {
    setFormData({ name: '', subject: '', content: '' });
    setFormErrors({});
    setEditingTemplate(null);
    setShowForm(false);
  };

  // Helper function to truncate text smartly
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    // Find the last space before the max length to avoid cutting words
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxLength * 0.7
      ? truncated.substring(0, lastSpace) + '…'
      : truncated + '…';
  };

  // Helper function to check if text is truncated
  const isTextTruncated = (text: string, maxLength: number): boolean => {
    return text.length > maxLength;
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; subject?: string; content?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Template subject is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Template content is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, formData);
    } else {
      const newTemplate = addTemplate(formData);
      setSelectedTemplate(newTemplate);
    }

    resetForm();
  };

  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = (template: EmailTemplate) => {
    deleteTemplate(template.id);
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      alert('Please select a Markdown file (.md or .markdown)');
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileName = file.name.replace(/\.(md|markdown)$/, '');

      // Try to extract subject from first line if it's a header
      const lines = content.split('\n');
      let extractedSubject = '';
      let actualContent = content;

      if (lines[0] && lines[0].startsWith('# ')) {
        extractedSubject = lines[0].replace('# ', '').trim();
        actualContent = lines.slice(1).join('\n').trim();
      }

      setFormData({
        name: fileName,
        subject: extractedSubject,
        content: actualContent,
      });
      setShowForm(true);
      setUploading(false);
    };

    reader.onerror = () => {
      alert('Error reading file');
      setUploading(false);
    };

    reader.readAsText(file);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get the current template from the templates array to ensure we have the latest data
  const currentTemplate = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate.id) || selectedTemplate
    : null;

  const currentValidation = currentTemplate
    ? {
        isValid: currentTemplate.isValid,
        errors: currentTemplate.validationErrors,
        warnings: [],
      }
    : null;

  // Helper function to render iframe preview
  const renderTemplatePreview = (content: string, height: string = '300px') => {
    if (!content.trim()) {
      return (
        <Box
          sx={{
            height,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">No content to preview</Typography>
        </Box>
      );
    }

    const { html } = convertMarkdownToEmail(content);
    const styledHtml = addEmailStyles(html);

    return (
      <Box
        sx={{
          height,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          overflow: 'hidden',
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
          title="Template Preview"
        />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Email Templates</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.markdown"
            style={{ display: 'none' }}
          />
          <Button
            startIcon={
              uploading ? <CircularProgress size={16} /> : <CloudUpload />
            }
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="small"
          >
            Upload Markdown
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setShowForm(true)}
            size="small"
          >
            Create Template
          </Button>
        </Box>
      </Box>

      {/* Main Content - 2 Column Layout */}
      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Column - Template List */}
        <Box sx={{ flex: '0 0 300px' }}>
          <Paper
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '500px',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1">
                Templates ({templates.length})
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : templates.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No templates yet. Create your first template to get started.
                </Typography>
              </Box>
            ) : (
              <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                {templates.map((template, index) => (
                  <React.Fragment key={template.id}>
                    <ListItem disablePadding sx={{ minHeight: 72 }}>
                      <ListItemButton
                        selected={selectedTemplate?.id === template.id}
                        onClick={() => setSelectedTemplate(template)}
                        sx={{
                          pr: 9, // Reserve space for action buttons (2 buttons * ~32px + gap + padding)
                          py: 1.5, // Vertical padding for better spacing
                          minHeight: 72,
                          alignItems: 'flex-start',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                            '& .MuiTypography-root': {
                              color: 'inherit',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'inherit',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                          {template.isValid ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Error color="error" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Tooltip
                              title={
                                isTextTruncated(template.name, 30)
                                  ? template.name
                                  : ''
                              }
                              arrow
                              placement="top"
                              disableHoverListener={
                                !isTextTruncated(template.name, 30)
                              }
                            >
                              <Typography variant="body1" noWrap sx={{ pr: 1 }}>
                                {truncateText(template.name, 30)}
                              </Typography>
                            </Tooltip>
                          }
                          secondary={
                            <Box sx={{ pr: 1 }}>
                              <Tooltip
                                title={
                                  template.subject &&
                                  isTextTruncated(template.subject, 40)
                                    ? template.subject
                                    : ''
                                }
                                arrow
                                placement="bottom-start"
                                disableHoverListener={
                                  !template.subject ||
                                  !isTextTruncated(template.subject, 40)
                                }
                                sx={{ display: 'block' }}
                              >
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  sx={{
                                    mb: 0.5,
                                    cursor:
                                      template.subject &&
                                      isTextTruncated(template.subject, 40)
                                        ? 'help'
                                        : 'default',
                                    position: 'relative',
                                    '&:hover':
                                      template.subject &&
                                      isTextTruncated(template.subject, 40)
                                        ? {
                                            backgroundColor: 'action.hover',
                                            borderRadius: 0.5,
                                            px: 0.5,
                                            mx: -0.5,
                                          }
                                        : {},
                                  }}
                                >
                                  {template.subject
                                    ? truncateText(template.subject, 40)
                                    : 'No subject'}
                                </Typography>
                              </Tooltip>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                Updated{' '}
                                {template.updatedAt.toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            '& .MuiListItemText-primary': {
                              marginBottom: '4px',
                            },
                            '& .MuiListItemText-secondary': {
                              lineHeight: 1.3,
                            },
                          }}
                        />
                        <ListItemSecondaryAction
                          sx={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(template);
                              }}
                              title="Edit"
                              sx={{
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template);
                              }}
                              title="Delete"
                              color="error"
                              sx={{
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: 'error.main',
                                  color: 'white',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItemButton>
                    </ListItem>
                    {index < templates.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Right Column - Template Preview */}
        <Box sx={{ flex: 1 }}>
          <Paper
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {currentTemplate ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="subtitle1">
                      {currentTemplate.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {onTemplateApply && currentTemplate.isValid && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onTemplateApply(currentTemplate)}
                          sx={{ mr: 1 }}
                        >
                          Apply Template
                        </Button>
                      )}
                      {currentTemplate.isValid ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Valid"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<Error />}
                          label="Invalid"
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {/* Subject Preview */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Subject Line:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        maxHeight: 120,
                        overflow: 'auto',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.4,
                        }}
                      >
                        {currentTemplate.subject || 'No subject defined'}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Validation Messages */}
                  {currentValidation && !currentValidation.isValid && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        Template Validation Errors:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {currentValidation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}

                  {/* Content Preview */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Email Content:
                    </Typography>
                    <>{renderTemplatePreview(currentTemplate.content)}</>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Visibility
                  sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Select a Template
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a template from the list to preview its content and
                  validation status.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Template Form Dialog */}
      <Dialog
        open={showForm}
        onClose={resetForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' },
        }}
      >
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
            />

            <TextField
              label="Email Subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              error={!!formErrors.subject}
              helperText={
                formErrors.subject ||
                'Subject line for emails using this template. You can use [first_name] and [sender_name] as placeholders'
              }
              fullWidth
              placeholder="Enter email subject..."
            />

            <TextField
              label="Template Content (Markdown)"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              error={!!formErrors.content}
              helperText={
                formErrors.content ||
                'Use [first_name] and [sender_name] as placeholders'
              }
              multiline
              rows={12}
              fullWidth
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
            />

            {formData.content && (
              <>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Live Validation:
                  </Typography>
                  {(() => {
                    const validation = validateTemplate(formData.content);
                    return (
                      <>
                        {validation.errors.length > 0 && (
                          <Alert severity="error" sx={{ mb: 1 }}>
                            {validation.errors.map((error, index) => (
                              <Typography key={index} variant="body2">
                                • {error}
                              </Typography>
                            ))}
                          </Alert>
                        )}
                        {validation.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mb: 1 }}>
                            {validation.warnings.map((warning, index) => (
                              <Typography key={index} variant="body2">
                                • {warning}
                              </Typography>
                            ))}
                          </Alert>
                        )}
                        {validation.isValid && (
                          <Alert severity="success">
                            Template is valid and ready to use!
                          </Alert>
                        )}
                      </>
                    );
                  })()}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Live Preview:
                  </Typography>
                  {renderTemplatePreview(formData.content, '200px')}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTemplate ? 'Update' : 'Create'} Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Alert */}
      {templates.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Get Started:</strong> Create your first email template by
            uploading a Markdown file or creating one from scratch. Templates
            must include <code>[first_name]</code> and{' '}
            <code>[sender_name]</code> placeholders.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
