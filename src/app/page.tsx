'use client';

import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import EmailComposer from '@/components/EmailComposer';

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

export default function Home() {
  const [showComposer, setShowComposer] = useState(false);

  const handleCompose = () => {
    setShowComposer(true);
  };

  const handleCloseComposer = () => {
    setShowComposer(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Email Composer
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome to Email Composer
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              A modern email composer with markdown support, inspired by
              Gmail&apos;s interface.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Features:
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Markdown Editor"
                  secondary="Write emails using markdown with live preview"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="SMTP Integration"
                  secondary="Send emails through Gmail SMTP service"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Send Delay & Cancellation"
                  secondary="3-second delay with option to cancel email sending"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary="Gmail-like Interface"
                  secondary="Familiar interface inspired by Gmail's composer"
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Click the compose button in the bottom right to start writing an
                email.
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Setup Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              To use this email composer, you need to set up your environment
              variables. Copy the <code>env.example</code> file to{' '}
              <code>.env.local</code> and update it with your Gmail credentials.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Make sure to use an App Password instead of your regular Gmail
              password for security.
            </Typography>
          </Paper>
        </Container>

        {/* Floating Compose Button */}
        <Fab
          color="primary"
          aria-label="compose"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
          }}
          onClick={handleCompose}
        >
          <Edit />
        </Fab>

        {/* Email Composer */}
        {showComposer && <EmailComposer onClose={handleCloseComposer} />}
      </Box>
    </ThemeProvider>
  );
}
