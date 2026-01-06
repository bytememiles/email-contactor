import React, { useState } from 'react';
import {
  BatchPrediction,
  Close,
  Description,
  Settings,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';

import { SettingsModalProps } from '@/types/smtp';

import { BatchOperationsTab } from './BatchOperationsTab';
import { SMTPTab } from './SMTPTab';
import { TemplatesTab } from './TemplatesTab';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onTemplateApply,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '600px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        SMTP Settings
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="fullWidth"
        >
          <Tab
            icon={<Settings />}
            label="SMTP"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<BatchPrediction />}
            label="Batch Operations"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<Description />}
            label="Templates"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: 400,
          }}
        >
          {activeTab === 0 && <SMTPTab />}
          {activeTab === 1 && <BatchOperationsTab />}
          {activeTab === 2 && (
            <TemplatesTab onTemplateApply={onTemplateApply} />
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
