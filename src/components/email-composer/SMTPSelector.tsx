import React, { useState } from 'react';
import { CheckCircle, Email, KeyboardArrowUp, Send } from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { useSMTPConfigsRedux } from '@/hooks/useSMTPConfigsRedux';
import { SMTPSelectorProps } from '@/types/smtp';

export const SMTPSelector: React.FC<SMTPSelectorProps> = ({
  selectedConfig,
  onConfigSelect,
  onSend,
  onSendWithConfig,
  disabled = false,
  isSending = false,
  countdown = 0,
}) => {
  const { configs } = useSMTPConfigsRedux();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle direct send with default SMTP
  const handleDirectSend = () => {
    handleClose();
    onSend();
  };

  // Handle opening SMTP selection dropdown
  const handleSelectSMTP = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConfigSelect = (configId: string) => {
    const config = configs.find((c) => c.id === configId) || null;
    onConfigSelect(config);
    handleClose();
    // Auto-send after selection with the specific config
    setTimeout(() => (onSendWithConfig ? onSendWithConfig() : onSend()), 100);
  };

  // Show dropdown arrow only if there are multiple configs
  const showDropdown = configs.length > 1;
  const currentConfig =
    selectedConfig || configs.find((c) => c.isDefault) || configs[0];

  const getTooltipText = () => {
    if (isSending && countdown > 0) {
      return `Cancel sending (${countdown}s remaining)`;
    }
    if (disabled) {
      return 'Please fill in recipient, subject, and message';
    }
    return 'Send email with default SMTP';
  };

  return (
    <>
      <ButtonGroup
        variant="contained"
        disabled={disabled}
        sx={{
          '& .MuiButton-root': {
            fontSize: { xs: '14px', sm: '16px' },
            height: { xs: 40, sm: 36 },
            minHeight: { xs: 40, sm: 36 },
            maxHeight: { xs: 40, sm: 36 },
          },
        }}
      >
        {/* Main Send Button */}
        <Tooltip title={getTooltipText()}>
          <span>
            {' '}
            {/* Tooltip needs a span wrapper for disabled buttons */}
            <Button
              startIcon={<Send />}
              onClick={handleDirectSend}
              disabled={disabled && !isSending}
              color={isSending && countdown > 0 ? 'warning' : 'primary'}
              sx={{
                px: 2,
                height: { xs: 40, sm: 36 },
              }}
            >
              {isSending && countdown > 0 ? 'Cancel' : 'Send'}
            </Button>
          </span>
        </Tooltip>

        {/* SMTP Selection Button */}
        <Tooltip title="Select SMTP configuration">
          <span>
            <Button
              onClick={handleSelectSMTP}
              disabled={disabled || isSending}
              sx={{
                minWidth: { xs: 40, sm: 36 },
                width: { xs: 40, sm: 36 },
                height: { xs: 40, sm: 36 },
                px: 1,
              }}
            >
              <KeyboardArrowUp />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 280,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, backgroundColor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Choose SMTP Configuration & Send
          </Typography>
        </Box>

        <Divider />

        {/* Other configurations */}
        {configs.map((config) => (
          <MenuItem
            key={config.id}
            onClick={() => handleConfigSelect(config.id)}
            selected={config.id === currentConfig?.id}
          >
            <ListItemIcon>
              {config.id === currentConfig?.id ? (
                <CheckCircle fontSize="small" color="primary" />
              ) : (
                <Email fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{config.name}</Typography>
                  {config.isDefault && (
                    <Chip label="Default" size="small" variant="outlined" />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {config.fromAddress} • {config.host}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
