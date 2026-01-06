'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

export const PageTransitionLoader: React.FC = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only show loading if pathname actually changed
    if (pathname !== prevPathnameRef.current) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Update ref first
      prevPathnameRef.current = pathname;

      // Defer state update to avoid synchronous setState in effect
      // Use requestAnimationFrame to ensure it happens after render
      requestAnimationFrame(() => {
        setLoading(true);

        // Hide loading after page has had time to render
        // Use a slightly longer delay to ensure smooth transition
        loadingTimeoutRef.current = setTimeout(() => {
          setLoading(false);
        }, 400);
      });

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!loading) return null;

  return (
    <Backdrop
      open={loading}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          Loading page...
        </Typography>
      </Box>
    </Backdrop>
  );
};
