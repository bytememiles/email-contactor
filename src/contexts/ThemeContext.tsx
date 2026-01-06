'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  createTheme,
  CssBaseline,
  PaletteMode,
  ThemeProvider as MUIThemeProvider,
} from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = 'theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Always start with 'light' to match SSR, then update after mount
  const [mode, setModeState] = useState<PaletteMode>('light');

  // Load theme from localStorage after mount to prevent hydration mismatch
  // Use useLayoutEffect to set theme before browser paint to reduce flash

  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setModeState(stored);
        return;
      }
      // Check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setModeState(prefersDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []); // Empty deps - only run once on mount

  // Sync with system preference changes (optional)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setModeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save theme to localStorage
  const setMode = useCallback((newMode: PaletteMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  // Create MUI theme based on mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          ...(mode === 'dark' && {
            background: {
              default: '#1a1a1a', // Lighter dark background (default is #121212)
              paper: '#2a2a2a', // Lighter paper background (default is #1e1e1e)
            },
            text: {
              primary: 'rgba(255, 255, 255, 0.95)', // Slightly brighter text
              secondary: 'rgba(255, 255, 255, 0.7)',
            },
          }),
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
