'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useNotification } from '@/contexts/NotificationContext';
import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import { EmailJob, JobStatus } from '@/types/job';
import { ProcessedReceiver } from '@/types/receiver';
import { SMTPConfig } from '@/types/smtp';
import { EmailTemplate } from '@/types/template';

// Type for the debug API exposed on window
interface JobExecutorDebugAPI {
  checkAndExecuteJobs: () => void;
  getStatus: () => {
    isProcessing: boolean;
    executingJobs: string[];
    pollingInterval: number;
  };
}

// Extend Window interface to include the debug API
declare global {
  interface Window {
    __jobExecutor?: JobExecutorDebugAPI;
  }
}

interface JobExecutorDependencies {
  jobs: EmailJob[];
  getJob: (id: string) => EmailJob | undefined;
  updateJobStatus: (id: string, status: JobStatus, error?: string) => void;
  updateJobProgress: (
    id: string,
    sentCount: number,
    failedCount: number
  ) => void;
  addJobError: (
    id: string,
    message: string,
    email?: string,
    receiverId?: string
  ) => void;
  addJobWarning: (
    id: string,
    message: string,
    email?: string,
    receiverId?: string
  ) => void;
  loadReceiverList: (
    id: string
  ) => Promise<{ receivers: ProcessedReceiver[] } | null>;
  getTemplate: (id: string) => EmailTemplate | undefined;
  getProfile: (
    id: string
  ) => { smtpConfigId: string; fullName: string } | undefined;
  getSMTPConfig: (id: string) => SMTPConfig | null;
}

// Configuration constants
const API_TIMEOUT_MS = 30000; // 30 seconds timeout for API calls
const BASE_DELAY_MS = 200; // Base delay between emails (increased from 100ms)
const MAX_RETRIES = 3; // Maximum retries for transient failures
const RETRY_DELAY_MS = 1000; // Initial retry delay
const POLLING_INTERVAL_MS = 10000; // Check every 10 seconds (reduced from 60s for better responsiveness)

/**
 * Replace template placeholders with actual values
 */
function replacePlaceholders(
  content: string,
  receiver: ProcessedReceiver,
  senderName: string
): string {
  // Extract first name from fullName (first word)
  const firstName = receiver.firstName || receiver.fullName.split(' ')[0] || '';

  return content
    .replace(/\[first_name\]/gi, firstName)
    .replace(/\[sender_name\]/gi, senderName);
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send email with retry logic and timeout
 */
async function sendEmailWithRetry(
  emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
    smtpConfig: SMTPConfig;
  },
  retries = MAX_RETRIES
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (response.ok && !result.error) {
          return true;
        }

        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          console.error(
            `Client error sending email to ${emailData.to}:`,
            result.error
          );
          return false;
        }

        // Server error (5xx) or other errors - retry if attempts remain
        if (attempt < retries) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
          const warning = `Failed to send email to ${emailData.to} (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`;
          console.warn(warning);
          await sleep(delay);
          continue;
        }

        const error = `Failed to send email to ${emailData.to} after ${retries + 1} attempts: ${result.error || 'Unknown error'}`;
        console.error(error);
        return false;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // AbortError means timeout
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(
            `Timeout sending email to ${emailData.to} (${API_TIMEOUT_MS}ms)`
          );
          if (attempt < retries) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }
          return false;
        }

        // Network errors - retry if attempts remain
        if (attempt < retries) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `Network error sending email to ${emailData.to} (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`,
            fetchError
          );
          await sleep(delay);
          continue;
        }

        console.error(
          `Failed to send email to ${emailData.to} after ${retries + 1} attempts:`,
          fetchError
        );
        return false;
      }
    } catch (error) {
      // Unexpected errors
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      console.error(
        `Unexpected error sending email to ${emailData.to}:`,
        error
      );
      return false;
    }
  }

  return false;
}

/**
 * Execute a single job
 */
