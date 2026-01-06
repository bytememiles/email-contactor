'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    severity?: AlertColor,
    duration?: number
  ) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (
      message: string,
      severity: AlertColor = 'info',
      duration: number = 6000
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [
        ...prev,
        { id, message, severity, duration },
      ]);
    },
    []
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration);
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration);
    },
    [showNotification]
  );

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showError,
        showWarning,
        showSuccess,
        showInfo,
      }}
    >
      {children}
      {/* Render notifications in a stack */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.duration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            position: 'fixed',
            bottom: 16 + index * 70,
            right: 16,
            zIndex: 9999 - index,
            maxWidth: '400px',
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
