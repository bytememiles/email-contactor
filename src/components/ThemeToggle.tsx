'use client';

import React, { useLayoutEffect, useState } from 'react';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after client-side hydration to prevent mismatch
  // Use useLayoutEffect to set mounted state before paint

  useLayoutEffect(() => {
    setMounted(true);
  }, []); // Empty deps - only run once on mount

  // Render a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <IconButton
        color="inherit"
        aria-label="toggle theme"
        disabled
        sx={{ opacity: 0 }}
      >
        <Brightness4 />
      </IconButton>
    );
  }

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        onClick={toggleMode}
        color="inherit"
        aria-label="toggle theme"
      >
        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};
