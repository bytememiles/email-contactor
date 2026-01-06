'use client';

import React from 'react';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();

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
