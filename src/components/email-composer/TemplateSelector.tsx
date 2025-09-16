import React, { useState } from 'react';
import { Description, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTemplates } from '@/hooks/useTemplates';
import { EmailTemplate } from '@/types/template';

interface TemplateSelectorProps {
  onTemplateSelect: (template: EmailTemplate) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  disabled = false,
}) => {
  const { templates, loading } = useTemplates();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Filter for valid templates only
  const validTemplates = templates.filter((template) => template.isValid);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    onTemplateSelect(template);
    handleClose();
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxLength * 0.7
      ? truncated.substring(0, lastSpace) + '…'
      : truncated + '…';
  };

  if (loading) {
    return (
      <Button
        size="small"
        disabled
        startIcon={<Description />}
        sx={{ color: 'text.secondary' }}
      >
        Loading...
      </Button>
    );
  }

  if (validTemplates.length === 0) {
    return null; // Don't show if no valid templates
  }

  return (
    <>
      <Tooltip
        title={`Select from ${validTemplates.length} available template${validTemplates.length !== 1 ? 's' : ''}`}
      >
        <Button
          size="small"
          onClick={handleClick}
          disabled={disabled}
          startIcon={<Description />}
          endIcon={<ExpandMore />}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            minWidth: { xs: 'auto', sm: 'auto' },
            px: { xs: 1, sm: 1.5 },
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'action.hover',
            },
            '&:disabled': {
              color: 'text.disabled',
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Templates ({validTemplates.length})
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            {validTemplates.length}
          </Box>
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            minWidth: 320,
            maxWidth: 400,
          },
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Select Template
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Choose a template to populate your email
          </Typography>
        </Box>

        {validTemplates.map((template) => (
          <MenuItem
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            sx={{
              py: 1.5,
              px: 2,
              flexDirection: 'column',
              alignItems: 'flex-start',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Description fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {truncateText(template.name, 30)}
                  </Typography>
                }
                sx={{ margin: 0 }}
              />
              <Chip
                label="Valid"
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                pl: 4,
                width: '100%',
                display: 'block',
                fontStyle: 'italic',
              }}
            >
              Subject:{' '}
              {template.subject
                ? truncateText(template.subject, 40)
                : 'No subject'}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ pl: 4, mt: 0.5 }}
            >
              Updated {template.updatedAt.toLocaleDateString()}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
