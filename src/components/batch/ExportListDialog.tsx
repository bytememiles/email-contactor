'use client';

import React, { useState } from 'react';
import { Download } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';

import { ReceiverListSummary } from '@/types/receiver';

export interface ExportListDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (includeInvalid: boolean) => void;
  list: ReceiverListSummary | null;
  isExporting?: boolean;
}

export const ExportListDialog: React.FC<ExportListDialogProps> = ({
  open,
  onClose,
  onExport,
  list,
  isExporting = false,
}) => {
  const [includeInvalid, setIncludeInvalid] = useState(false);

  const handleExport = () => {
    onExport(includeInvalid);
  };

  const handleClose = () => {
    if (!isExporting) {
      setIncludeInvalid(false);
      onClose();
    }
  };

  if (!list) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        Export Receiver List
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            <Typography variant="body2">
              Export the receiver list as a CSV file that can be opened in
              Excel, Google Sheets, or any spreadsheet application.
            </Typography>
          </Alert>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              List Information:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Name:</strong> {list.name}
            </Typography>
            {list.description && (
              <Typography variant="body2" color="text.secondary">
                <strong>Description:</strong> {list.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>Total Receivers:</strong> {list.totalReceivers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Valid Receivers:</strong> {list.validReceivers}
            </Typography>
            {list.totalReceivers > list.validReceivers && (
              <Typography variant="body2" color="text.secondary">
                <strong>Invalid Receivers:</strong>{' '}
                {list.totalReceivers - list.validReceivers}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Options:
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeInvalid}
                  onChange={(e) => setIncludeInvalid(e.target.checked)}
                  disabled={isExporting}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Include invalid receivers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {includeInvalid
                      ? `Will export all ${list.totalReceivers} receivers`
                      : `Will export only ${list.validReceivers} valid receivers`}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Format:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The CSV file will include the following columns:
            </Typography>
            <Box
              component="ul"
              sx={{
                mt: 1,
                mb: 0,
                pl: 2,
                '& li': {
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                },
              }}
            >
              <li>Full Name</li>
              <li>Emails (semicolon-separated)</li>
              <li>Location</li>
              <li>Timezone</li>
              <li>Timezone Source</li>
              <li>Validation Status</li>
              <li>Validation Errors</li>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          color="success"
          startIcon={
            isExporting ? <CircularProgress size={16} /> : <Download />
          }
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
