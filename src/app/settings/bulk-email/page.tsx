'use client';

import { Box, Typography } from '@mui/material';

import { BatchOperationsTab } from '@/components/email-composer/settings-modal/BatchOperationsTab';

export default function BulkEmailPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bulk Email Sending
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload CSV files, manage recipients, and schedule bulk email campaigns.
      </Typography>
      <BatchOperationsTab />
    </Box>
  );
}
