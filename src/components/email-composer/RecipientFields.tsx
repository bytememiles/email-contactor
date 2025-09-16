import React from 'react';
import { Flag, FlagOutlined, LowPriority } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { EmailPriority, RecipientFieldsProps } from '@/types/email';
import { validateEmail } from '@/utils';

export const RecipientFields: React.FC<RecipientFieldsProps> = ({
  toRecipients,
  ccRecipients,
  showCc,
  onToRecipientsChange,
  onCcRecipientsChange,
  onShowCcChange,
  subject,
  onSubjectChange,
  priority,
  onPriorityChange,
}) => {
  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
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
            onToRecipientsChange(validEmails);
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
                  paddingRight: showCc ? '16px !important' : '60px !important',
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
            onClick={() => onShowCcChange(true)}
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
              onCcRecipientsChange(validEmails);
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
              onShowCcChange(false);
              onCcRecipientsChange([]);
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
        onChange={(e) => onSubjectChange(e.target.value)}
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

      {/* Priority Selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priority || 'normal'}
            onChange={(e) => onPriorityChange(e.target.value as EmailPriority)}
            label="Priority"
          >
            <MenuItem value="low">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LowPriority fontSize="small" color="action" />
                <Typography>Low</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="normal">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlagOutlined fontSize="small" color="action" />
                <Typography>Normal</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="high">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Flag fontSize="small" color="error" />
                <Typography>High</Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '12px' }}
        >
          Recipients will see this priority level in their email client
        </Typography>
      </Box>
    </Box>
  );
};
