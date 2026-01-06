import { NextRequest, NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, priority, attachments, smtpConfig } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and content' },
        { status: 400 }
      );
    }

    // Check if SMTP configuration is provided from frontend
    if (!smtpConfig) {
      return NextResponse.json(
        {
          error:
            'No SMTP configuration provided. Please configure SMTP settings in the application.',
        },
        { status: 400 }
      );
    }

    const success = await sendEmail({
      to,
      subject,
      html,
      text,
      priority,
      attachments,
      smtpConfig,
    });

    if (success) {
      return NextResponse.json({ message: 'Email sent successfully' });
    } else {
      return NextResponse.json(
        {
          error:
            'Failed to send email. Please check your SMTP configuration and try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Email sending failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
