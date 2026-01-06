'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BatchPrediction,
  Description,
  Folder,
  Settings,
  Work,
} from '@mui/icons-material';
import {
  Box,
  createTheme,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const menuItems = [
  {
    label: 'SMTP Configuration',
    icon: <Settings />,
    path: '/settings/smtp',
  },
  {
    label: 'Templates',
    icon: <Description />,
    path: '/settings/templates',
  },
  {
    label: 'Bulk Email',
    icon: <BatchPrediction />,
    path: '/settings/bulk-email',
  },
  {
    label: 'Profiles',
    icon: <Folder />,
    path: '/settings/profiles',
  },
  {
    label: 'Jobs',
    icon: <Work />,
    path: '/settings/jobs',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Settings
            </Typography>
          </Toolbar>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
