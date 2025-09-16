import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return the actual environment configuration
    const defaultConfig = {
      id: 'default',
      name: 'Default SMTP',
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      username: process.env.MAIL_USERNAME || '',
      password: process.env.MAIL_PASSWORD || '',
      encryption:
        (process.env.MAIL_ENCRYPTION as 'tls' | 'ssl' | 'none') || 'tls',
      fromAddress: process.env.MAIL_FROM_ADDRESS || '',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('Error getting default SMTP config:', error);
    return NextResponse.json(
      { error: 'Failed to get default SMTP configuration' },
      { status: 500 }
    );
  }
}
