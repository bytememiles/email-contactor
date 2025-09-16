import React, { useState } from 'react';
import {
  Add,
  CheckCircle,
  Close,
  Delete,
  Edit,
  Error,
  PlayArrow,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Radio,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { useSMTPConfigsRedux } from '@/hooks/useSMTPConfigsRedux';
import { SettingsModalProps, SMTPConfig, SMTPConfigForm } from '@/types/smtp';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
}) => {
  const {
    configs,
    hasConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    setAsDefault,
  } = useSMTPConfigsRedux();

  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: boolean | null;
  }>({});

  const [formData, setFormData] = useState<SMTPConfigForm>({
    name: '',
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'tls',
    fromAddress: '',
  });

  const [errors, setErrors] = useState<Partial<SMTPConfigForm>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '587',
      username: '',
      password: '',
      encryption: 'tls',
      fromAddress: '',
    });
    setErrors({});
    setEditingConfig(null);
    setShowForm(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SMTPConfigForm> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.host.trim()) newErrors.host = 'Host is required';
    if (!formData.port.trim() || isNaN(Number(formData.port))) {
      newErrors.port = 'Valid port number is required';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.fromAddress.trim())
      newErrors.fromAddress = 'From address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const configData = {
      name: formData.name,
      host: formData.host,
      port: Number(formData.port),
      username: formData.username,
      password: formData.password,
      encryption: formData.encryption,
      fromAddress: formData.fromAddress,
    };

    if (editingConfig) {
      updateConfig(editingConfig.id, configData);
    } else {
      addConfig(configData);
    }

    resetForm();
  };

  const handleEdit = (config: SMTPConfig) => {
    setFormData({
      name: config.name,
      host: config.host,
      port: config.port.toString(),
      username: config.username,
      password: config.password,
      encryption: config.encryption,
      fromAddress: config.fromAddress,
    });
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleTest = async (config: SMTPConfig) => {
    setTesting(config.id);
    const result = await testConfig(config);
    setTestResults((prev) => ({ ...prev, [config.id]: result }));
    setTesting(null);
  };

  const handleSetAsDefault = (configId: string) => {
    setAsDefault(configId);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '600px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        SMTP Settings
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* No Configurations Alert */}
        {!hasConfigs && !showForm && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>No SMTP Configurations Found</strong>
            </Typography>
            <Typography variant="body2">
              You need to configure at least one SMTP server to send emails.
              Click &quot;Add Configuration&quot; to get started.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h6">SMTP Configurations</Typography>
            {!showForm && (
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => setShowForm(true)}
                size="small"
              >
                Add Configuration
              </Button>
            )}
          </Box>

          {showForm && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <TextField
                  label="Configuration Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="SMTP Host"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, host: e.target.value }))
                  }
                  error={!!errors.host}
                  helperText={errors.host}
                  fullWidth
                  size="small"
                  placeholder="smtp.gmail.com"
                />

                <TextField
                  label="Port"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, port: e.target.value }))
                  }
                  error={!!errors.port}
                  helperText={errors.port}
                  fullWidth
                  size="small"
                  type="number"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Encryption</InputLabel>
                  <Select
                    value={formData.encryption}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        encryption: e.target.value as 'tls' | 'ssl' | 'none',
                      }))
                    }
                    label="Encryption"
                  >
                    <MenuItem value="tls">TLS</MenuItem>
                    <MenuItem value="ssl">SSL</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  error={!!errors.username}
                  helperText={errors.username}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  error={!!errors.password}
                  helperText={errors.password}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="From Address"
                  value={formData.fromAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fromAddress: e.target.value,
                    }))
                  }
                  error={!!errors.fromAddress}
                  helperText={errors.fromAddress}
                  fullWidth
                  size="small"
                  placeholder="your-email@example.com"
                  sx={{ gridColumn: { sm: '1 / -1' } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="contained" onClick={handleSave}>
                  {editingConfig ? 'Update' : 'Add'} Configuration
                </Button>
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Select Default SMTP Configuration
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The default configuration will be used when clicking the Send
              button directly.
            </Typography>
          </Box>

          <List>
            {configs.map((config, index) => (
              <React.Fragment key={config.id}>
                <ListItem>
                  <Radio
                    checked={config.isDefault}
                    onChange={() => handleSetAsDefault(config.id)}
                    value={config.id}
                    name="default-smtp"
                    sx={{ mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="subtitle1">
                          {config.name}
                        </Typography>
                        {config.isDefault && (
                          <Chip
                            label="Default"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {testResults[config.id] === true && (
                          <CheckCircle color="success" fontSize="small" />
                        )}
                        {testResults[config.id] === false && (
                          <Error color="error" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {config.host}:{config.port} (
                        {config.encryption.toUpperCase()}) •{' '}
                        {config.fromAddress}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleTest(config)}
                        disabled={testing === config.id}
                        title="Test Connection"
                      >
                        {testing === config.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PlayArrow fontSize="small" />
                        )}
                      </IconButton>

                      {!config.isDefault && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(config)}
                            title="Edit"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteConfig(config.id)}
                            title="Delete"
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < configs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {hasConfigs && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                All SMTP configurations are stored securely in your
                browser&apos;s local storage. You can add multiple
                configurations and set any one as the default for quick sending.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
