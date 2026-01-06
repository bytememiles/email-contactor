'use client';

import { Box, Typography } from '@mui/material';

import { SMTPTab } from '@/components/email-composer/settings-modal/SMTPTab';

export default function SMTPPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        SMTP Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your SMTP server configurations for sending emails.
      </Typography>
      <SMTPTab />
    </Box>
  );
}
