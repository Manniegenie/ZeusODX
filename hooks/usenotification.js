import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import NotificationService from '../services/notificationService';

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check notification status
  const checkStatus = useCallback(async () => {
    const enabled = await NotificationService.isEnabled();
    setIsEnabled(enabled);
    return enabled;
  }, []);

  // Enable notifications
  const enable = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationService.enable();
      if (result.success) {
        setIsEnabled(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-enable notifications (for Android)
  const autoEnable = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationService.autoEnable();
      if (result.success) {
        setIsEnabled(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open settings
  const openSettings = useCallback(async () => {
    await NotificationService.openSettings();
  }, []);

  // Clear badge
  const clearBadge = useCallback(async () => {
    await NotificationService.clearBadge();
  }, []);

  // Setup listeners
  const setupListeners = useCallback((onReceived, onTapped) => {
    NotificationService.setupListeners(onReceived, onTapped);
  }, []);

  // Remove listeners
  const removeListeners = useCallback(() => {
    NotificationService.removeListeners();
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  return {
    isEnabled,
    isLoading,
    enable,
    autoEnable,
    openSettings,
    clearBadge,
    setupListeners,
    removeListeners,
    checkStatus,
  };
};