import type { Metadata } from 'next';

import { ReduxProvider } from '@/components/ReduxProvider';

import './globals.css';

// Use system fonts to avoid Google Fonts loading issues with Turbopack
// This provides a more reliable fallback while maintaining good typography

export const metadata: Metadata = {
  title: 'Email Composer - Professional Email Management Tool',
  description:
    'A comprehensive email composition and management platform with SMTP configuration, batch operations, template management, and advanced recipient handling.',
  keywords:
    'email, composer, SMTP, batch operations, templates, email marketing, recipient management',
  openGraph: {
    title: 'Email Composer',
    description: 'Professional email composition and management tool',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Email Composer',
    description: 'Professional email composition and management tool',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
