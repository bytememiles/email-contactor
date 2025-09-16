import React from 'react';
import { BatchPrediction } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

export const BatchOperationsTab: React.FC = () => {
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <BatchPrediction sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Batch Operations
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Batch operation features will be implemented here. This will allow you
        to manage multiple email operations efficiently.
      </Typography>
    </Box>
  );
};
