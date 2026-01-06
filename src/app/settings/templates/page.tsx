'use client';

import { Box, Typography } from '@mui/material';

import { TemplatesTab } from '@/components/email-composer/settings-modal/TemplatesTab';

export default function TemplatesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Email Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage email templates with placeholders for personalized
        content.
      </Typography>
      <TemplatesTab />
    </Box>
  );
}
