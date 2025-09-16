import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addConfig,
  clearError,
  deleteConfig,
  initializeSMTPConfigs,
  setAsDefault,
  setSelectedConfig,
  testSMTPConfig,
  updateConfig,
} from '@/store/slices/smtpSlice';
import { SMTPConfig } from '@/types/smtp';

export const useSMTPConfigsRedux = () => {
  const dispatch = useAppDispatch();
  const { configs, selectedConfig, loading, error, initialized } =
    useAppSelector((state) => state.smtp);

  // Initialize configs on first mount
  useEffect(() => {
    if (!initialized) {
      dispatch(initializeSMTPConfigs());
    }
  }, [dispatch, initialized]);

  // Helper to get default config
  const getDefaultConfig = useCallback(() => {
    return configs.find((config) => config.isDefault) || null;
  }, [configs]);

  // Helper to get effective config (selected or default)
  const getEffectiveConfig = useCallback(() => {
    return selectedConfig || getDefaultConfig();
  }, [selectedConfig, getDefaultConfig]);

  // Test SMTP configuration
  const testConfig = useCallback(
    async (config: SMTPConfig): Promise<boolean> => {
      const result = await dispatch(testSMTPConfig(config));
      return testSMTPConfig.fulfilled.match(result)
        ? result.payload.success
        : false;
    },
    [dispatch]
  );

  // Wrapper functions for actions
  const handleAddConfig = useCallback(
    (config: Omit<SMTPConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const action = dispatch(addConfig(config));
      return action;
    },
    [dispatch]
  );

  const handleUpdateConfig = useCallback(
    (id: string, updates: Partial<SMTPConfig>) => {
      dispatch(updateConfig({ id, updates }));
    },
    [dispatch]
  );

  const handleDeleteConfig = useCallback(
    (id: string) => {
      dispatch(deleteConfig(id));
    },
    [dispatch]
  );

  const handleSetAsDefault = useCallback(
    (id: string) => {
      dispatch(setAsDefault(id));
    },
    [dispatch]
  );

  const handleSetSelectedConfig = useCallback(
    (config: SMTPConfig | null) => {
      dispatch(setSelectedConfig(config));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    configs,
    selectedConfig: getEffectiveConfig(),
    defaultConfig: getDefaultConfig(),
    loading,
    error,
    initialized,
    hasConfigs: configs.length > 0,

    // Actions
    addConfig: handleAddConfig,
    updateConfig: handleUpdateConfig,
    deleteConfig: handleDeleteConfig,
    setAsDefault: handleSetAsDefault,
    setSelectedConfig: handleSetSelectedConfig,
    testConfig,
    clearError: handleClearError,
  };
};
