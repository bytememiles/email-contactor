import nodemailer from 'nodemailer';

import { EmailPriority } from '@/types/email';
import { SMTPConfig } from '@/types/smtp';

// Convert priority to email headers
function getPriorityHeaders(priority: EmailPriority) {
  switch (priority) {
    case 'high':
      return {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        Importance: 'High',
      };
    case 'low':
      return {
        'X-Priority': '5 (Lowest)',
        'X-MSMail-Priority': 'Low',
        Importance: 'Low',
      };
    case 'normal':
    default:
      return {
        'X-Priority': '3 (Normal)',
        'X-MSMail-Priority': 'Normal',
        Importance: 'Normal',
      };
  }
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string;
  cc?: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  priority?: EmailPriority;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
  smtpConfig?: SMTPConfig;
}

export function createEmailTransporter(
  smtpConfig?: SMTPConfig
): nodemailer.Transporter {
  if (smtpConfig) {
    // Use custom SMTP configuration
    const config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.encryption === 'ssl',
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
    return nodemailer.createTransport(config);
  }

  // Use default environment configuration
  const config: EmailConfig = {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
  };

  return nodemailer.createTransport(config);
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const transporter = createEmailTransporter(emailData.smtpConfig);

    const fromAddress =
      emailData.smtpConfig?.fromAddress ||
      emailData.from ||
      process.env.MAIL_FROM_ADDRESS;

    const mailOptions = {
      from: fromAddress,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments,
      headers: emailData.priority
        ? getPriorityHeaders(emailData.priority)
        : undefined,
    };

    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
