import { useCallback, useState } from 'react';

import { useNotification } from '@/contexts/NotificationContext';
import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import { ProcessedReceiver } from '@/types/receiver';
import { SMTPConfig } from '@/types/smtp';
import { EmailTemplate } from '@/types/template';
import { decryptObject } from '@/utils/encryption';

const SMTP_CONFIGS_KEY = 'smtp-configurations';
const API_TIMEOUT_MS = 30000; // 30 seconds timeout for API calls
const BASE_DELAY_MS = 200; // Base delay between emails
const MAX_RETRIES = 3; // Maximum retries for transient failures
const RETRY_DELAY_MS = 1000; // Initial retry delay

/**
 * Load SMTP config from localStorage
 */
function loadSMTPConfig(id: string): SMTPConfig | null {
  try {
    const stored = localStorage.getItem(SMTP_CONFIGS_KEY);
    if (stored) {
      const decrypted = decryptObject<SMTPConfig[]>(stored);
      if (decrypted && Array.isArray(decrypted)) {
        return decrypted.find((config) => config.id === id) || null;
      }
    }
  } catch (error) {
    console.error('Failed to load SMTP config:', error);
  }
  return null;
}

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
          await sleep(delay);
          continue;
        }

        console.error(
          `Failed to send email to ${emailData.to} after ${retries + 1} attempts: ${result.error || 'Unknown error'}`
        );
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

export interface BulkSendProgress {
  total: number;
  sent: number;
  failed: number;
  currentReceiver?: ProcessedReceiver;
  isComplete: boolean;
}

export interface BulkSendOptions {
  receivers: ProcessedReceiver[];
  template: EmailTemplate;
  profile: { fullName: string; smtpConfigId: string };
  onProgress?: (progress: BulkSendProgress) => void;
}

export const useBulkEmailSender = () => {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<BulkSendProgress>({
    total: 0,
    sent: 0,
    failed: 0,
    isComplete: false,
  });
  const showNotification = useNotification();

  const sendBulkEmails = useCallback(
    async (
      options: BulkSendOptions
    ): Promise<{
      success: boolean;
      sent: number;
      failed: number;
    }> => {
      const { receivers, template, profile, onProgress } = options;

      // Filter valid receivers
      const validReceivers = receivers.filter((r) => r.isValid);

      if (validReceivers.length === 0) {
        showNotification.showError('No valid receivers found');
        return { success: false, sent: 0, failed: 0 };
      }

      // Load SMTP config
      const smtpConfig = loadSMTPConfig(profile.smtpConfigId);
      if (!smtpConfig) {
        showNotification.showError(
          `SMTP configuration not found: ${profile.smtpConfigId}`
        );
        return { success: false, sent: 0, failed: 0 };
      }

      setIsSending(true);
      setProgress({
        total: validReceivers.length,
        sent: 0,
        failed: 0,
        isComplete: false,
      });

      const senderName = profile.fullName || 'Sender';
      let sentCount = 0;
      let failedCount = 0;

      try {
        for (const receiver of validReceivers) {
          try {
            // Update current receiver
            setProgress((prev) => ({
              ...prev,
              currentReceiver: receiver,
            }));

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
            let receiverSent = false;
            for (const email of receiver.emails) {
              const success = await sendEmailWithRetry({
                to: email,
                subject: personalizedSubject,
                html: styledHtml,
                text,
                smtpConfig,
              });

              if (success) {
                sentCount++;
                receiverSent = true;
              } else {
                failedCount++;
              }

              // Update progress
              const currentProgress = {
                total: validReceivers.length,
                sent: sentCount,
                failed: failedCount,
                currentReceiver: receiver,
                isComplete: false,
              };
              setProgress(currentProgress);
              onProgress?.(currentProgress);

              // Rate limiting delay between emails
              const delay =
                failedCount > sentCount ? BASE_DELAY_MS * 2 : BASE_DELAY_MS;
              await sleep(delay);
            }
          } catch (error) {
            const errorMessage = `Error sending email to receiver ${receiver.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`;
            console.error(errorMessage, error);
            failedCount++;
            const currentProgress = {
              total: validReceivers.length,
              sent: sentCount,
              failed: failedCount,
              currentReceiver: receiver,
              isComplete: false,
            };
            setProgress(currentProgress);
            onProgress?.(currentProgress);
          }
        }

        // Final status
        const finalProgress = {
          total: validReceivers.length,
          sent: sentCount,
          failed: failedCount,
          isComplete: true,
        };
        setProgress(finalProgress);
        onProgress?.(finalProgress);

        if (failedCount === 0) {
          showNotification.showSuccess(
            `Successfully sent ${sentCount} email(s) to ${validReceivers.length} receiver(s)`
          );
        } else if (sentCount === 0) {
          showNotification.showError(
            `Failed to send all ${failedCount} email(s)`
          );
        } else {
          showNotification.showWarning(
            `Sent ${sentCount} email(s), ${failedCount} failed`
          );
        }

        return {
          success: failedCount === 0,
          sent: sentCount,
          failed: failedCount,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Bulk email sending error:', error);
        showNotification.showError(
          `Bulk email sending failed: ${errorMessage}`
        );
        return { success: false, sent: sentCount, failed: failedCount };
      } finally {
        setIsSending(false);
      }
    },
    [showNotification]
  );

  const cancel = useCallback(() => {
    setIsSending(false);
    setProgress({
      total: 0,
      sent: 0,
      failed: 0,
      isComplete: true,
    });
  }, []);

  return {
    isSending,
    progress,
    sendBulkEmails,
    cancel,
  };
};
