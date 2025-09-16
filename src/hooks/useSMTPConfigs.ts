import { useCallback, useEffect, useState } from 'react';

import { SMTPConfig } from '@/types/smtp';
import { decryptObject, encryptObject } from '@/utils/encryption';

const SMTP_CONFIGS_KEY = 'smtp-configurations';

export const useSMTPConfigs = () => {
  const [configs, setConfigs] = useState<SMTPConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SMTPConfig | null>(null);
  const [defaultConfig, setDefaultConfig] = useState<SMTPConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch default SMTP config from server
  const fetchDefaultConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/default-smtp');
      if (response.ok) {
        const config = await response.json();
        setDefaultConfig(config);
        return config;
      }
    } catch (error) {
      console.error('Failed to fetch default SMTP config:', error);
    }

    // Fallback config if API fails
    const fallbackConfig = {
      id: 'default',
      name: 'Default SMTP',
      host: 'smtp.gmail.com',
      port: 587,
      username: '[Environment Not Available]',
      password: '[Environment Not Available]',
      encryption: 'tls' as const,
      fromAddress: '[Environment Not Available]',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDefaultConfig(fallbackConfig);
    return fallbackConfig;
  }, []);

  // Load configurations from local storage
  const loadConfigs = useCallback(() => {
    try {
      const stored = localStorage.getItem(SMTP_CONFIGS_KEY);
      if (stored) {
        const decrypted = decryptObject<SMTPConfig[]>(stored);
        if (decrypted && Array.isArray(decrypted)) {
          setConfigs(decrypted);
          // Set first config as selected if none selected
          if (!selectedConfig && decrypted.length > 0) {
            setSelectedConfig(decrypted[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load SMTP configurations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConfig]);

  // Save configurations to local storage
  const saveConfigs = useCallback((newConfigs: SMTPConfig[]) => {
    try {
      const encrypted = encryptObject(newConfigs);
      localStorage.setItem(SMTP_CONFIGS_KEY, encrypted);
      setConfigs(newConfigs);
    } catch (error) {
      console.error('Failed to save SMTP configurations:', error);
    }
  }, []);

  // Add new configuration
  const addConfig = useCallback(
    (config: Omit<SMTPConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newConfig: SMTPConfig = {
        ...config,
        id: `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newConfigs = [...configs, newConfig];
      saveConfigs(newConfigs);
      return newConfig;
    },
    [configs, saveConfigs]
  );

  // Update existing configuration
  const updateConfig = useCallback(
    (id: string, updates: Partial<SMTPConfig>) => {
      const newConfigs = configs.map((config) =>
        config.id === id
          ? { ...config, ...updates, updatedAt: new Date().toISOString() }
          : config
      );
      saveConfigs(newConfigs);
    },
    [configs, saveConfigs]
  );

  // Delete configuration
  const deleteConfig = useCallback(
    (id: string) => {
      if (id === 'default') return; // Can't delete default config

      const newConfigs = configs.filter((config) => config.id !== id);
      saveConfigs(newConfigs);

      // If selected config was deleted, select default or first available
      if (selectedConfig?.id === id) {
        const defaultConfig = newConfigs.find((c) => c.isDefault);
        setSelectedConfig(defaultConfig || newConfigs[0] || null);
      }
    },
    [configs, saveConfigs, selectedConfig]
  );

  // Set configuration as default
  const setAsDefault = useCallback(
    (id: string) => {
      const newConfigs = configs.map((config) => ({
        ...config,
        isDefault: config.id === id,
        updatedAt: new Date().toISOString(),
      }));
      saveConfigs(newConfigs);
    },
    [configs, saveConfigs]
  );

  // Get all configurations including default
  const getAllConfigs = useCallback((): SMTPConfig[] => {
    if (!defaultConfig) return configs.filter((c) => !c.isDefault);
    const customConfigs = configs.filter((c) => !c.isDefault);
    return [defaultConfig, ...customConfigs];
  }, [configs, defaultConfig]);

  // Get effective configuration (selected or default)
  const getEffectiveConfig = useCallback((): SMTPConfig | null => {
    if (selectedConfig) {
      return selectedConfig;
    }
    return defaultConfig;
  }, [selectedConfig, defaultConfig]);

  // Test SMTP configuration
  const testConfig = useCallback(
    async (config: SMTPConfig): Promise<boolean> => {
      try {
        const response = await fetch('/api/test-smtp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
        return response.ok;
      } catch (error) {
        console.error('SMTP test failed:', error);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    const initializeConfigs = async () => {
      await fetchDefaultConfig();
      loadConfigs();
    };
    initializeConfigs();
  }, [fetchDefaultConfig, loadConfigs]);

  return {
    configs: getAllConfigs(),
    customConfigs: configs,
    selectedConfig: getEffectiveConfig(),
    loading,
    addConfig,
    updateConfig,
    deleteConfig,
    setSelectedConfig,
    testConfig,
    defaultConfig,
    setAsDefault,
  };
};
