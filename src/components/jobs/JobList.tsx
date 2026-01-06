'use client';

import React from 'react';
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

interface JobListProps {
  jobs: EmailJob[];
  onDelete: (id: string) => void;
  onEdit?: (job: EmailJob) => void;
  profileNames: Record<string, string>;
  templateNames: Record<string, string>;
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
}) => {
  const router = useRouter();
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
                    <Typography variant="body2" color="text.secondary">
                      {new Date(job.scheduledTime).toLocaleString()}
                    </Typography>
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
