import React from 'react';
import { Description } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

export const TemplatesTab: React.FC = () => {
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Template Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Template management features will be implemented here. This will allow
        you to create, edit, and manage markdown email templates.
      </Typography>
    </Box>
  );
};
