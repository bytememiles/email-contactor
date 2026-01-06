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
import { useEmailJobs } from '@/hooks/useEmailJobs';
import { useProfiles } from '@/hooks/useProfiles';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useTemplates } from '@/hooks/useTemplates';
import { EmailJob, JobForm } from '@/types/job';

export default function JobsPage() {
  const router = useRouter();
  const { jobs, loading, createJob, updateJob, deleteJob } = useEmailJobs();
  const { profiles } = useProfiles();
  const { templates } = useTemplates();
  const { lists } = useReceiverLists();

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<EmailJob | null>(null);

  const handleCreateJob = (data: JobForm) => {
    // Find the receiver list
    const receiverList = lists.find((list) => list.id === data.receiverListId);
    if (!receiverList) {
      alert('Receiver list not found');
      return;
    }

    // Parse the send time from the form (format: "HH:mm")
    const sendTime = data.sendTime || '10:00';
    const [hours, minutes] = sendTime.split(':').map(Number);

    // Create scheduled time with the specified time
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time is in the past, schedule for tomorrow
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    if (editingJob) {
      // Update existing job
      updateJob(
        editingJob.id,
        data,
        scheduledTime,
        receiverList.validReceivers
      );
      setEditingJob(null);
    } else {
      // Create new job
      createJob(data, scheduledTime, receiverList.validReceivers);
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
  const getJobSendTime = (job: EmailJob): string => {
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Email Jobs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage scheduled email jobs.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<History />}
            variant="outlined"
            onClick={() => router.push('/settings/jobs/history')}
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

      <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingJob ? 'Edit Email Job' : 'Create Email Job'}
        </DialogTitle>
        <DialogContent>
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
