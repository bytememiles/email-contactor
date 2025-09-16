import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

import { SMTPConfig } from '@/types/smtp';

export async function POST(request: NextRequest) {
  try {
    const config: SMTPConfig = await request.json();

    // Create transporter with the provided configuration
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates for testing
      },
    });

    // Test the connection
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: 'SMTP connection successful',
    });
  } catch (error) {
    console.error('SMTP test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'SMTP connection failed',
      },
      { status: 400 }
    );
  }
}
