import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SMTPConfig } from '@/types/smtp';
import { decryptObject, encryptObject } from '@/utils/encryption';

const SMTP_CONFIGS_KEY = 'smtp-configurations';

interface SMTPState {
  configs: SMTPConfig[];
  selectedConfig: SMTPConfig | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: SMTPState = {
  configs: [],
  selectedConfig: null,
  loading: false,
  error: null,
  initialized: false,
};

// Helper functions for localStorage
const saveConfigsToStorage = (configs: SMTPConfig[]) => {
  try {
    const encrypted = encryptObject(configs);
    localStorage.setItem(SMTP_CONFIGS_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save SMTP configs:', error);
  }
};

const loadConfigsFromStorage = (): SMTPConfig[] => {
  try {
    const encrypted = localStorage.getItem(SMTP_CONFIGS_KEY);
    if (!encrypted) return [];

    const decrypted = decryptObject(encrypted);
    return Array.isArray(decrypted) ? decrypted : [];
  } catch (error) {
    console.error('Failed to load SMTP configs:', error);
    return [];
  }
};

// Async thunks
export const initializeSMTPConfigs = createAsyncThunk(
  'smtp/initialize',
  async () => {
    const configs = loadConfigsFromStorage();
    return configs;
  }
);

export const testSMTPConfig = createAsyncThunk(
  'smtp/testConfig',
  async (
    config: SMTPConfig
  ): Promise<{ configId: string; success: boolean }> => {
    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      return { configId: config.id, success: response.ok };
    } catch (error) {
      console.error('SMTP test failed:', error);
      return { configId: config.id, success: false };
    }
  }
);

// Slice
const smtpSlice = createSlice({
  name: 'smtp',
  initialState,
  reducers: {
    addConfig: (
      state,
      action: PayloadAction<Omit<SMTPConfig, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
      const newConfig: SMTPConfig = {
        ...action.payload,
        id: `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isDefault: state.configs.length === 0, // First config becomes default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.configs.push(newConfig);

      // If this is the first config, select it as well
      if (state.configs.length === 1) {
        state.selectedConfig = newConfig;
      }

      saveConfigsToStorage(state.configs);
    },

    updateConfig: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<SMTPConfig> }>
    ) => {
      const { id, updates } = action.payload;
      const configIndex = state.configs.findIndex((config) => config.id === id);

      if (configIndex !== -1) {
        state.configs[configIndex] = {
          ...state.configs[configIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Update selected config if it was the one being updated
        if (state.selectedConfig?.id === id) {
          state.selectedConfig = state.configs[configIndex];
        }

        saveConfigsToStorage(state.configs);
      }
    },

    deleteConfig: (state, action: PayloadAction<string>) => {
      const configId = action.payload;
      const configToDelete = state.configs.find(
        (config) => config.id === configId
      );

      if (!configToDelete) return;

      // Remove the config
      state.configs = state.configs.filter((config) => config.id !== configId);

      // If deleted config was default, set the first remaining config as default
      if (configToDelete.isDefault && state.configs.length > 0) {
        state.configs[0].isDefault = true;
        state.configs[0].updatedAt = new Date().toISOString();
      }

      // If deleted config was selected, select the default or first available
      if (state.selectedConfig?.id === configId) {
        const defaultConfig = state.configs.find((c) => c.isDefault);
        state.selectedConfig = defaultConfig || state.configs[0] || null;
      }

      saveConfigsToStorage(state.configs);
    },

    setAsDefault: (state, action: PayloadAction<string>) => {
      const configId = action.payload;

      // Remove default from all configs and set it for the specified one
      state.configs = state.configs.map((config) => ({
        ...config,
        isDefault: config.id === configId,
        updatedAt:
          config.id === configId ? new Date().toISOString() : config.updatedAt,
      }));

      saveConfigsToStorage(state.configs);
    },

    setSelectedConfig: (state, action: PayloadAction<SMTPConfig | null>) => {
      state.selectedConfig = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(initializeSMTPConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSMTPConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.configs = action.payload;
        state.initialized = true;

        // Set selected config to default or first available
        const defaultConfig = action.payload.find((c) => c.isDefault);
        state.selectedConfig = defaultConfig || action.payload[0] || null;
      })
      .addCase(initializeSMTPConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to initialize SMTP configs';
        state.initialized = true;
      })
      .addCase(testSMTPConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(testSMTPConfig.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(testSMTPConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'SMTP test failed';
      });
  },
});

export const {
  addConfig,
  updateConfig,
  deleteConfig,
  setAsDefault,
  setSelectedConfig,
  clearError,
} = smtpSlice.actions;

export default smtpSlice.reducer;
