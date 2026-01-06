'use client';

import { Box, Typography } from '@mui/material';

import { BatchOperationsTab } from '@/components/email-composer/settings-modal/BatchOperationsTab';

export default function BulkEmailPage() {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
      >
        Bulk Email Sending
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Upload CSV files, manage recipients, and schedule bulk email campaigns.
      </Typography>
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        <BatchOperationsTab />
      </Box>
    </Box>
  );
}
