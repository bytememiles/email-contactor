import { useCallback, useEffect, useState } from 'react';

import { EmailJob, JobForm, JobStatus } from '@/types/job';

const STORAGE_KEY = 'email_jobs';

export const useEmailJobs = () => {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedJobs = JSON.parse(stored).map((job: unknown) => {
          const jobData = job as Omit<
            EmailJob,
            'createdAt' | 'updatedAt' | 'scheduledTime'
          > & {
            createdAt: string;
            updatedAt: string;
            scheduledTime: string;
          };
          return {
            ...jobData,
            createdAt: new Date(jobData.createdAt),
            updatedAt: new Date(jobData.updatedAt),
            scheduledTime: new Date(jobData.scheduledTime),
          };
        });
        setJobs(parsedJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save jobs to localStorage whenever they change
  const saveJobs = useCallback((newJobs: EmailJob[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
      setJobs(newJobs);
    } catch (error) {
      console.error('Error saving jobs:', error);
    }
  }, []);

  // Create new job
  const createJob = useCallback(
    (jobData: JobForm, scheduledTime: Date, totalCount: number) => {
      const newJob: EmailJob = {
        id: crypto.randomUUID(),
        profileId: jobData.profileId,
        templateId: jobData.templateId,
        receiverListId: jobData.receiverListId,
        status: 'scheduled',
        scheduledTime,
        sentCount: 0,
        failedCount: 0,
        totalCount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedJobs = [...jobs, newJob];
      saveJobs(updatedJobs);
      return newJob;
    },
    [jobs, saveJobs]
  );

  // Update job status
  const updateJobStatus = useCallback(
    (id: string, status: JobStatus, error?: string) => {
      const updatedJobs = jobs.map((job) => {
        if (job.id === id) {
          return {
            ...job,
            status,
            error,
            updatedAt: new Date(),
          };
        }
        return job;
      });

      saveJobs(updatedJobs);
    },
    [jobs, saveJobs]
  );

  // Update job progress
  const updateJobProgress = useCallback(
    (id: string, sentCount: number, failedCount: number) => {
      const updatedJobs = jobs.map((job) => {
        if (job.id === id) {
          const newStatus: JobStatus =
            sentCount + failedCount >= job.totalCount
              ? failedCount > 0
                ? 'failed'
                : 'completed'
              : 'sending';

          return {
            ...job,
            sentCount,
            failedCount,
            status: newStatus,
            updatedAt: new Date(),
          };
        }
        return job;
      });

      saveJobs(updatedJobs);
    },
    [jobs, saveJobs]
  );

  // Delete job
  const deleteJob = useCallback(
    (id: string) => {
      const updatedJobs = jobs.filter((job) => job.id !== id);
      saveJobs(updatedJobs);
    },
    [jobs, saveJobs]
  );

  // Get job by ID
  const getJob = useCallback(
    (id: string) => {
      return jobs.find((job) => job.id === id);
    },
    [jobs]
  );

  // Get jobs by status
  const getJobsByStatus = useCallback(
    (status: JobStatus) => {
      return jobs.filter((job) => job.status === status);
    },
    [jobs]
  );

  // Get upcoming jobs (scheduled and pending)
  const getUpcomingJobs = useCallback(() => {
    const now = new Date();
    return jobs
      .filter(
        (job) =>
          (job.status === 'scheduled' || job.status === 'pending') &&
          job.scheduledTime > now
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [jobs]);

  return {
    jobs,
    loading,
    createJob,
    updateJobStatus,
    updateJobProgress,
    deleteJob,
    getJob,
    getJobsByStatus,
    getUpcomingJobs,
  };
};
