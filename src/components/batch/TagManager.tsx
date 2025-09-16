import React, { useState } from 'react';
import {
  Add,
  Close,
  Delete,
  Edit,
  LocalOffer,
  Palette,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { DEFAULT_TAG_COLORS, ReceiverTag, TagForm } from '@/types/receiver';

interface TagManagerProps {
  tags: ReceiverTag[];
  onAddTag: (tag: TagForm) => void;
  onUpdateTag: (id: string, tag: TagForm) => void;
  onDeleteTag: (id: string) => void;
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagDeselect?: (tagId: string) => void;
  onGlobalTagAssign?: (tagId: string) => void;
  showGlobalAssignment?: boolean;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  selectedTags = [],
  onTagSelect,
  onTagDeselect,
  onGlobalTagAssign,
  showGlobalAssignment = false,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<ReceiverTag | null>(null);
  const [formData, setFormData] = useState<TagForm>({
    name: '',
    color: DEFAULT_TAG_COLORS[0],
  });
  const [errors, setErrors] = useState<Partial<TagForm>>({});

  const handleOpenDialog = (tag?: ReceiverTag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({ name: tag.name, color: tag.color });
    } else {
      setEditingTag(null);
      setFormData({ name: '', color: DEFAULT_TAG_COLORS[0] });
    }
    setErrors({});
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTag(null);
    setFormData({ name: '', color: DEFAULT_TAG_COLORS[0] });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TagForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = 'Tag name must be 20 characters or less';
    } else {
      // Check for duplicate names (excluding current tag if editing)
      const existingTag = tags.find(
        (tag) =>
          tag.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          tag.id !== editingTag?.id
      );
      if (existingTag) {
        newErrors.name = 'Tag name already exists';
      }
    }

    if (!formData.color) {
      newErrors.color = 'Tag color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const tagData: TagForm = {
      name: formData.name.trim(),
      color: formData.color,
    };

    if (editingTag) {
      onUpdateTag(editingTag.id, tagData);
    } else {
      onAddTag(tagData);
    }

    handleCloseDialog();
  };

  const handleTagClick = (tagId: string, event: React.MouseEvent) => {
    // Check if it's a global assignment action (double-click or with modifier key)
    if (showGlobalAssignment && (event.detail === 2 || event.shiftKey)) {
      onGlobalTagAssign?.(tagId);
      return;
    }

    // Regular selection behavior
    if (selectedTags.includes(tagId)) {
      onTagDeselect?.(tagId);
    } else {
      onTagSelect?.(tagId);
    }
  };

  const isTagSelected = (tagId: string) => selectedTags.includes(tagId);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocalOffer sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Available Tags
          </Typography>
        </Box>
        {showGlobalAssignment && (
          <Typography variant="caption" color="text.secondary">
            Double-click or Shift+click a tag to assign it to all valid
            receivers. Click to select for bulk assignment.
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {tags.map((tag) => (
          <Tooltip
            key={tag.id}
            title={
              showGlobalAssignment
                ? 'Click to select, Double-click or Shift+click to assign to all receivers'
                : 'Click to select for bulk assignment'
            }
          >
            <Chip
              label={tag.name}
              onClick={(e) => handleTagClick(tag.id, e)}
              onDelete={onTagSelect ? undefined : () => onDeleteTag(tag.id)}
              variant={isTagSelected(tag.id) ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: isTagSelected(tag.id)
                  ? tag.color
                  : 'transparent',
                borderColor: tag.color,
                color: isTagSelected(tag.id) ? '#fff' : tag.color,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: tag.color,
                  color: '#fff',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
                '& .MuiChip-deleteIcon': {
                  color: 'inherit',
                },
              }}
              deleteIcon={
                onTagSelect ? undefined : (
                  <Tooltip title="Delete tag">
                    <Delete sx={{ fontSize: 18 }} />
                  </Tooltip>
                )
              }
              icon={
                onTagSelect ? undefined : (
                  <Tooltip title="Edit tag">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(tag);
                      }}
                      sx={{
                        padding: 0,
                        minWidth: 'auto',
                        color: 'inherit',
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      <Edit sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )
              }
            />
          </Tooltip>
        ))}

        <Chip
          label="Add Tag"
          onClick={() => handleOpenDialog()}
          variant="outlined"
          icon={<Add />}
          sx={{
            borderStyle: 'dashed',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Stack>

      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Tag Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              inputProps={{ maxLength: 20 }}
            />

            <FormControl fullWidth error={!!errors.color}>
              <InputLabel>Color</InputLabel>
              <Select
                value={formData.color}
                label="Color"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, color: e.target.value }))
                }
              >
                {DEFAULT_TAG_COLORS.map((color) => (
                  <MenuItem key={color} value={color}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: color,
                          borderRadius: '50%',
                          border: '1px solid #ccc',
                        }}
                      />
                      {color}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.name && formData.color && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Preview:
                </Typography>
                <Chip
                  label={formData.name}
                  sx={{
                    backgroundColor: formData.color,
                    color: '#fff',
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={editingTag ? <Edit /> : <Add />}
          >
            {editingTag ? 'Update' : 'Create'} Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
