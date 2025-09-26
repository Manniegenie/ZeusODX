import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/notificationService';

export const useNotifications = () => {
  const [state, setState] = useState({
    isInitialized: false,
    isPermissionGranted: false,
    pushToken: null,
    isLoading: false,
    error: null,
  });

  // Initialize notifications
  const initialize = useCallback(async () => {
    console.log('🔔 Hook: Initializing notifications');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await NotificationService.initialize();
      
      if (success) {
        const permissions = await Notifications.getPermissionsAsync();
        const token = NotificationService.pushToken;
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isPermissionGranted: permissions.status === 'granted',
          pushToken: token,
          isLoading: false,
        }));
        
        console.log('✅ Hook: Notifications initialized successfully');
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isInitialized: false,
          isLoading: false,
          error: 'Failed to initialize notifications',
        }));
        console.log('❌ Hook: Failed to initialize notifications');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Hook: Error initializing notifications:', errorMessage);
      return false;
    }
  }, []);

  // Turn off notifications
  const turnOffNotifications = useCallback(async () => {
    console.log('🔕 Hook: Turning off notifications');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Remove all listeners
      NotificationService.removeListeners();
      
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear badge
      await NotificationService.clearBadge();
      
      // Optionally, you might want to unregister from backend
      // This depends on your backend implementation
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      console.log('✅ Hook: Notifications turned off');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Hook: Error turning off notifications:', errorMessage);
      return false;
    }
  }, []);

  // Turn on notifications
  const turnOnNotifications = useCallback(async () => {
    console.log('🔔 Hook: Turning on notifications');
    return await initialize();
  }, [initialize]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    console.log('🔍 Hook: Requesting permissions');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { 
          allowAlert: true, 
          allowSound: true, 
          allowBadge: true 
        },
      });
      
      const granted = status === 'granted';
      setState(prev => ({
        ...prev,
        isPermissionGranted: granted,
        isLoading: false,
      }));
      
      console.log('ℹ️ Hook: Permission status:', status);
      return granted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Hook: Error requesting permissions:', errorMessage);
      return false;
    }
  }, []);

  // Check current permissions
  const checkPermissions = useCallback(async () => {
    console.log('🔍 Hook: Checking permissions');
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setState(prev => ({
        ...prev,
        isPermissionGranted: status === 'granted',
      }));
      return status;
    } catch (error) {
      console.error('❌ Hook: Error checking permissions:', error);
      return 'undetermined';
    }
  }, []);

  // Open notification settings (iOS)
  const openNotificationSettings = useCallback(() => {
    console.log('⚙️ Hook: Opening notification settings');
    if (Notifications.openNotificationSettingsAsync) {
      Notifications.openNotificationSettingsAsync();
    }
  }, []);

  // Clear badge
  const clearBadge = useCallback(async () => {
    console.log('🧹 Hook: Clearing badge');
    try {
      await NotificationService.clearBadge();
    } catch (error) {
      console.error('❌ Hook: Error clearing badge:', error);
    }
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count) => {
    console.log('🔢 Hook: Setting badge count to:', count);
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Hook: Error setting badge count:', error);
    }
  }, []);

  // Setup listeners
  const setupListeners = useCallback((onReceived, onTapped) => {
    console.log('🔧 Hook: Setting up listeners');
    NotificationService.setupListeners(onReceived, onTapped);
  }, []);

  // Remove listeners
  const removeListeners = useCallback(() => {
    console.log('🧹 Hook: Removing listeners');
    NotificationService.removeListeners();
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    console.log('🔄 Hook: Refreshing token');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = await NotificationService.registerForPushNotifications();
      setState(prev => ({
        ...prev,
        pushToken: token,
        isLoading: false,
      }));
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Hook: Error refreshing token:', errorMessage);
      return null;
    }
  }, []);

  // Get stored token
  const getStoredToken = useCallback(async () => {
    console.log('📱 Hook: Getting stored token');
    try {
      return await NotificationService.loadPushToken();
    } catch (error) {
      console.error('❌ Hook: Error getting stored token:', error);
      return null;
    }
  }, []);

  // Load initial state on mount
  useEffect(() => {
    console.log('🚀 Hook: Initial setup');
    
    const loadInitialState = async () => {
      try {
        const permissions = await Notifications.getPermissionsAsync();
        const storedToken = await NotificationService.loadPushToken();
        
        setState(prev => ({
          ...prev,
          isPermissionGranted: permissions.status === 'granted',
          pushToken: storedToken,
        }));
      } catch (error) {
        console.error('❌ Hook: Error loading initial state:', error);
      }
    };

    loadInitialState();
  }, []);

  return {
    // State
    ...state,
    
    // Core functions
    initialize,
    turnOffNotifications,
    turnOnNotifications,
    
    // Permission management
    requestPermissions,
    checkPermissions,
    openNotificationSettings,
    
    // Badge management
    clearBadge,
    setBadgeCount,
    
    // Listeners
    setupListeners,
    removeListeners,
    
    // Token management
    refreshToken,
    getStoredToken,
  };
};