import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Delete,
  Download,
  Edit,
  Folder,
  Group,
  Schedule,
  Search,
  Visibility,
  Work,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { EmailJob } from '@/types/job';
import { ReceiverListSummary } from '@/types/receiver';
import {
  getCurrentTimeInTimezone,
  getTimezoneAbbreviation,
} from '@/utils/csvUtils';

interface StoredListsViewProps {
  lists: ReceiverListSummary[];
  loading: boolean;
  onViewList: (id: string) => void;
  onEditList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onExportList: (id: string) => void;
  onLoadList?: (
    id: string
  ) => Promise<{ receivers: Array<{ timezone: string }> } | null>;
  onCreateJob?: (listId: string) => void;
  onViewJob?: (jobId: string) => void;
  jobs?: EmailJob[];
}

export const StoredListsView: React.FC<StoredListsViewProps> = ({
  lists,
  loading,
  onViewList,
  onEditList,
  onDeleteList,
  onExportList,
  onLoadList,
  onCreateJob,
  onViewJob,
  jobs = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listTimezones, setListTimezones] = useState<
    Map<string, { timezone: string; isSingle: boolean }>
  >(new Map());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load timezone info for lists
  useEffect(() => {
    if (!onLoadList || lists.length === 0) return;

    const loadTimezones = async () => {
      const timezoneMap = new Map<
        string,
        { timezone: string; isSingle: boolean }
      >();

      for (const list of lists) {
        try {
          const fullList = await onLoadList(list.id);
          if (fullList && fullList.receivers.length > 0) {
            // Check by timezone abbreviation, not IANA timezone
            const uniqueTimezoneAbbrs = new Set(
              fullList.receivers
                .map((r) =>
                  r.timezone ? getTimezoneAbbreviation(r.timezone) : null
                )
                .filter(Boolean)
            );
            if (uniqueTimezoneAbbrs.size === 1) {
              // Get the first receiver's IANA timezone for display purposes
              const firstReceiver = fullList.receivers.find((r) => r.timezone);
              const timezone = firstReceiver?.timezone || '';
              timezoneMap.set(list.id, { timezone, isSingle: true });
            } else {
              timezoneMap.set(list.id, { timezone: '', isSingle: false });
            }
          }
        } catch (error) {
          console.error(`Error loading timezone for list ${list.id}:`, error);
        }
      }

      setListTimezones(timezoneMap);
    };

    loadTimezones();
  }, [lists, onLoadList]);

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description &&
        list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading stored lists...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Folder sx={{ color: 'text.secondary' }} />
        <Typography variant="h6">Stored Receiver Lists</Typography>
        <Chip
          label={`${lists.length} list${lists.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Search */}
      {lists.length > 0 && (
        <TextField
          placeholder="Search lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {lists.length === 0
              ? 'No stored lists yet'
              : 'No lists match your search'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lists.length === 0
              ? 'Upload and save CSV files to see them here'
              : 'Try different search terms'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
            pb: 3, // Add bottom padding so cards aren't cut off
          }}
        >
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {list.name}
                </Typography>

                {list.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {list.description}
                  </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${list.totalReceivers} total`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${list.validReceivers} valid`}
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {(() => {
                  const tzInfo = listTimezones.get(list.id);
                  if (tzInfo?.isSingle && tzInfo.timezone) {
                    return (
                      <Box
                        sx={{
                          mb: 2,
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
                          {getTimezoneAbbreviation(tzInfo.timezone)} Current
                          Time:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          key={currentTime.getTime()}
                        >
                          {getCurrentTimeInTimezone(tzInfo.timezone, {
                            includeDate: true,
                          })}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}

                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(list.createdAt)}
                  {list.sourceFileName && (
                    <>
                      <br />
                      Source: {list.sourceFileName}
                    </>
                  )}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Tooltip title="View receivers">
                  <IconButton
                    size="small"
                    onClick={() => onViewList(list.id)}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Edit list">
                  <IconButton size="small" onClick={() => onEditList(list.id)}>
                    <Edit />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Export CSV">
                  <IconButton
                    size="small"
                    onClick={() => onExportList(list.id)}
                    color="success"
                  >
                    <Download />
                  </IconButton>
                </Tooltip>

                <Box sx={{ flex: 1 }} />

                {(() => {
                  const linkedJobs = jobs.filter(
                    (job) => job.receiverListId === list.id
                  );
                  const hasLinkedJobs = linkedJobs.length > 0;

                  return (
                    <Tooltip
                      title={
                        hasLinkedJobs
                          ? `Cannot delete: ${linkedJobs.length} job(s) linked to this list`
                          : 'Delete list'
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteList(list.id)}
                          color="error"
                          disabled={hasLinkedJobs}
                        >
                          <Delete />
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })()}
              </CardActions>

              {/* Job Section */}
              {(() => {
                const existingJob = jobs.find(
                  (job) => job.receiverListId === list.id
                );
                const tzInfo = listTimezones.get(list.id);
                const canCreateJob = tzInfo?.isSingle && onCreateJob;

                if (existingJob) {
                  const statusConfig: Record<
                    string,
                    {
                      label: string;
                      color:
                        | 'success'
                        | 'warning'
                        | 'error'
                        | 'info'
                        | 'default';
                      icon: React.ReactNode;
                    }
                  > = {
                    completed: {
                      label: 'Completed',
                      color: 'success',
                      icon: <CheckCircle />,
                    },
                    sending: {
                      label: 'Sending',
                      color: 'info',
                      icon: <Schedule />,
                    },
                    scheduled: {
                      label: 'Scheduled',
                      color: 'info',
                      icon: <Schedule />,
                    },
                    pending: {
                      label: 'Pending',
                      color: 'warning',
                      icon: <Schedule />,
                    },
                    failed: {
                      label: 'Failed',
                      color: 'error',
                      icon: <CheckCircle />,
                    },
                  };
                  const config =
                    statusConfig[existingJob.status] || statusConfig.pending;

                  return (
                    <Box
                      sx={{
                        p: 2,
                        pt: 0,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          mt: 1.5, // Add gap between divider and status section
                        }}
                      >
                        <Chip
                          icon={config.icon as React.ReactElement}
                          label={config.label}
                          color={config.color}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {existingJob.sentCount}/{existingJob.totalCount} sent
                        </Typography>
                      </Box>
                      {onViewJob && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Work />}
                          onClick={() => onViewJob(existingJob.id)}
                          fullWidth
                          sx={{ mt: 1.5 }} // Add gap between divider and button
                        >
                          View Job
                        </Button>
                      )}
                    </Box>
                  );
                }

                if (canCreateJob) {
                  return (
                    <Box
                      sx={{
                        p: 2,
                        pt: 0,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Work />}
                        onClick={() => onCreateJob(list.id)}
                        fullWidth
                        sx={{ mt: 1.5 }} // Add gap between divider and button
                      >
                        Create Job
                      </Button>
                    </Box>
                  );
                }

                if (!tzInfo?.isSingle && onCreateJob) {
                  return (
                    <Box
                      sx={{
                        p: 2,
                        pt: 0,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Tooltip title="Jobs can only be created for lists with a single timezone">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Work />}
                            disabled
                            fullWidth
                            sx={{ mt: 1.5 }} // Add gap between divider and button
                          >
                            Create Job (Multiple Timezones)
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  );
                }

                return null;
              })()}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
