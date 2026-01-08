import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Delete, Error, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  ClickAwayListener,
  Divider,
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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

import { ProcessedReceiver } from '@/types/receiver';
import {
  formatTimezone,
  getCurrentTimeInTimezone,
  getTimezoneAbbreviation,
} from '@/utils/csvUtils';
import { getStateTimezone } from '@/utils/stateTimezone';

interface ReceiversTableProps {
  receivers: ProcessedReceiver[];
  onDeleteReceiver: (id: string) => void;
  onKeepSelectedOnly?: (selectedIds: string[]) => void;
  onRemoveSelected?: (selectedIds: string[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const ReceiversTable: React.FC<ReceiversTableProps> = ({
  receivers,
  onDeleteReceiver,
  onKeepSelectedOnly,
  onRemoveSelected,
  onSelectionChange,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);
  const [timezoneFilterAnchorEl, setTimezoneFilterAnchorEl] =
    useState<HTMLElement | null>(null);
  const [showTimezoneFilter, setShowTimezoneFilter] = useState(false);
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>([]);
  const [stateFilterAnchorEl, setStateFilterAnchorEl] =
    useState<HTMLElement | null>(null);
  const [showStateFilter, setShowStateFilter] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second when timezone or state filter is active
  useEffect(() => {
    if (selectedTimezones.length > 0 || selectedStates.length > 0) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedTimezones.length, selectedStates.length]);

  // Get unique timezones from receivers
  const uniqueTimezones = useMemo(() => {
    return [...new Set(receivers.map((r) => r.timezone))].sort();
  }, [receivers]);

  // Get unique states from receivers
  const uniqueStates = useMemo(() => {
    return [...new Set(receivers.map((r) => r.state).filter(Boolean))].sort();
  }, [receivers]);

  // Filter receivers by selected timezones and states
  const filteredReceivers = useMemo(() => {
    let filtered = receivers;

    if (selectedTimezones.length > 0) {
      filtered = filtered.filter((r) => selectedTimezones.includes(r.timezone));
    }

    if (selectedStates.length > 0) {
      filtered = filtered.filter(
        (r) => r.state && selectedStates.includes(r.state)
      );
    }

    return filtered;
  }, [receivers, selectedTimezones, selectedStates]);

  const handleSelectReceiver = (receiverId: string) => {
    setSelectedReceivers((prev) =>
      prev.includes(receiverId)
        ? prev.filter((id) => id !== receiverId)
        : [...prev, receiverId]
    );
  };

  const handleSelectAll = () => {
    // Check if all filtered receivers are selected
    const allFilteredIds = filteredReceivers.map((r) => r.id);
    const allSelected = allFilteredIds.every((id) =>
      selectedReceivers.includes(id)
    );

    if (allSelected) {
      // Deselect all filtered receivers
      setSelectedReceivers((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      // Select all filtered receivers
      setSelectedReceivers((prev) => [
        ...new Set([...prev, ...allFilteredIds]),
      ]);
    }
  };

  const handleKeepSelectedOnly = () => {
    if (onKeepSelectedOnly && selectedReceivers.length > 0) {
      onKeepSelectedOnly(selectedReceivers);
      setSelectedReceivers([]);
    }
  };

  const handleRemoveSelected = () => {
    if (onRemoveSelected && selectedReceivers.length > 0) {
      onRemoveSelected(selectedReceivers);
      setSelectedReceivers([]);
    }
  };

  // Notify parent when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedReceivers);
  }, [selectedReceivers, onSelectionChange]);

  const handleTimezoneFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setTimezoneFilterAnchorEl(event.currentTarget);
    setShowTimezoneFilter(true);
  };

  const handleTimezoneFilterClose = () => {
    setTimezoneFilterAnchorEl(null);
    setShowTimezoneFilter(false);
  };

  const handleTimezoneToggle = (timezone: string) => {
    setSelectedTimezones((prev) =>
      prev.includes(timezone)
        ? prev.filter((tz) => tz !== timezone)
        : [...prev, timezone]
    );
  };

  const handleSelectAllTimezones = () => {
    if (selectedTimezones.length === uniqueTimezones.length) {
      setSelectedTimezones([]);
    } else {
      setSelectedTimezones([...uniqueTimezones]);
    }
  };

  const handleStateFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setStateFilterAnchorEl(event.currentTarget);
    setShowStateFilter(true);
  };

  const handleStateFilterClose = () => {
    setStateFilterAnchorEl(null);
    setShowStateFilter(false);
  };

  const handleStateToggle = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleSelectAllStates = () => {
    if (selectedStates.length === uniqueStates.length) {
      setSelectedStates([]);
    } else {
      setSelectedStates([...uniqueStates]);
    }
  };

  // Get count of receivers per state
  const getStateCount = (state: string) => {
    return receivers.filter((r) => r.state === state).length;
  };

  // Check if all filtered receivers are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredReceivers.length === 0) return false;
    const allFilteredIds = filteredReceivers.map((r) => r.id);
    return allFilteredIds.every((id) => selectedReceivers.includes(id));
  }, [filteredReceivers, selectedReceivers]);

  // Check if some (but not all) filtered receivers are selected
  const someFilteredSelected = useMemo(() => {
    if (filteredReceivers.length === 0) return false;
    const allFilteredIds = filteredReceivers.map((r) => r.id);
    const selectedCount = allFilteredIds.filter((id) =>
      selectedReceivers.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < allFilteredIds.length;
  }, [filteredReceivers, selectedReceivers]);

  const validCount = filteredReceivers.filter((r) => r.isValid).length;
  const invalidCount = filteredReceivers.length - validCount;

  const currentPageReceivers = filteredReceivers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get count of receivers per timezone
  const getTimezoneCount = (timezone: string) => {
    return receivers.filter((r) => r.timezone === timezone).length;
  };

  return (
    <Box>
      {/* Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Receivers Summary
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ flexWrap: 'wrap' }}
        >
          <Chip
            icon={<CheckCircle />}
            label={`Valid: ${validCount}`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<Error />}
            label={`Invalid: ${invalidCount}`}
            color="error"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Total: ${filteredReceivers.length}`}
            variant="outlined"
            size="small"
          />
          {selectedTimezones.length > 0 && (
            <Chip
              label={`Filtered: ${selectedTimezones.length} timezone(s)`}
              color="info"
              variant="outlined"
              size="small"
              onDelete={() => setSelectedTimezones([])}
            />
          )}
          {selectedStates.length > 0 && (
            <Chip
              label={`Filtered: ${selectedStates.length} state(s)`}
              color="info"
              variant="outlined"
              size="small"
              onDelete={() => setSelectedStates([])}
            />
          )}
        </Stack>
      </Box>

      {/* Selection Toolbar */}
      {selectedReceivers.length > 0 && (
        <Paper sx={{ mb: 2, p: 1 }}>
          <Toolbar
            variant="dense"
            sx={{
              minHeight: '48px !important',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedReceivers.length} receiver(s) selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleKeepSelectedOnly}
                disabled={!onKeepSelectedOnly}
              >
                Keep Selected Only
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleRemoveSelected}
                disabled={!onRemoveSelected}
              >
                Remove Selected
              </Button>
            </Stack>
          </Toolbar>
        </Paper>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
          maxWidth: '100%',
          maxHeight: { xs: 400, sm: 600 },
        }}
      >
        <Table sx={{ minWidth: { xs: 800, sm: 1200 } }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 50 }}>
                <Checkbox
                  indeterminate={someFilteredSelected}
                  checked={allFilteredSelected && filteredReceivers.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 40, sm: 60 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                No
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 60, sm: 80 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 100, sm: 150 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Full Name
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 150, sm: 200 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Email
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 100, sm: 150 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', md: 'table-cell' },
                }}
              >
                <Tooltip title="Click to filter by state">
                  <Button
                    onClick={handleStateFilterClick}
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
                    State
                    {selectedStates.length > 0 && (
                      <Chip
                        label={selectedStates.length}
                        size="small"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Button>
                </Tooltip>
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 120, sm: 180 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', lg: 'table-cell' },
                }}
              >
                <Tooltip title="Click to filter by timezone">
                  <Button
                    onClick={handleTimezoneFilterClick}
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
                    Timezone
                    {selectedTimezones.length > 0 && (
                      <Chip
                        label={selectedTimezones.length}
                        size="small"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Button>
                </Tooltip>
              </TableCell>
              <TableCell
                sx={{
                  width: { xs: 60, sm: 80 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageReceivers.map((receiver, index) => (
              <TableRow key={receiver.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedReceivers.includes(receiver.id)}
                    onChange={() => handleSelectReceiver(receiver.id)}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
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
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <Typography variant="body2">{receiver.fullName}</Typography>
                  {!receiver.isValid && (
                    <Typography variant="caption" color="error">
                      {receiver.validationErrors.join(', ')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <Box>
                    {receiver.emails.map((email, idx) => (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{ display: 'block', fontSize: 'inherit' }}
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
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', md: 'table-cell' },
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                    {receiver.state || '-'}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', lg: 'table-cell' },
                  }}
                >
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2">
                          {receiver.timezone}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Current Time:{' '}
                          {getCurrentTimeInTimezone(receiver.timezone)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="inherit"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
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
                        {getTimezoneAbbreviation(receiver.timezone)}
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
        count={filteredReceivers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      {/* Timezone Filter Dropdown */}
      <Popper
        open={showTimezoneFilter}
        anchorEl={timezoneFilterAnchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleTimezoneFilterClose}>
          <Paper
            sx={{ mt: 1, minWidth: 300, maxHeight: 400, overflow: 'auto' }}
          >
            <Box
              sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Filter by Timezone
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select timezones to filter receivers
              </Typography>
              {selectedTimezones.length === 1 && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Current Time:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                    key={currentTime.getTime()}
                  >
                    {getCurrentTimeInTimezone(selectedTimezones[0], {
                      includeDate: true,
                    })}{' '}
                    {getTimezoneAbbreviation(selectedTimezones[0])}
                  </Typography>
                </Box>
              )}
              {selectedTimezones.length > 1 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.5 }}
                  >
                    Current Times:
                  </Typography>
                  {selectedTimezones.map((tz) => (
                    <Box
                      key={`${tz}-${currentTime.getTime()}`}
                      sx={{
                        p: 0.5,
                        bgcolor: 'action.hover',
                        borderRadius: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {getTimezoneAbbreviation(tz)}:{' '}
                        {getCurrentTimeInTimezone(tz)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Box sx={{ p: 1 }}>
              <MenuItem
                onClick={handleSelectAllTimezones}
                dense
                sx={{ fontWeight: 500 }}
              >
                <Checkbox
                  checked={selectedTimezones.length === uniqueTimezones.length}
                  indeterminate={
                    selectedTimezones.length > 0 &&
                    selectedTimezones.length < uniqueTimezones.length
                  }
                />
                <Typography variant="body2">
                  {selectedTimezones.length === uniqueTimezones.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Typography>
              </MenuItem>
              <Divider />
            </Box>
            <MenuList dense>
              {uniqueTimezones.map((timezone) => {
                const count = getTimezoneCount(timezone);
                return (
                  <MenuItem
                    key={timezone}
                    onClick={() => handleTimezoneToggle(timezone)}
                    sx={{ gap: 1 }}
                  >
                    <Checkbox checked={selectedTimezones.includes(timezone)} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {getTimezoneAbbreviation(timezone)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timezone} • {getCurrentTimeInTimezone(timezone)}
                      </Typography>
                    </Box>
                    <Chip
                      label={count}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </MenuItem>
                );
              })}
              {uniqueTimezones.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No timezones available
                  </Typography>
                </MenuItem>
              )}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {/* State Filter Dropdown */}
      <Popper
        open={showStateFilter}
        anchorEl={stateFilterAnchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleStateFilterClose}>
          <Paper
            sx={{ mt: 1, minWidth: 300, maxHeight: 400, overflow: 'auto' }}
          >
            <Box
              sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Filter by State
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select states to filter receivers
              </Typography>
              {selectedStates.length === 1 &&
                (() => {
                  const stateTimezone = getStateTimezone(selectedStates[0]);
                  if (stateTimezone) {
                    return (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Current Time ({getTimezoneAbbreviation(stateTimezone)}
                          ):
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          key={currentTime.getTime()}
                        >
                          {getCurrentTimeInTimezone(stateTimezone, {
                            includeDate: true,
                          })}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}
              {selectedStates.length > 1 &&
                (() => {
                  const stateTimezones = selectedStates
                    .map((state) => ({
                      state,
                      timezone: getStateTimezone(state),
                    }))
                    .filter((item) => item.timezone !== null);

                  // Group by timezone to avoid duplicates
                  const uniqueTimezones = new Map<string, string[]>();
                  stateTimezones.forEach(({ state, timezone }) => {
                    if (timezone) {
                      if (!uniqueTimezones.has(timezone)) {
                        uniqueTimezones.set(timezone, []);
                      }
                      uniqueTimezones.get(timezone)!.push(state);
                    }
                  });

                  if (uniqueTimezones.size > 0) {
                    return (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mb: 0.5 }}
                        >
                          Current Times:
                        </Typography>
                        {Array.from(uniqueTimezones.entries()).map(
                          ([timezone, states]) => (
                            <Box
                              key={`${timezone}-${currentTime.getTime()}`}
                              sx={{
                                p: 0.5,
                                bgcolor: 'action.hover',
                                borderRadius: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600 }}
                              >
                                {getTimezoneAbbreviation(timezone)} (
                                {states.join(', ')}):{' '}
                                {getCurrentTimeInTimezone(timezone)}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    );
                  }
                  return null;
                })()}
            </Box>
            <Box sx={{ p: 1 }}>
              <MenuItem
                onClick={handleSelectAllStates}
                dense
                sx={{ fontWeight: 500 }}
              >
                <Checkbox
                  checked={selectedStates.length === uniqueStates.length}
                  indeterminate={
                    selectedStates.length > 0 &&
                    selectedStates.length < uniqueStates.length
                  }
                />
                <Typography variant="body2">
                  {selectedStates.length === uniqueStates.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Typography>
              </MenuItem>
              <Divider />
            </Box>
            <MenuList dense>
              {uniqueStates.map((state) => {
                const count = getStateCount(state);
                const stateTimezone = getStateTimezone(state);
                return (
                  <MenuItem
                    key={state}
                    onClick={() => handleStateToggle(state)}
                    sx={{ gap: 1 }}
                  >
                    <Checkbox checked={selectedStates.includes(state)} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{state}</Typography>
                      {stateTimezone && (
                        <Typography variant="caption" color="text.secondary">
                          {getTimezoneAbbreviation(stateTimezone)} •{' '}
                          {getCurrentTimeInTimezone(stateTimezone)}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={count}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </MenuItem>
                );
              })}
              {uniqueStates.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No states available
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
