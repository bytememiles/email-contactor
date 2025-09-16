import React from 'react';
import { Delete, Warning } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { ReceiverListSummary } from '@/types/receiver';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  list: ReceiverListSummary | null;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  list,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        Confirm Delete
      </DialogTitle>

      <DialogContent>
        {list && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete this receiver list?
            </Typography>

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                <strong>{list.name}</strong>
              </Typography>

              {list.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {list.description}
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                • {list.totalReceivers} total receivers ({list.validReceivers}{' '}
                valid)
                <br />• Created:{' '}
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(list.createdAt)}
                {list.sourceFileName && (
                  <>
                    <br />• Source: {list.sourceFileName}
                  </>
                )}
              </Typography>
            </Box>

            <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
              <strong>Warning:</strong> This action cannot be undone. All
              receiver data and tag assignments will be permanently lost.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<Delete />}
        >
          Delete List
        </Button>
      </DialogActions>
    </Dialog>
  );
};
