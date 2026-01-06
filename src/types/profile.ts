export interface Profile {
  id: string;
  fullName: string;
  smtpConfigId: string; // Links to SMTP config
  templateIds: string[]; // Multiple templates per profile
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileForm {
  fullName: string;
  smtpConfigId: string;
  templateIds: string[];
}
