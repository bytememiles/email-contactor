'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Add, History } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { JobCreator, JobList } from '@/components/jobs';
import { useNotification } from '@/contexts/NotificationContext';
import { useEmailJobs } from '@/hooks/useEmailJobs';
import { useProfiles } from '@/hooks/useProfiles';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useTemplates } from '@/hooks/useTemplates';
import { EmailJob, JobForm } from '@/types/job';
import { getTimezoneAbbreviation } from '@/utils/csvUtils';
import { calculateSendTimes, getEarliestSendTime } from '@/utils/scheduling';

export default function JobsPage() {
  const router = useRouter();
  const { jobs, loading, createJob, updateJob, deleteJob } = useEmailJobs();
  const { profiles } = useProfiles();
  const { templates } = useTemplates();
  const { lists, loadReceiverList } = useReceiverLists();
  const { showError } = useNotification();

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<EmailJob | null>(null);

  const handleCreateJob = async (data: JobForm) => {
    // Find the receiver list
    const receiverList = lists.find((list) => list.id === data.receiverListId);
    if (!receiverList) {
      showError('Receiver list not found');
      return;
    }

    // Load the full receiver list to get receivers with timezone info
    const fullList = await loadReceiverList(data.receiverListId);
    if (!fullList) {
      showError('Could not load receiver list');
      return;
    }

    // Validate that the list has only one timezone abbreviation (only for new jobs, not when editing)
    if (!editingJob) {
      const uniqueTimezoneAbbrs = new Set(
        fullList.receivers
          .map((r) => (r.timezone ? getTimezoneAbbreviation(r.timezone) : null))
          .filter(Boolean)
      );
      if (uniqueTimezoneAbbrs.size !== 1) {
        showError(
          'Jobs can only be created for receiver lists with a single timezone. This list contains multiple timezones.'
        );
        return;
      }
    }

    // Parse the send time from the form (format: "HH:mm")
    const sendTime = data.sendTime || '10:00';
    const [hours, minutes] = sendTime.split(':').map(Number);

    // Calculate timezone-aware send times
    const scheduledTimes = calculateSendTimes(
      fullList.receivers,
      new Date(),
      hours,
      minutes
    );
    const earliestTime = getEarliestSendTime(scheduledTimes) || new Date();

    if (editingJob) {
      // Update existing job
      updateJob(editingJob.id, data, earliestTime, receiverList.validReceivers);
      setEditingJob(null);
    } else {
      // Create new job with timezone-aware scheduling
      createJob(data, earliestTime, receiverList.validReceivers);
    }
    setShowForm(false);
  };

  const handleEditJob = (job: EmailJob) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  // Convert scheduled time to HH:mm format for the time input
  // Use sendTime if available (timezone-aware), otherwise fall back to scheduledTime
  const getJobSendTime = (job: EmailJob): string => {
    if (job.sendTime) {
      return job.sendTime;
    }
    // Fallback for old jobs without sendTime
    const date = new Date(job.scheduledTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Create lookup maps
  const profileNames: Record<string, string> = {};
  profiles.forEach((profile) => {
    profileNames[profile.id] = profile.fullName;
  });

  const templateNames: Record<string, string> = {};
  templates.forEach((template) => {
    templateNames[template.id] = template.name;
  });

  // Sort jobs by scheduled time (newest first)
  const sortedJobs = [...jobs].sort(
    (a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            Email Jobs
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            View and manage scheduled email jobs.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            startIcon={<History />}
            variant="outlined"
            onClick={() => router.push('/settings/jobs/history')}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            View History
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setShowForm(true)}
            disabled={
              profiles.length === 0 ||
              templates.length === 0 ||
              lists.length === 0
            }
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Create Job
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading jobs...</Typography>
      ) : (
        <JobList
          jobs={sortedJobs}
          onDelete={deleteJob}
          onEdit={handleEditJob}
          profileNames={profileNames}
          templateNames={templateNames}
        />
      )}

      <Dialog
        open={showForm}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '90vh', sm: 'auto' },
          },
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {editingJob ? 'Edit Email Job' : 'Create Email Job'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <JobCreator
            profiles={profiles}
            templates={templates}
            receiverLists={lists}
            onSubmit={handleCreateJob}
            onCancel={handleCancel}
            initialData={
              editingJob
                ? {
                    profileId: editingJob.profileId,
                    templateId: editingJob.templateId,
                    receiverListId: editingJob.receiverListId,
                    sendTime: getJobSendTime(editingJob),
                  }
                : undefined
            }
            mode={editingJob ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
