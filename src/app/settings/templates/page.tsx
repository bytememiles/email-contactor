'use client';

import { Box, Typography } from '@mui/material';

import { TemplatesTab } from '@/components/email-composer/settings-modal/TemplatesTab';

export default function TemplatesPage() {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
      >
        Email Templates
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Create and manage email templates with placeholders for personalized
        content.
      </Typography>
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        <TemplatesTab />
      </Box>
    </Box>
  );
}
