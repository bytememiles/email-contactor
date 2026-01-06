'use client';

import React, { useState } from 'react';
import { Add } from '@mui/icons-material';
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
import { JobForm } from '@/types/job';

export default function JobsPage() {
  const { jobs, loading, createJob, deleteJob } = useEmailJobs();
  const { profiles } = useProfiles();
  const { templates } = useTemplates();
  const { lists } = useReceiverLists();

  const [showForm, setShowForm] = useState(false);

  const handleCreateJob = (data: JobForm) => {
    // Find the receiver list
    const receiverList = lists.find((list) => list.id === data.receiverListId);
    if (!receiverList) {
      alert('Receiver list not found');
      return;
    }

    // For now, we'll use a simple scheduling approach
    // In a real implementation, you'd load the actual receivers and calculate times
    const scheduledTime = new Date();
    scheduledTime.setHours(10, 0, 0, 0);
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    createJob(data, scheduledTime, receiverList.validReceivers);
    setShowForm(false);
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

      {loading ? (
        <Typography>Loading jobs...</Typography>
      ) : (
        <JobList
          jobs={sortedJobs}
          onDelete={deleteJob}
          profileNames={profileNames}
          templateNames={templateNames}
        />
      )}

      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Email Job</DialogTitle>
        <DialogContent>
          <JobCreator
            profiles={profiles}
            templates={templates}
            receiverLists={lists}
            onSubmit={handleCreateJob}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
