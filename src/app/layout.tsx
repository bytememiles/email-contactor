import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ReduxProvider } from '@/components/ReduxProvider';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
