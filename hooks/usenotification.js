/**
 * useNotifications Hook
 * Provides notification functionality to components
 */
import { useCallback, useState } from 'react';
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

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationService.requestPermission();
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

  return {
    isEnabled,
    isLoading,
    requestPermission,
    openSettings,
    clearBadge,
    setupListeners,
    removeListeners,
    checkStatus,
  };
};
