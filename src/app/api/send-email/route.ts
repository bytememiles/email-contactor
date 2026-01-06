import { NextRequest, NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] /api/send-email - Request received');

  try {
    const body = await request.json();
    const { to, subject, html, text, priority, attachments, smtpConfig } = body;

    console.log('[API] Email request details:', {
      to,
      subject,
      hasHtml: !!html,
      hasText: !!text,
      hasAttachments: !!attachments && attachments.length > 0,
      hasSmtpConfig: !!smtpConfig,
      smtpHost: smtpConfig?.host,
    });

    if (!to || !subject || (!html && !text)) {
      console.error('[API] Missing required fields:', {
        to: !!to,
        subject: !!subject,
        html: !!html,
        text: !!text,
      });
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and content' },
        { status: 400 }
      );
    }

    // Check if SMTP configuration is provided from frontend
    if (!smtpConfig) {
      console.error('[API] No SMTP configuration provided');
      return NextResponse.json(
        {
          error:
            'No SMTP configuration provided. Please configure SMTP settings in the application.',
        },
        { status: 400 }
      );
    }

    console.log('[API] Attempting to send email...');
    const success = await sendEmail({
      to,
      subject,
      html,
      text,
      priority,
      attachments,
      smtpConfig,
    });

    const duration = Date.now() - startTime;
    if (success) {
      console.log(`[API] Email sent successfully in ${duration}ms`);
      return NextResponse.json({ message: 'Email sent successfully' });
    } else {
      console.error(`[API] Email sending failed after ${duration}ms`);
      return NextResponse.json(
        {
          error:
            'Failed to send email. Please check your SMTP configuration and try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Email API error after ${duration}ms:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Email sending failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
