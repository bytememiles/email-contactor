'use client';

import { Box, Typography } from '@mui/material';

import { SMTPTab } from '@/components/email-composer/settings-modal/SMTPTab';

export default function SMTPPage() {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
      >
        SMTP Configuration
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Manage your SMTP server configurations for sending emails.
      </Typography>
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        <SMTPTab />
      </Box>
    </Box>
  );
}
