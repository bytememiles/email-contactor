import { useRef, useState } from 'react';

import { addEmailStyles, convertMarkdownToEmail } from '@/lib/markdown';
import {
  AttachmentData,
  EmailPriority,
  NotificationState,
} from '@/types/email';
import { SMTPConfig } from '@/types/smtp';

export const useEmailSender = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendTimer, setSendTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info'
  ) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const processAttachments = async (
    files: File[]
  ): Promise<AttachmentData[]> => {
    return Promise.all(
      files.map(async (file) => {
        return new Promise<AttachmentData>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:mime;base64, prefix
            resolve({
              filename: file.name,
              content: base64,
              encoding: 'base64',
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const sendEmail = async (
    toRecipients: string[],
    ccRecipients: string[],
    subject: string,
    markdown: string,
    attachments: File[],
    priority?: EmailPriority,
    smtpConfig?: SMTPConfig
  ) => {
    try {
      const { html, text } = convertMarkdownToEmail(markdown);
      const styledHtml = addEmailStyles(html);

      // Process attachments
      const processedAttachments = await processAttachments(attachments);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toRecipients.join(','),
          cc: ccRecipients.length > 0 ? ccRecipients.join(',') : undefined,
          subject,
          html: styledHtml,
          text,
          priority,
          attachments:
            processedAttachments.length > 0 ? processedAttachments : undefined,
          smtpConfig,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Email sent successfully!', 'success');
        return { success: true, html: styledHtml, text };
      } else {
        showNotification(result.error || 'Failed to send email', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('Failed to send email. Please try again.', 'error');
      return { success: false };
    } finally {
      setIsSending(false);
      setSendTimer(null);
      sendTimeoutRef.current = null;
    }
  };

  const startSendCountdown = (
    toRecipients: string[],
    ccRecipients: string[],
    subject: string,
    markdown: string,
    attachments: File[],
    priority?: EmailPriority,
    smtpConfig?: SMTPConfig,
    onSuccess?: () => void
  ) => {
    setIsSending(true);
    setCountdown(5);
    showNotification(
      'Email will be sent in 5 seconds. Click send again to cancel.',
      'info'
    );

    // Countdown interval
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set 5-second delay
    const timeout = setTimeout(async () => {
      clearInterval(countdownInterval);
      const result = await sendEmail(
        toRecipients,
        ccRecipients,
        subject,
        markdown,
        attachments,
        priority,
        smtpConfig
      );
      if (result.success && onSuccess) {
        onSuccess();
      }
    }, 5000);

    setSendTimer(timeout);
    sendTimeoutRef.current = timeout;
  };

  const cancelSend = () => {
    if (sendTimer) {
      clearTimeout(sendTimer);
      setSendTimer(null);
      sendTimeoutRef.current = null;
    }
    setIsSending(false);
    setCountdown(0);
    showNotification('Email sending cancelled', 'info');
  };

  return {
    isSending,
    countdown,
    notification,
    showNotification,
    handleCloseNotification,
    startSendCountdown,
    cancelSend,
  };
};
