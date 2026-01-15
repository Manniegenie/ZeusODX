/**
 * useNotifications Hook
 * Provides notification functionality to components
 */
import { useCallback, useEffect, useState } from 'react';
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

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationService.requestPermission();

      if (result.success) {
        // Permission granted, register token with backend (like dashboard does)
        console.log('✅ [PROFILE] Notification permission granted, registering token...');

        try {
          const registerResult = await NotificationService.initializePushNotifications();

          if (registerResult.success) {
            console.log('✅ [PROFILE] Notification token registered with backend');
          } else {
            console.warn('⚠️ [PROFILE] Token registration failed:', registerResult.error);
          }
        } catch (tokenError) {
          console.error('❌ [PROFILE] Token registration error:', tokenError.message);
        }

        // Re-check status after registering
        const enabled = await NotificationService.isEnabled();
        setIsEnabled(enabled);
      } else {
        // Even if request failed, check actual status (user might have enabled in settings)
        const enabled = await NotificationService.isEnabled();
        setIsEnabled(enabled);
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
