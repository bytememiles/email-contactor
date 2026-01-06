export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'sending'
  | 'completed'
  | 'failed';

export interface EmailJob {
  id: string;
  profileId: string;
  templateId: string;
  receiverListId: string;
  status: JobStatus;
  scheduledTime: Date; // Calculated based on recipient timezones
  sentCount: number;
  failedCount: number;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
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
