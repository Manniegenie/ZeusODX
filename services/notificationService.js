/**
 * Notification Service
 * Handles all Expo notification functionality including permissions, tokens, and listeners
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Request notification permissions (works on all platforms, Android auto-grants)
   */
  async requestPermission() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return {
        success: status === 'granted',
        status
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Open notification settings
   */
  async openSettings() {
    try {
      await Notifications.openSettingsAsync();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Clear notification badge
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Get Expo push token - ALWAYS generates token regardless of permission
   * Permission is only needed for displaying notifications, not for generating tokens
   */
  async getExpoPushToken() {
    try {
      // Simulators don't support push tokens
      if (!Device.isDevice) {
        console.log('⚠️ Not a physical device, skipping token generation');
        return null;
      }

      // Get project ID from config
      const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('❌ EAS projectId not found in app config');
        return null;
      }

      // Generate token regardless of permission status
      // On Android, this will work without permission
      // Permission is only needed for displaying notifications to user
      console.log('📱 Generating Expo push token (permission not required for token generation)...');
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      
      if (!token || !token.data) {
        console.error('❌ Failed to get Expo push token');
        return null;
      }

      console.log('✅ Expo push token generated:', token.data.substring(0, 30) + '...');
      return token.data;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error.message);
      return null;
    }
  }

  /**
   * Get device ID - stores and reuses consistent device ID
   */
  async getDeviceId() {
    try {
      const STORAGE_KEY = 'zeusodx_device_id';
      
      // Try to get stored device ID first
      try {
        const storedDeviceId = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedDeviceId) {
          console.log('✅ Using stored device ID:', storedDeviceId);
          return storedDeviceId;
        }
      } catch (err) {
        // Silent fail, continue to generate new one
      }

      // Generate new device ID
      let deviceId;
      if (Device.isDevice) {
        const osId = Device.osInternalBuildId || Device.modelId || Device.deviceName || Device.brand;
        if (osId) {
          deviceId = `${Platform.OS}-${osId}`;
        } else {
          // Fallback: Use a more stable identifier
          deviceId = `${Platform.OS}-${Device.modelName || Device.deviceType || 'unknown'}-${Device.brand || 'device'}`;
        }
      } else {
        deviceId = `${Platform.OS}-simulator`;
      }

      // Store device ID for future use
      try {
        await AsyncStorage.setItem(STORAGE_KEY, deviceId);
        console.log('💾 Stored new device ID:', deviceId);
      } catch (err) {
        console.warn('⚠️ Failed to store device ID:', err.message);
      }

      return deviceId;
    } catch (error) {
      // Last resort fallback
      const fallbackId = `${Platform.OS}-${Date.now()}`;
      console.error('❌ Error generating device ID, using fallback:', fallbackId);
      return fallbackId;
    }
  }

  /**
   * Check if device has a token in the database (uses deviceId, no auth required)
   */
  async checkTokenExists() {
    try {
      const deviceId = await this.getDeviceId();
      if (!deviceId) {
        return {
          success: false,
          hasToken: false,
          error: 'Could not get device ID'
        };
      }

      // Call endpoint with deviceId (no auth required)
      const params = new URLSearchParams({ deviceId });
      const response = await apiClient.get(`/notification/check-token?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          hasToken: response.data.hasToken || false
        };
      } else {
        return {
          success: false,
          hasToken: false,
          error: response.error || 'Failed to check token'
        };
      }
    } catch (error) {
      console.error('Error checking token existence:', error.message);
      return {
        success: false,
        hasToken: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize push notifications - ALWAYS generates and registers token
   * Checks DB first, generates if missing, registers with deviceId
   */
  async initializePushNotifications() {
    try {
      // Step 1: Check if device already has a token in DB
      console.log('🔍 Checking if device has push token in database...');
      const checkResult = await this.checkTokenExists();

      // If device already has a token, skip
      if (checkResult.success && checkResult.hasToken) {
        console.log('✅ Device already has a push token registered');
        return {
          success: true,
          skipped: true,
          message: 'Device already has a push token registered'
        };
      }

      // Step 2: Generate token (ALWAYS - no permission check)
      console.log('📱 No token found, generating Expo push token...');
      const expoPushToken = await this.getExpoPushToken();
      
      if (!expoPushToken) {
        console.error('❌ CRITICAL: Could not generate Expo push token');
        return {
          success: false,
          error: 'Could not generate Expo push token'
        };
      }

      // Step 3: Register token with backend using deviceId
      console.log('📤 Registering push token with backend...');
      const deviceId = await this.getDeviceId();
      
      if (!deviceId) {
        return {
          success: false,
          error: 'Could not get device ID'
        };
      }

      // Try to get userId if available (optional)
      let userId = null;
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      } catch (err) {
        // Silent fail - userId is optional
      }

      const payload = {
        expoPushToken,
        deviceId,
        platform: Platform.OS,
        ...(userId && { userId })
      };

      console.log('📤 Registering token:', { deviceId, platform: Platform.OS, hasUserId: !!userId });
      const response = await apiClient.post('/notification/register-token', payload);

      if (response.success) {
        console.log('✅ Push token registered successfully in database');
        return {
          success: true,
          data: response
        };
      } else {
        console.error('❌ Failed to register push token:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to register push token'
        };
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error.message);
      return {
        success: false,
        error: error.message || 'Unknown error initializing push notifications'
      };
    }
  }

  /**
   * Register push token with backend (only if token changed or missing)
   * @deprecated Use initializePushNotifications instead
   */
  async registerPushToken() {
    try {
      const expoPushToken = await this.getExpoPushToken();
      if (!expoPushToken) {
        return {
          success: false,
          error: 'Could not get Expo push token'
        };
      }

      // Check if token has changed
      try {
        const lastRegisteredToken = await AsyncStorage.getItem('last_registered_push_token');
        if (lastRegisteredToken === expoPushToken) {
          // Token unchanged, skip registration
          return {
            success: true,
            skipped: true,
            message: 'Token already registered'
          };
        }
      } catch (err) {
        // If check fails, proceed with registration
      }

      // Try to get userId from stored user data
      let userId = null;
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      } catch (err) {
        // Silent fail
      }

      const deviceId = await this.getDeviceId();
      if (!deviceId) {
        return {
          success: false,
          error: 'Could not get device ID'
        };
      }

      const payload = {
        expoPushToken,
        deviceId,
        platform: Platform.OS,
        ...(userId && { userId })
      };

      const response = await apiClient.post('/notification/register-token', payload);

      if (response.success) {
        // Store registered token
        try {
          await AsyncStorage.setItem('last_registered_push_token', expoPushToken);
        } catch (err) {
          // Silent fail - not critical
        }
        return {
          success: true,
          data: response
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to register push token'
        };
      }
    } catch (error) {
      console.error('Error registering push token:', error.message);
      return {
        success: false,
        error: error.message || 'Unknown error registering push token'
      };
    }
  }

  /**
   * Setup notification listeners
   * @param {Function} onReceived - Callback when notification is received
   * @param {Function} onTapped - Callback when notification is tapped
   */
  setupListeners(onReceived, onTapped) {
    // Remove existing listeners first
    this.removeListeners();

    // Handle notifications received while app is running
    if (onReceived) {
      this.notificationListener = Notifications.addNotificationReceivedListener(onReceived);
    }

    // Handle notification taps
    if (onTapped) {
      this.responseListener = Notifications.addNotificationResponseReceivedListener(onTapped);
    }
  }

  /**
   * Remove notification listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Reset service (useful for logout)
   */
  async reset() {
    this.removeListeners();
    // Clear stored token on logout
    try {
      await AsyncStorage.removeItem('last_registered_push_token');
    } catch (err) {
      // Silent fail
    }
  }
}

// Export singleton instance
export default new NotificationService();

