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
  onSave: (formData: ReceiverListForm, saveMode: 'save' | 'saveAsCopy') => void;
  sourceFileName?: string;
  receiverCount: number;
  validCount: number;
  editingListId?: string | null;
  existingListName?: string;
  existingListDescription?: string;
  saveMode?: 'save' | 'saveAsCopy';
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
  saveMode = 'save',
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

    onSave(
      {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      },
      saveMode
    );

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
  const isSaveAsCopy = saveMode === 'saveAsCopy';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        {isEditing && !isSaveAsCopy
          ? 'Update Receiver List'
          : isSaveAsCopy
            ? 'Save Receiver List (Copy)'
            : 'Save Receiver List'}
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isEditing && !isSaveAsCopy
            ? 'Update the receiver list with your changes.'
            : isSaveAsCopy
              ? 'Save a copy of the receiver list with your changes.'
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
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!formData.name.trim()}
        >
          {isEditing && !isSaveAsCopy
            ? 'Update List'
            : isSaveAsCopy
              ? 'Save as Copy'
              : 'Save List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
