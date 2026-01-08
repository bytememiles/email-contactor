import React from 'react';
import { Delete, Warning, Work } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { EmailJob } from '@/types/job';
import { ReceiverListSummary } from '@/types/receiver';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  list: ReceiverListSummary | null;
  linkedJobs?: EmailJob[];
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  list,
  linkedJobs = [],
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const hasLinkedJobs = linkedJobs.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        <Warning color="warning" />
        Confirm Delete
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
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

            {hasLinkedJobs && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'error.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'error.200',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Work color="error" />
                  <Typography variant="subtitle2" color="error.main">
                    <strong>Cannot Delete: Linked Jobs Found</strong>
                  </Typography>
                </Box>
                <Typography variant="body2" color="error.main" gutterBottom>
                  This list is linked to {linkedJobs.length} job(s). Please
                  delete or update the linked jobs before deleting this list.
                </Typography>
                <Box
                  sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}
                >
                  {linkedJobs.map((job) => (
                    <Chip
                      key={job.id}
                      icon={<Work />}
                      label={`Job ${job.id.slice(0, 8)}... (${job.status})`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {!hasLinkedJobs && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                <strong>Warning:</strong> This action cannot be undone. All
                receiver data will be permanently lost.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<Delete />}
          disabled={hasLinkedJobs}
        >
          Delete List
        </Button>
      </DialogActions>
    </Dialog>
  );
};
