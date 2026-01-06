import React, { useEffect, useState } from 'react';
import { Save } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

import { ReceiverListForm } from '@/types/receiver';

interface SaveListDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: ReceiverListForm) => void;
  sourceFileName?: string;
  receiverCount: number;
  validCount: number;
  editingListId?: string | null;
  existingListName?: string;
  existingListDescription?: string;
}

export const SaveListDialog: React.FC<SaveListDialogProps> = ({
  open,
  onClose,
  onSave,
  sourceFileName,
  receiverCount,
  validCount,
  editingListId,
  existingListName,
  existingListDescription,
}) => {
  const [formData, setFormData] = useState<ReceiverListForm>({
    name:
      existingListName ||
      (sourceFileName ? sourceFileName.replace('.csv', '') : ''),
    description: existingListDescription || '',
  });
  const [errors, setErrors] = useState<Partial<ReceiverListForm>>({});

  // Update form data when dialog opens or editing list changes
  useEffect(() => {
    if (open) {
      setFormData({
        name:
          existingListName ||
          (sourceFileName ? sourceFileName.replace('.csv', '') : ''),
        description: existingListDescription || '',
      });
    }
  }, [open, existingListName, existingListDescription, sourceFileName]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ReceiverListForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'List name is required';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'List name must be 50 characters or less';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    onSave({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    });

    // Reset form
    setFormData({
      name:
        existingListName ||
        (sourceFileName ? sourceFileName.replace('.csv', '') : ''),
      description: existingListDescription || '',
    });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const isEditing = !!editingListId;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Update Receiver List' : 'Save Receiver List'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isEditing
            ? 'Update the receiver list with your changes.'
            : 'Save the processed and validated receiver data for future use.'}
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Summary:</strong> {receiverCount} total receivers,{' '}
          {validCount} valid
          {sourceFileName && (
            <>
              <br />
              <strong>Source:</strong> {sourceFileName}
            </>
          )}
        </Typography>

        <TextField
          label="List Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          error={!!errors.name}
          helperText={errors.name}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 50 }}
        />

        <TextField
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          error={!!errors.description}
          helperText={errors.description}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          inputProps={{ maxLength: 200 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!formData.name.trim()}
        >
          {isEditing ? 'Update List' : 'Save List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
