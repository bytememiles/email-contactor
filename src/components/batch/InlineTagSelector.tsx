import React, { useState } from 'react';
import { Add } from '@mui/icons-material';
import {
  Box,
  Chip,
  ClickAwayListener,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';

import { ReceiverTag } from '@/types/receiver';

interface InlineTagSelectorProps {
  receiverId: string;
  assignedTags: ReceiverTag[];
  availableTags: ReceiverTag[];
  onAddTag: (receiverId: string, tagId: string) => void;
  onRemoveTag: (receiverId: string, tagId: string) => void;
}

export const InlineTagSelector: React.FC<InlineTagSelectorProps> = ({
  receiverId,
  assignedTags,
  availableTags,
  onAddTag,
  onRemoveTag,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTagAdd = (tagId: string) => {
    onAddTag(receiverId, tagId);
    handleClose();
  };

  const handleTagRemove = (tagId: string) => {
    onRemoveTag(receiverId, tagId);
  };

  // Filter out already assigned tags
  const unassignedTags = availableTags.filter(
    (tag) => !assignedTags.some((assigned) => assigned.id === tag.id)
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.5,
        flexWrap: 'wrap',
        minHeight: 32,
        width: '100%',
        maxWidth: 240,
      }}
    >
      {/* Assigned Tags */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          flexWrap: 'wrap',
          gap: 0.5,
          flex: 1,
        }}
      >
        {assignedTags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            size="small"
            onDelete={() => handleTagRemove(tag.id)}
            sx={{
              backgroundColor: tag.color,
              color: '#fff',
              '& .MuiChip-deleteIcon': {
                color: '#fff',
              },
            }}
          />
        ))}
      </Stack>

      {/* Add Tag Button */}
      {unassignedTags.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              width: 24,
              height: 24,
              border: '1px dashed #ccc',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
            }}
          >
            <Add sx={{ fontSize: 14 }} />
          </IconButton>

          <Popper
            open={open}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ zIndex: 1300 }}
          >
            <ClickAwayListener onClickAway={handleClose}>
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <MenuList dense>
                  {unassignedTags.map((tag) => (
                    <MenuItem
                      key={tag.id}
                      onClick={() => handleTagAdd(tag.id)}
                      sx={{ gap: 1 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: tag.color,
                          borderRadius: '50%',
                        }}
                      />
                      <Typography variant="body2">{tag.name}</Typography>
                    </MenuItem>
                  ))}
                </MenuList>
              </Paper>
            </ClickAwayListener>
          </Popper>
        </>
      )}

      {/* No tags state */}
      {assignedTags.length === 0 && unassignedTags.length === 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: 'nowrap' }}
        >
          No tags available
        </Typography>
      )}
      {assignedTags.length === 0 && unassignedTags.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: 'nowrap' }}
        >
          Click + to add tags
        </Typography>
      )}
    </Box>
  );
};
