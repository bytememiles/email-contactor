'use client';

import React from 'react';

import { useEmailJobs } from '@/hooks/useEmailJobs';
import { useJobExecutor } from '@/hooks/useJobExecutor';
import { useProfiles } from '@/hooks/useProfiles';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useTemplates } from '@/hooks/useTemplates';
import { SMTPConfig } from '@/types/smtp';
import { decryptObject } from '@/utils/encryption';

const SMTP_CONFIGS_KEY = 'smtp-configurations';

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
 * Component that runs in the background to execute scheduled jobs
 * This component doesn't render anything - it just runs the executor hook
 */
export const JobExecutor: React.FC = () => {
  const {
    jobs,
    getJob,
    updateJobStatus,
    updateJobProgress,
    addJobError,
    addJobWarning,
  } = useEmailJobs();
  const { getProfile } = useProfiles();
  const { loadReceiverList } = useReceiverLists();
  const { getTemplate } = useTemplates();

  // Helper function to get profile with fullName
  const getProfileWithName = (id: string) => {
    const profile = getProfile(id);
    if (!profile) return undefined;
    return {
      smtpConfigId: profile.smtpConfigId,
      fullName: profile.fullName,
    };
  };

  useJobExecutor({
    jobs,
    getJob,
    updateJobStatus,
    updateJobProgress,
    addJobError,
    addJobWarning,
    loadReceiverList,
    getTemplate,
    getProfile: getProfileWithName,
    getSMTPConfig: loadSMTPConfig,
  });

  // This component doesn't render anything
  return null;
};
