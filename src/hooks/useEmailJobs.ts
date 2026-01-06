import { useCallback, useEffect, useState } from 'react';

import { EmailJob, JobError, JobForm, JobStatus } from '@/types/job';

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
            errors?: Array<Omit<JobError, 'timestamp'> & { timestamp: string }>;
            warnings?: Array<
              Omit<JobError, 'timestamp'> & { timestamp: string }
            >;
          };
          return {
            ...jobData,
            createdAt: new Date(jobData.createdAt),
            updatedAt: new Date(jobData.updatedAt),
            scheduledTime: new Date(jobData.scheduledTime),
            errors: jobData.errors?.map((e) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            })),
            warnings: jobData.warnings?.map((w) => ({
              ...w,
              timestamp: new Date(w.timestamp),
            })),
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
        sendTime: jobData.sendTime, // Store sendTime for timezone-aware sending
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
    (
      id: string,
      sentCount: number,
      failedCount: number,
      sentReceiverIds?: string[]
    ) => {
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
            sentReceiverIds:
              sentReceiverIds !== undefined
                ? sentReceiverIds
                : job.sentReceiverIds,
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

  // Update job
  const updateJob = useCallback(
    (id: string, jobData: JobForm, scheduledTime: Date, totalCount: number) => {
      const updatedJobs = jobs.map((job) => {
        if (job.id === id) {
          return {
            ...job,
            profileId: jobData.profileId,
            templateId: jobData.templateId,
            receiverListId: jobData.receiverListId,
            scheduledTime,
            sendTime: jobData.sendTime, // Update sendTime for timezone-aware sending
            totalCount,
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

  // Add error to job
  const addJobError = useCallback(
    (id: string, message: string, email?: string, receiverId?: string) => {
      const updatedJobs = jobs.map((job) => {
        if (job.id === id) {
          const error: JobError = {
            timestamp: new Date(),
            message,
            email,
            receiverId,
            type: 'error',
          };
          return {
            ...job,
            errors: [...(job.errors || []), error],
            error: message, // Keep main error for backward compatibility
            updatedAt: new Date(),
          };
        }
        return job;
      });

      saveJobs(updatedJobs);
    },
    [jobs, saveJobs]
  );

  // Add warning to job
  const addJobWarning = useCallback(
    (id: string, message: string, email?: string, receiverId?: string) => {
      const updatedJobs = jobs.map((job) => {
        if (job.id === id) {
          const warning: JobError = {
            timestamp: new Date(),
            message,
            email,
            receiverId,
            type: 'warning',
          };
          return {
            ...job,
            warnings: [...(job.warnings || []), warning],
            updatedAt: new Date(),
          };
        }
        return job;
      });

      saveJobs(updatedJobs);
    },
    [jobs, saveJobs]
  );

  return {
    jobs,
    loading,
    createJob,
    updateJob,
    updateJobStatus,
    updateJobProgress,
    deleteJob,
    getJob,
    getJobsByStatus,
    getUpcomingJobs,
    addJobError,
    addJobWarning,
  };
};
