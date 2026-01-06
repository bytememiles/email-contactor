export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'sending'
  | 'completed'
  | 'failed';

export interface JobError {
  timestamp: Date;
  message: string;
  email?: string; // Email address that failed (if applicable)
  receiverId?: string; // Receiver ID that failed (if applicable)
  type: 'error' | 'warning';
}

export interface EmailJob {
  id: string;
  profileId: string;
  templateId: string;
  receiverListId: string;
  status: JobStatus;
  scheduledTime: Date; // Earliest send time (for job activation)
  sendTime?: string; // Target send time in HH:mm format (e.g., "10:00") - used for timezone-aware sending
  sentCount: number;
  failedCount: number;
  totalCount: number;
  sentReceiverIds?: string[]; // Track which receiver IDs have been sent to (for timezone-aware jobs)
  createdAt: Date;
  updatedAt: Date;
  error?: string; // Main error message (for backward compatibility)
  errors?: JobError[]; // Detailed error history
  warnings?: JobError[]; // Warning messages
}

export interface JobForm {
  profileId: string;
  templateId: string;
  receiverListId: string;
  sendTime?: string; // Time in HH:mm format (e.g., "10:00")
}

export interface ScheduledSendTime {
  timezone: string;
  sendTime: Date; // 10 AM local time
  receiverIds: string[];
}
