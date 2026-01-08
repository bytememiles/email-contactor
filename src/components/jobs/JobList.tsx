'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Delete,
  Edit,
  Error,
  Pending,
  Schedule,
  Send,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';

import { EmailJob, JobStatus } from '@/types/job';
import { ReceiverList } from '@/types/receiver';
import { getTimezoneAbbreviation } from '@/utils/csvUtils';

interface JobListProps {
  jobs: EmailJob[];
  onDelete: (id: string) => void;
  onEdit?: (job: EmailJob) => void;
  profileNames: Record<string, string>;
  templateNames: Record<string, string>;
  loadReceiverList: (id: string) => Promise<ReceiverList | null>;
}

const statusConfig: Record<
  JobStatus,
  {
    label: string;
    color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
    icon: React.ReactElement;
  }
> = {
  pending: { label: 'Pending', color: 'default', icon: <Pending /> },
  scheduled: { label: 'Scheduled', color: 'info', icon: <Schedule /> },
  sending: { label: 'Sending', color: 'primary', icon: <Send /> },
  completed: { label: 'Completed', color: 'success', icon: <CheckCircle /> },
  failed: { label: 'Failed', color: 'error', icon: <Error /> },
};

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onDelete,
  onEdit,
  profileNames,
  templateNames,
  loadReceiverList,
}) => {
  const router = useRouter();
  const [receiverLists, setReceiverLists] = useState<
    Record<string, ReceiverList>
  >({});
  const loadingRef = useRef<Set<string>>(new Set());
  const loadedIdsRef = useRef<Set<string>>(new Set());

  // Load receiver lists for all jobs
  useEffect(() => {
    const loadLists = async () => {
      const lists: Record<string, ReceiverList> = {};
      const jobIds = new Set(jobs.map((job) => job.receiverListId));
      const jobsToLoad = Array.from(jobIds).filter(
        (id) => !loadedIdsRef.current.has(id) && !loadingRef.current.has(id)
      );

      for (const listId of jobsToLoad) {
        loadingRef.current.add(listId);
        const list = await loadReceiverList(listId);
        if (list) {
          lists[listId] = list;
          loadedIdsRef.current.add(listId);
        }
        loadingRef.current.delete(listId);
      }

      if (Object.keys(lists).length > 0) {
        setReceiverLists((prev) => ({ ...prev, ...lists }));
      }
    };
    loadLists();
  }, [jobs, loadReceiverList]);

  if (jobs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No jobs found. Create a job from the Bulk Email page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {jobs.map((job) => {
        const config = statusConfig[job.status];
        const progress =
          job.totalCount > 0
            ? ((job.sentCount + job.failedCount) / job.totalCount) * 100
            : 0;

        // Get receiver list and timezone info
        const receiverList = receiverLists[job.receiverListId];
        const receivers = receiverList?.receivers || [];

        // Get unique timezone abbreviation (should be single for jobs)
        const uniqueTimezoneAbbrs = new Set(
          receivers
            .map((r) =>
              r.timezone ? getTimezoneAbbreviation(r.timezone) : null
            )
            .filter(Boolean)
        );
        const jobTimezoneAbbr =
          uniqueTimezoneAbbrs.size === 1
            ? Array.from(uniqueTimezoneAbbrs)[0]
            : null;
        const jobTimezone = receivers.find((r) => r.timezone)?.timezone || null;

        // Format scheduled time in system timezone
        const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const systemTimezoneAbbr = getTimezoneAbbreviation(systemTimezone);
        const scheduledTimeSystem = new Date(job.scheduledTime).toLocaleString(
          'en-US',
          {
            timeZone: systemTimezone,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }
        );

        // Format scheduled time in job's timezone (if available)
        const scheduledTimeJob = jobTimezone
          ? new Date(job.scheduledTime).toLocaleString('en-US', {
              timeZone: jobTimezone,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : null;

        return (
          <Card key={job.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Chip
                      icon={config.icon}
                      label={config.label}
                      color={config.color}
                      size="small"
                    />
                  </Box>

                  {/* Scheduled Time Section */}
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                    >
                      Scheduled Time:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mb: 0.25 }}
                    >
                      {scheduledTimeSystem} ({systemTimezoneAbbr})
                    </Typography>
                    {scheduledTimeJob && jobTimezoneAbbr && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {scheduledTimeJob} ({jobTimezoneAbbr})
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Profile: {profileNames[job.profileId] || 'Unknown'} •
                    Template: {templateNames[job.templateId] || 'Unknown'}
                  </Typography>
                  {job.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Error: {job.error}
                    </Typography>
                  )}
                  {((job.errors && job.errors.length > 0) ||
                    (job.warnings && job.warnings.length > 0)) && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="span"
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => router.push('/settings/jobs/history')}
                      >
                        View detailed errors and warnings →
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onEdit &&
                    (job.status === 'scheduled' ||
                      job.status === 'pending') && (
                      <IconButton
                        size="small"
                        onClick={() => onEdit(job)}
                        color="primary"
                        title="Edit"
                      >
                        <Edit />
                      </IconButton>
                    )}
                  <IconButton
                    size="small"
                    onClick={() => onDelete(job.id)}
                    color="error"
                    title="Delete"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>

              {job.status === 'sending' && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption">
                      Progress: {job.sentCount + job.failedCount} /{' '}
                      {job.totalCount}
                    </Typography>
                    <Typography variant="caption">
                      Sent: {job.sentCount} • Failed: {job.failedCount}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
              )}

              {job.status === 'completed' && (
                <Typography variant="caption" color="success.main">
                  Successfully sent {job.sentCount} email(s)
                </Typography>
              )}

              {job.status === 'failed' && job.failedCount > 0 && (
                <Typography variant="caption" color="error">
                  Failed to send {job.failedCount} email(s)
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};
