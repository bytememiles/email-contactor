'use client';

import React from 'react';
import {
  CheckCircle,
  Error as ErrorIcon,
  ExpandMore,
  Warning,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  Paper,
  Typography,
} from '@mui/material';

import { useEmailJobs } from '@/hooks/useEmailJobs';
import { useProfiles } from '@/hooks/useProfiles';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useTemplates } from '@/hooks/useTemplates';
import { JobStatus } from '@/types/job';

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
  pending: { label: 'Pending', color: 'default', icon: <CheckCircle /> },
  scheduled: { label: 'Scheduled', color: 'info', icon: <CheckCircle /> },
  sending: { label: 'Sending', color: 'primary', icon: <CheckCircle /> },
  completed: { label: 'Completed', color: 'success', icon: <CheckCircle /> },
  failed: { label: 'Failed', color: 'error', icon: <ErrorIcon /> },
};

export default function JobHistoryPage() {
  const { jobs, loading } = useEmailJobs();
  const { profiles } = useProfiles();
  const { templates } = useTemplates();
  const { lists } = useReceiverLists();

  // Create lookup maps
  const profileNames: Record<string, string> = {};
  profiles.forEach((profile) => {
    profileNames[profile.id] = profile.fullName;
  });

  const templateNames: Record<string, string> = {};
  templates.forEach((template) => {
    templateNames[template.id] = template.name;
  });

  const listNames: Record<string, string> = {};
  lists.forEach((list) => {
    listNames[list.id] = list.name;
  });

  // Sort jobs by updated time (most recent first)
  const sortedJobs = [...jobs].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  // Filter jobs that have completed, failed, or have errors/warnings
  const historyJobs = sortedJobs.filter(
    (job) =>
      job.status === 'completed' ||
      job.status === 'failed' ||
      (job.errors && job.errors.length > 0) ||
      (job.warnings && job.warnings.length > 0)
  );

  if (loading) {
    return (
      <Box>
        <Typography>Loading job history...</Typography>
      </Box>
    );
  }

  if (historyJobs.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Job History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Track the status and detailed error messages of scheduled email jobs.
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No job history found. Completed or failed jobs will appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Job History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track the status and detailed error messages of scheduled email jobs.
        </Typography>
      </Box>

      {historyJobs.map((job) => {
        const config = statusConfig[job.status];
        const hasErrors = job.errors && job.errors.length > 0;
        const hasWarnings = job.warnings && job.warnings.length > 0;
        const errorCount = job.errors?.length || 0;
        const warningCount = job.warnings?.length || 0;

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
                      flexWrap: 'wrap',
                    }}
                  >
                    <Chip
                      icon={config.icon}
                      label={config.label}
                      color={config.color}
                      size="small"
                    />
                    {hasErrors && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`${errorCount} Error${errorCount > 1 ? 's' : ''}`}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {hasWarnings && (
                      <Chip
                        icon={<Warning />}
                        label={`${warningCount} Warning${warningCount > 1 ? 's' : ''}`}
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {new Date(job.scheduledTime).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <strong>Profile:</strong>{' '}
                    {profileNames[job.profileId] || 'Unknown'} •{' '}
                    <strong>Template:</strong>{' '}
                    {templateNames[job.templateId] || 'Unknown'} •{' '}
                    <strong>Receiver List:</strong>{' '}
                    {listNames[job.receiverListId] || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Progress:</strong> {job.sentCount} sent,{' '}
                    {job.failedCount} failed out of {job.totalCount} total
                  </Typography>
                  {job.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      <strong>Error:</strong> {job.error}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Errors Accordion */}
              {hasErrors && (
                <Accordion sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      <Typography variant="subtitle2">
                        {errorCount} Error{errorCount > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {job.errors!.map((error, index) => (
                        <React.Fragment key={index}>
                          <ListItem
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              py: 1.5,
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {error.timestamp.toLocaleString()}
                                </Typography>
                                {error.email && (
                                  <Chip
                                    label={error.email}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="error">
                                {error.message}
                              </Typography>
                              {error.receiverId && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  Receiver ID: {error.receiverId}
                                </Typography>
                              )}
                            </Box>
                          </ListItem>
                          {index < job.errors!.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Warnings Accordion */}
              {hasWarnings && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning color="warning" />
                      <Typography variant="subtitle2">
                        {warningCount} Warning{warningCount > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {job.warnings!.map((warning, index) => (
                        <React.Fragment key={index}>
                          <ListItem
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              py: 1.5,
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {warning.timestamp.toLocaleString()}
                                </Typography>
                                {warning.email && (
                                  <Chip
                                    label={warning.email}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="warning.main">
                                {warning.message}
                              </Typography>
                              {warning.receiverId && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  Receiver ID: {warning.receiverId}
                                </Typography>
                              )}
                            </Box>
                          </ListItem>
                          {index < job.warnings!.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Job Summary */}
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  <strong>Created:</strong> {job.createdAt.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  <strong>Last Updated:</strong>{' '}
                  {job.updatedAt.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  <strong>Job ID:</strong> {job.id}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
