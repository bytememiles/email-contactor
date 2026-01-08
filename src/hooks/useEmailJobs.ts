import { useCallback, useEffect, useState } from 'react';

import { EmailJob, JobError, JobForm, JobStatus } from '@/types/job';

const STORAGE_KEY = 'email_jobs';

export const useEmailJobs = () => {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Load jobs from localStorage on mount
  useEffect(() => {
    const loadJobs = () => {
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
              errors?: Array<
                Omit<JobError, 'timestamp'> & { timestamp: string }
              >;
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
    };

    loadJobs();

    // Listen for storage changes (for cross-tab sync and real-time updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsedJobs = JSON.parse(e.newValue).map((job: unknown) => {
            const jobData = job as Omit<
              EmailJob,
              'createdAt' | 'updatedAt' | 'scheduledTime'
            > & {
              createdAt: string;
              updatedAt: string;
              scheduledTime: string;
              errors?: Array<
                Omit<JobError, 'timestamp'> & { timestamp: string }
              >;
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
        } catch (error) {
          console.error('Error parsing jobs from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage periodically for updates (in case storage events don't fire)
    // This helps with real-time updates when jobs are updated in the same tab
    const pollInterval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsedJobs = JSON.parse(stored).map((job: unknown) => {
            const jobData = job as Omit<
              EmailJob,
              'createdAt' | 'updatedAt' | 'scheduledTime'
            > & {
              createdAt: string;
              updatedAt: string;
              scheduledTime: string;
              errors?: Array<
                Omit<JobError, 'timestamp'> & { timestamp: string }
              >;
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
          setJobs((currentJobs) => {
            // Only update if there are actual changes (avoid unnecessary re-renders)
            const currentJobsStr = JSON.stringify(currentJobs);
            const newJobsStr = JSON.stringify(parsedJobs);
            if (currentJobsStr !== newJobsStr) {
              return parsedJobs;
            }
            return currentJobs;
          });
        } catch (error) {
          console.error('Error polling jobs from storage:', error);
        }
      }
    }, 1000); // Poll every second for real-time updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Helper function to load jobs from localStorage
  const loadJobsFromStorage = useCallback((): EmailJob[] => {
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
        return parsedJobs;
      }
    } catch (error) {
      console.error('Error loading jobs from storage:', error);
    }
    return [];
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

      setJobs((currentJobs) => {
        const updatedJobs = [...currentJobs, newJob];
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }
        return updatedJobs;
      });

      return newJob;
    },
    []
  );

  // Update job status
  const updateJobStatus = useCallback(
    (id: string, status: JobStatus, error?: string) => {
      setJobs((currentJobs) => {
        const updatedJobs = currentJobs.map((job) => {
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

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }

        return updatedJobs;
      });
    },
    []
  );

  // Update job progress
  const updateJobProgress = useCallback(
    (
      id: string,
      sentCount: number,
      failedCount: number,
      sentReceiverIds?: string[]
    ) => {
      setJobs((currentJobs) => {
        const updatedJobs = currentJobs.map((job) => {
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

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }

        return updatedJobs;
      });
    },
    []
  );

  // Update job
  const updateJob = useCallback(
    (id: string, jobData: JobForm, scheduledTime: Date, totalCount: number) => {
      setJobs((currentJobs) => {
        const updatedJobs = currentJobs.map((job) => {
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

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }

        return updatedJobs;
      });
    },
    []
  );

  // Delete job
  const deleteJob = useCallback((id: string) => {
    setJobs((currentJobs) => {
      const updatedJobs = currentJobs.filter((job) => job.id !== id);
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
      } catch (err) {
        console.error('Error saving jobs:', err);
      }
      return updatedJobs;
    });
  }, []);

  // Get job by ID - reads from current state
  const getJob = useCallback(
    (id: string) => {
      // Read from localStorage to get the latest state
      const currentJobs = loadJobsFromStorage();
      return currentJobs.find((job) => job.id === id);
    },
    [loadJobsFromStorage]
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
      setJobs((currentJobs) => {
        const updatedJobs = currentJobs.map((job) => {
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

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }

        return updatedJobs;
      });
    },
    []
  );

  // Add warning to job
  const addJobWarning = useCallback(
    (id: string, message: string, email?: string, receiverId?: string) => {
      setJobs((currentJobs) => {
        const updatedJobs = currentJobs.map((job) => {
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

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error('Error saving jobs:', err);
        }

        return updatedJobs;
      });
    },
    []
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