async function executeJob(
  job: EmailJob,
  deps: JobExecutorDependencies,
  showNotification: ReturnType<typeof useNotification>
): Promise<void> {
  const {
    getJob,
    updateJobStatus,
    updateJobProgress,
    addJobError,
    loadReceiverList,
    getTemplate,
    getProfile,
    getSMTPConfig,
  } = deps;

  // Double-check job status before executing (prevent race conditions)
  const currentJob = getJob(job.id);
  if (!currentJob) {
    const message = `Job ${job.id} no longer exists, skipping execution`;
    console.warn(`[JobExecutor] ${message}`);
    showNotification.showWarning(message);
    return;
  }

  // Skip if job is already in progress or completed
  if (
    currentJob.status === 'sending' ||
    currentJob.status === 'completed' ||
    currentJob.status === 'failed'
  ) {
    const message = `Job ${job.id} is already ${currentJob.status}, skipping execution`;
    console.warn(`[JobExecutor] ${message}`);
    showNotification.showWarning(message);
    return;
  }

  console.log(`[JobExecutor] Executing job ${job.id.substring(0, 8)}...`, {
    profileId: job.profileId,
    templateId: job.templateId,
    receiverListId: job.receiverListId,
    scheduledTime: job.scheduledTime.toISOString(),
  });

  try {
    // Update job status to 'sending' atomically
    updateJobStatus(job.id, 'sending');
    showNotification.showInfo(
      `Job "${job.id.substring(0, 8)}..." started sending`
    );

    // Load receiver list
    console.log(`[JobExecutor] Loading receiver list: ${job.receiverListId}`);
    const receiverList = await loadReceiverList(job.receiverListId);
    if (!receiverList) {
      const error = 'Receiver list not found';
      console.error(`[JobExecutor] ${error}: ${job.receiverListId}`);
      addJobError(job.id, error);
      throw new Error(error);
    }
    console.log(
      `[JobExecutor] Loaded receiver list with ${receiverList.receivers.length} receivers`
    );

    // Load template
    console.log(`[JobExecutor] Loading template: ${job.templateId}`);
    const template = getTemplate(job.templateId);
    if (!template) {
      const error = 'Template not found';
      console.error(`[JobExecutor] ${error}: ${job.templateId}`);
      addJobError(job.id, error);
      throw new Error(error);
    }
    console.log(`[JobExecutor] Loaded template: ${template.name}`);

    // Load profile
    console.log(`[JobExecutor] Loading profile: ${job.profileId}`);
    const profile = getProfile(job.profileId);
    if (!profile) {
      const error = 'Profile not found';
      console.error(`[JobExecutor] ${error}: ${job.profileId}`);
      addJobError(job.id, error);
      throw new Error(error);
    }
    console.log(`[JobExecutor] Loaded profile: ${profile.fullName}`);

    // Load SMTP config
    console.log(`[JobExecutor] Loading SMTP config: ${profile.smtpConfigId}`);
    const smtpConfig = getSMTPConfig(profile.smtpConfigId);
    if (!smtpConfig) {
      const error = `SMTP configuration not found: ${profile.smtpConfigId}`;
      console.error(`[JobExecutor] ${error}`);
      addJobError(job.id, error);
      throw new Error(error);
    }
    console.log(
      `[JobExecutor] Loaded SMTP config: ${smtpConfig.host}:${smtpConfig.port}`
    );

    // Get sender name from profile (we'll use fullName)
    const senderName = profile.fullName || 'Sender';

    // Filter valid receivers
    const validReceivers = receiverList.receivers.filter((r) => r.isValid);
    console.log(
      `[JobExecutor] Found ${validReceivers.length} valid receivers out of ${receiverList.receivers.length} total`
    );

    if (validReceivers.length === 0) {
      const error = 'No valid receivers found';
      console.error(`[JobExecutor] ${error}`);
      addJobError(job.id, error);
      throw new Error(error);
    }

    // Process emails one by one
    let sentCount = 0;
    let failedCount = 0;

    for (const receiver of validReceivers) {
      try {
        // Replace placeholders in template content and subject
        const personalizedContent = replacePlaceholders(
          template.content,
          receiver,
          senderName
        );
        const personalizedSubject = replacePlaceholders(
          template.subject || 'No Subject',
          receiver,
          senderName
        );

        // Convert markdown to email
        const { html, text } = convertMarkdownToEmail(personalizedContent);
        const styledHtml = addEmailStyles(html);

        // Send email to all email addresses for this receiver
        for (const email of receiver.emails) {
          console.log(
            `[JobExecutor] Sending email to ${email} (receiver: ${receiver.id})`
          );
          const success = await sendEmailWithRetry({
            to: email,
            subject: personalizedSubject,
            html: styledHtml,
            text,
            smtpConfig,
          });

          if (success) {
            sentCount++;
            console.log(`[JobExecutor] ✓ Email sent successfully to ${email}`);
          } else {
            failedCount++;
            const errorMessage = `Failed to send email to ${email}`;
            console.error(`[JobExecutor] ✗ ${errorMessage}`);
            addJobError(job.id, errorMessage, email, receiver.id);
          }

          // Update progress after each email (for better real-time feedback)
          updateJobProgress(job.id, sentCount, failedCount);

          // Rate limiting delay between emails to avoid overwhelming SMTP server
          // Use exponential backoff if we're seeing failures
          const delay =
            failedCount > sentCount ? BASE_DELAY_MS * 2 : BASE_DELAY_MS;
          await sleep(delay);
        }

        // Update progress after each receiver (final update for this receiver)
        updateJobProgress(job.id, sentCount, failedCount);
      } catch (error) {
        const errorMessage = `Error sending email to receiver ${receiver.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        console.error(errorMessage, error);
        failedCount++;
        addJobError(job.id, errorMessage, undefined, receiver.id);
        updateJobProgress(job.id, sentCount, failedCount);
      }
    }

    // Final status update
    if (failedCount === 0) {
      updateJobStatus(job.id, 'completed');
      showNotification.showSuccess(
        `Job "${job.id.substring(0, 8)}..." completed successfully. Sent ${sentCount} email(s)`
      );
    } else if (sentCount === 0) {
      const errorMessage = 'All emails failed to send';
      updateJobStatus(job.id, 'failed', errorMessage);
      addJobError(job.id, errorMessage);
      showNotification.showError(
        `Job "${job.id.substring(0, 8)}..." failed. All ${failedCount} email(s) failed to send`
      );
    } else {
      updateJobStatus(job.id, 'completed'); // Partial success
      showNotification.showWarning(
        `Job "${job.id.substring(0, 8)}..." completed with errors. Sent ${sentCount}, failed ${failedCount}`
      );
    }
  } catch (error) {
    console.error(`Error executing job ${job.id}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    updateJobStatus(job.id, 'failed', errorMessage);
    addJobError(job.id, errorMessage);
    showNotification.showError(
      `Job "${job.id.substring(0, 8)}..." failed: ${errorMessage}`
    );
  }
}

/**
 * Hook to execute scheduled jobs
 */
export const useJobExecutor = (deps: JobExecutorDependencies) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const executingJobsRef = useRef<Set<string>>(new Set());
  const showNotification = useNotification();

  // Store deps in ref to avoid dependency array issues
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const checkAndExecuteJobs = useCallback(async () => {
    // Prevent concurrent executions
    if (isProcessingRef.current) {
      console.log('[JobExecutor] Already processing jobs, skipping check');
      return;
    }

    const now = new Date();
    const currentDeps = depsRef.current;

    console.log(`[JobExecutor] Checking for due jobs at ${now.toISOString()}`);
    console.log(`[JobExecutor] Total jobs: ${currentDeps.jobs.length}`);

    // Filter jobs that are due and not already executing
    const dueJobs = currentDeps.jobs.filter(
      (job) =>
        (job.status === 'scheduled' || job.status === 'pending') &&
        job.scheduledTime <= now &&
        !executingJobsRef.current.has(job.id) // Prevent duplicate execution
    );

    if (dueJobs.length === 0) {
      const scheduledJobs = currentDeps.jobs.filter(
        (job) => job.status === 'scheduled' || job.status === 'pending'
      );
      if (scheduledJobs.length > 0) {
        console.log(
          `[JobExecutor] No due jobs. ${scheduledJobs.length} scheduled job(s) found:`,
          scheduledJobs.map((j) => ({
            id: j.id.substring(0, 8),
            status: j.status,
            scheduledTime: j.scheduledTime.toISOString(),
            timeUntil:
              Math.round((j.scheduledTime.getTime() - now.getTime()) / 1000) +
              's',
          }))
        );
      }
      return;
    }

    console.log(
      `[JobExecutor] Found ${dueJobs.length} due job(s):`,
      dueJobs.map((j) => ({
        id: j.id.substring(0, 8),
        scheduledTime: j.scheduledTime.toISOString(),
      }))
    );

    isProcessingRef.current = true;

    try {
      // Execute jobs sequentially to avoid overwhelming the system
      for (const job of dueJobs) {
        // Mark job as executing
        executingJobsRef.current.add(job.id);

        try {
          console.log(
            `[JobExecutor] Starting execution of job ${job.id.substring(0, 8)}...`
          );
          await executeJob(job, currentDeps, showNotification);
          console.log(
            `[JobExecutor] Completed execution of job ${job.id.substring(0, 8)}`
          );
        } finally {
          // Remove from executing set when done (success or failure)
          executingJobsRef.current.delete(job.id);
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [showNotification]); // Include showNotification in dependencies

  useEffect(() => {
    console.log('[JobExecutor] Initializing job executor...');
    console.log(
      `[JobExecutor] Polling interval: ${POLLING_INTERVAL_MS}ms (${POLLING_INTERVAL_MS / 1000}s)`
    );

    // Check immediately on mount
    checkAndExecuteJobs();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      checkAndExecuteJobs();
    }, POLLING_INTERVAL_MS);

    console.log('[JobExecutor] Job executor initialized and polling started');

    // Cleanup on unmount
    // Capture ref value at effect time to avoid stale closure
    const executingJobsAtEffectTime = executingJobsRef.current;

    return () => {
      console.log('[JobExecutor] Cleaning up job executor...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Clear executing jobs set on unmount - use captured value
      executingJobsAtEffectTime.clear();
    };
  }, [checkAndExecuteJobs]);

  // Expose checkAndExecuteJobs for manual triggering (useful for debugging)
  // This allows manual job execution from browser console: window.__jobExecutor?.checkAndExecuteJobs()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__jobExecutor = {
        checkAndExecuteJobs,
        getStatus: () => ({
          isProcessing: isProcessingRef.current,
          executingJobs: Array.from(executingJobsRef.current),
          pollingInterval: POLLING_INTERVAL_MS,
        }),
      };
      console.log('[JobExecutor] Debug API available: window.__jobExecutor');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__jobExecutor;
      }
    };
  }, [checkAndExecuteJobs]);

  return {
    checkAndExecuteJobs,
  };
};
