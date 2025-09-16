import React, { useState } from 'react';
import {
  CheckCircle,
  Delete,
  Error,
  ExpandMore,
  LocalOffer,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  ClickAwayListener,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { ProcessedReceiver, ReceiverTag } from '@/types/receiver';
import { formatTimezone } from '@/utils/csvUtils';

import { InlineTagSelector } from './InlineTagSelector';
import { TagManager } from './TagManager';

interface ReceiversTableProps {
  receivers: ProcessedReceiver[];
  tags: ReceiverTag[];
  onAddTag: (tag: { name: string; color: string }) => void;
  onUpdateTag: (id: string, tag: { name: string; color: string }) => void;
  onDeleteTag: (id: string) => void;
  onAddTagToReceiver: (receiverId: string, tagId: string) => void;
  onAddTagToMultipleReceivers: (receiverIds: string[], tagId: string) => number;
  onRemoveTagFromReceiver: (receiverId: string, tagId: string) => void;
  onDeleteReceiver: (id: string) => void;
  onUpdateReceiver?: (id: string, updates: Partial<ProcessedReceiver>) => void;
}

export const ReceiversTable: React.FC<ReceiversTableProps> = ({
  receivers,
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onAddTagToReceiver,
  onAddTagToMultipleReceivers,
  onRemoveTagFromReceiver,
  onDeleteReceiver,
  onUpdateReceiver,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);
  const [selectedTagForAssignment, setSelectedTagForAssignment] = useState<
    string[]
  >([]);
  const [globalAssignmentMessage, setGlobalAssignmentMessage] =
    useState<string>('');
  const [columnHeaderAnchorEl, setColumnHeaderAnchorEl] =
    useState<HTMLElement | null>(null);
  const [showColumnTagMenu, setShowColumnTagMenu] = useState(false);

  const handleSelectReceiver = (receiverId: string) => {
    setSelectedReceivers((prev) =>
      prev.includes(receiverId)
        ? prev.filter((id) => id !== receiverId)
        : [...prev, receiverId]
    );
  };

  const handleSelectAll = () => {
    const currentPageReceivers = receivers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    if (selectedReceivers.length === currentPageReceivers.length) {
      setSelectedReceivers([]);
    } else {
      setSelectedReceivers(currentPageReceivers.map((r) => r.id));
    }
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTagForAssignment((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleTagDeselect = (tagId: string) => {
    setSelectedTagForAssignment((prev) => prev.filter((id) => id !== tagId));
  };

  const handleAssignSelectedTags = () => {
    selectedReceivers.forEach((receiverId) => {
      selectedTagForAssignment.forEach((tagId) => {
        onAddTagToReceiver(receiverId, tagId);
      });
    });
    setSelectedTagForAssignment([]);
    setSelectedReceivers([]);
  };

  const handleGlobalTagAssign = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    // Get all valid receivers that don't already have this tag
    const validReceivers = receivers.filter(
      (r) => r.isValid && !r.tags.some((tag) => tag.id === tagId)
    );
    const receiverIds = validReceivers.map((r) => r.id);

    // Use bulk assignment method
    const assignedCount = onAddTagToMultipleReceivers(receiverIds, tagId);

    // Show feedback message
    if (assignedCount > 0) {
      setGlobalAssignmentMessage(
        `Tag "${tag.name}" assigned to ${assignedCount} valid receiver(s)`
      );
      setTimeout(() => setGlobalAssignmentMessage(''), 3000);
    } else {
      setGlobalAssignmentMessage(
        `All valid receivers already have the "${tag.name}" tag`
      );
      setTimeout(() => setGlobalAssignmentMessage(''), 3000);
    }
  };

  const handleRemoveTagFromReceiver = (receiverId: string, tagId: string) => {
    onRemoveTagFromReceiver(receiverId, tagId);
  };

  const handleColumnHeaderClick = (event: React.MouseEvent<HTMLElement>) => {
    setColumnHeaderAnchorEl(event.currentTarget);
    setShowColumnTagMenu(true);
  };

  const handleColumnMenuClose = () => {
    setColumnHeaderAnchorEl(null);
    setShowColumnTagMenu(false);
  };

  const handleColumnTagAssign = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    // Get all valid receivers that don't already have this tag
    const validReceivers = receivers.filter(
      (r) => r.isValid && !r.tags.some((tag) => tag.id === tagId)
    );
    const receiverIds = validReceivers.map((r) => r.id);

    // Use bulk assignment method
    const assignedCount = onAddTagToMultipleReceivers(receiverIds, tagId);

    // Show feedback message
    if (assignedCount > 0) {
      setGlobalAssignmentMessage(
        `Tag "${tag.name}" assigned to ${assignedCount} valid receiver(s)`
      );
      setTimeout(() => setGlobalAssignmentMessage(''), 3000);
    } else {
      setGlobalAssignmentMessage(
        `All valid receivers already have the "${tag.name}" tag`
      );
      setTimeout(() => setGlobalAssignmentMessage(''), 3000);
    }

    handleColumnMenuClose();
  };

  const validCount = receivers.filter((r) => r.isValid).length;
  const invalidCount = receivers.length - validCount;

  const currentPageReceivers = receivers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Receivers Summary
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip
            icon={<CheckCircle />}
            label={`Valid: ${validCount}`}
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<Error />}
            label={`Invalid: ${invalidCount}`}
            color="error"
            variant="outlined"
          />
          <Chip label={`Total: ${receivers.length}`} variant="outlined" />
        </Stack>
      </Box>

      {/* Tag Management */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <TagManager
          tags={tags}
          onAddTag={onAddTag}
          onUpdateTag={onUpdateTag}
          onDeleteTag={onDeleteTag}
          selectedTags={selectedTagForAssignment}
          onTagSelect={handleTagSelect}
          onTagDeselect={handleTagDeselect}
          onGlobalTagAssign={handleGlobalTagAssign}
          showGlobalAssignment={true}
        />

        {globalAssignmentMessage && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {globalAssignmentMessage}
            </Alert>
          </Box>
        )}

        {selectedReceivers.length > 0 &&
          selectedTagForAssignment.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert
                severity="info"
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Assign to ${selectedReceivers.length} receiver(s)`}
                      onClick={handleAssignSelectedTags}
                      color="primary"
                      clickable
                      size="small"
                    />
                  </Box>
                }
              >
                {selectedTagForAssignment.length} tag(s) selected,{' '}
                {selectedReceivers.length} receiver(s) selected
              </Alert>
            </Box>
          )}
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 50 }}>
                <Checkbox
                  indeterminate={
                    selectedReceivers.length > 0 &&
                    selectedReceivers.length < currentPageReceivers.length
                  }
                  checked={
                    currentPageReceivers.length > 0 &&
                    selectedReceivers.length === currentPageReceivers.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ width: 60 }}>No</TableCell>
              <TableCell sx={{ width: 80 }}>Status</TableCell>
              <TableCell sx={{ width: 150 }}>Full Name</TableCell>
              <TableCell sx={{ width: 200 }}>Email</TableCell>
              <TableCell sx={{ width: 150 }}>Location</TableCell>
              <TableCell sx={{ width: 180 }}>Timezone</TableCell>
              <TableCell sx={{ width: 250, minWidth: 250 }}>
                <Tooltip title="Click to assign tags to all valid receivers">
                  <Button
                    onClick={handleColumnHeaderClick}
                    endIcon={<ExpandMore />}
                    sx={{
                      textTransform: 'none',
                      color: 'text.primary',
                      fontWeight: 'normal',
                      justifyContent: 'flex-start',
                      minWidth: 'auto',
                      padding: '4px 8px',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    Tags
                  </Button>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ width: 80 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageReceivers.map((receiver) => (
              <TableRow key={receiver.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedReceivers.includes(receiver.id)}
                    onChange={() => handleSelectReceiver(receiver.id)}
                  />
                </TableCell>
                <TableCell>{receiver.rowNumber}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      receiver.isValid
                        ? 'Valid receiver'
                        : receiver.validationErrors.join(', ')
                    }
                  >
                    {receiver.isValid ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{receiver.fullName}</Typography>
                  {!receiver.isValid && (
                    <Typography variant="caption" color="error">
                      {receiver.validationErrors.join(', ')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    {receiver.emails.map((email, idx) => (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{ display: 'block' }}
                      >
                        {email}
                      </Typography>
                    ))}
                    {receiver.emails.length > 1 && (
                      <Typography variant="caption" color="primary">
                        {receiver.emails.length} emails
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {receiver.location || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2">
                          {formatTimezone(receiver.timezone)}
                        </Typography>
                        <Typography variant="caption" color="inherit">
                          Source:{' '}
                          {receiver.timezoneSource === 'api'
                            ? 'External API'
                            : receiver.timezoneSource === 'cache'
                              ? 'Cached'
                              : 'Fallback'}
                        </Typography>
                      </Box>
                    }
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography variant="body2">
                        {receiver.timezone}
                      </Typography>
                      <Chip
                        label={receiver.timezoneSource}
                        size="small"
                        variant="outlined"
                        color={
                          receiver.timezoneSource === 'api'
                            ? 'success'
                            : receiver.timezoneSource === 'cache'
                              ? 'info'
                              : 'default'
                        }
                        sx={{ fontSize: '0.6rem', height: 16 }}
                      />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <InlineTagSelector
                    receiverId={receiver.id}
                    assignedTags={receiver.tags}
                    availableTags={tags}
                    onAddTag={onAddTagToReceiver}
                    onRemoveTag={handleRemoveTagFromReceiver}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete receiver">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteReceiver(receiver.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={receivers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      {/* Column Header Tag Menu */}
      <Popper
        open={showColumnTagMenu}
        anchorEl={columnHeaderAnchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleColumnMenuClose}>
          <Paper
            sx={{ mt: 1, minWidth: 200, maxHeight: 300, overflow: 'auto' }}
          >
            <Box
              sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Assign Tag to All Valid Receivers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click a tag to apply it to all{' '}
                {receivers.filter((r) => r.isValid).length} valid receivers
              </Typography>
            </Box>
            <MenuList dense>
              {tags.map((tag) => (
                <MenuItem
                  key={tag.id}
                  onClick={() => handleColumnTagAssign(tag.id)}
                  sx={{
                    gap: 1,
                    '&:hover': {
                      backgroundColor: `${tag.color}20`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: tag.color,
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">{tag.name}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {
                      receivers.filter(
                        (r) => r.isValid && !r.tags.some((t) => t.id === tag.id)
                      ).length
                    }{' '}
                    new
                  </Typography>
                </MenuItem>
              ))}
              {tags.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No tags available
                  </Typography>
                </MenuItem>
              )}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};
