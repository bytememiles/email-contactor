'use client';

import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import EmailComposer from '@/components/EmailComposer';

export default function Home() {
  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          p: 3,
        }}
      >
        <EmailComposer />
      </Box>
    </>
  );
}
