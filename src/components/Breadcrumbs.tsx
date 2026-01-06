'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, NavigateNext } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs as MUIBreadcrumbs,
  Link as MUILink,
  Typography,
} from '@mui/material';

interface BreadcrumbItem {
  label: string;
  path: string;
}

// Map paths to labels
const pathLabels: Record<string, string> = {
  '/': 'Home',
  '/settings': 'Settings',
  '/settings/smtp': 'SMTP Configuration',
  '/settings/templates': 'Templates',
  '/settings/bulk-email': 'Bulk Email',
  '/settings/profiles': 'Profiles',
  '/settings/jobs': 'Jobs',
  '/settings/jobs/history': 'Job History',
};

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  // Build breadcrumb items from pathname
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const segments = pathname.split('/').filter(Boolean);

    // Always start with Home
    items.push({ label: 'Home', path: '/' });

    // Build path segments
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label =
        pathLabels[currentPath] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      items.push({ label, path: currentPath });
    });

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();
  const isLast = (index: number) => index === breadcrumbs.length - 1;

  // Don't show breadcrumbs on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MUIBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((item, index) => {
          if (isLast(index)) {
            return (
              <Typography
                key={item.path}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {index === 0 && <Home fontSize="small" />}
                {item.label}
              </Typography>
            );
          }

          return (
            <MUILink
              key={item.path}
              component={Link}
              href={item.path}
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {index === 0 && <Home fontSize="small" />}
              {item.label}
            </MUILink>
          );
        })}
      </MUIBreadcrumbs>
    </Box>
  );
};
