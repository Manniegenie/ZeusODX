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
    this.expoPushToken = null;
    this.isInitialized = false;
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
   * Request notification permissions
   */
  async enable() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return {
        success: status === 'granted',
        status
      };
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-enable notifications (for Android)
   */
  async autoEnable() {
    try {
      if (Platform.OS === 'android') {
        const { status } = await Notifications.requestPermissionsAsync();
        return {
          success: status === 'granted',
          status
        };
      }
      return {
        success: false,
        message: 'Auto-enable only available on Android'
      };
    } catch (error) {
      console.error('Error auto-enabling notifications:', error);
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
   * Get Expo push token
   */
  async getExpoPushToken() {
    try {
      // Return cached token if available
      if (this.expoPushToken) {
        console.log('📱 Using cached Expo Push Token:', this.expoPushToken);
        return this.expoPushToken;
      }

      // For simulators, create a mock token for testing
      if (!Device.isDevice) {
        const mockToken = `ExponentPushToken[simulator-${Date.now()}]`;
        console.log('📱 Using simulator - mock Expo Push Token:', mockToken);
        this.expoPushToken = mockToken;
        return mockToken;
      }

      // Check if we have permission first (especially important for Android)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Notification permission not granted, requesting...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.error('❌ Notification permission denied, cannot get push token');
          return null;
        }
      }

      // Get project ID from config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('❌ EAS projectId not found in app config');
        console.log('📱 Available config:', {
          hasExpoConfig: !!Constants.expoConfig,
          hasExtra: !!Constants.expoConfig?.extra,
          hasEas: !!Constants.expoConfig?.extra?.eas,
        });
        return null;
      }

      console.log('📱 Requesting Expo Push Token with projectId:', projectId);
      console.log('📱 Platform:', Platform.OS);

      // Get real token from Expo
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      if (!token || !token.data) {
        console.error('❌ Invalid token response from Expo:', token);
        return null;
      }

      this.expoPushToken = token.data;
      console.log('✅ Expo Push Token obtained successfully:', token.data);
      console.log('📱 Token length:', token.data.length);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        platform: Platform.OS,
      });
      return null;
    }
  }

  /**
   * Get device ID
   */
  getDeviceId() {
    try {
      if (Device.isDevice) {
        // Try multiple methods to get device ID for better Android compatibility
        const deviceId = Device.osInternalBuildId || Device.modelId || Device.deviceName || Device.brand;
        if (deviceId) {
          return `${Platform.OS}-${deviceId}`;
        }
        // Fallback: use a combination of platform and timestamp for unique ID
        return `${Platform.OS}-device-${Date.now()}`;
      } else {
        // For simulators, create a consistent ID
        return `${Platform.OS}-simulator-test`;
      }
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback device ID
      return `${Platform.OS}-unknown-device-${Date.now()}`;
    }
  }

  /**
   * Register push token with backend
   */
  async registerPushToken() {
    try {
      console.log('📱 Starting push token registration...');
      console.log('📱 Platform:', Platform.OS);
      
      const expoPushToken = await this.getExpoPushToken();
      if (!expoPushToken) {
        console.error('❌ Could not get Expo push token');
        return {
          success: false,
          error: 'Could not get Expo push token'
        };
      }

      const deviceId = this.getDeviceId();
      const platform = Platform.OS;

      console.log('📱 Device ID:', deviceId);
      console.log('📱 Platform:', platform);
      console.log('📱 Expo Push Token:', expoPushToken.substring(0, 20) + '...');

      // Try to get userId from stored user data
      let userId = null;
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
          console.log('📱 User ID found:', userId);
        } else {
          console.log('📱 No user data found in storage');
        }
      } catch (err) {
        console.warn('⚠️ Could not get userId from storage:', err);
      }

      // Prepare request payload
      const payload = {
        expoPushToken,
        deviceId,
        platform,
        ...(userId && { userId }) // Include userId if available
      };

      console.log('📱 Registering token with backend...');
      console.log('📱 Payload:', { ...payload, expoPushToken: expoPushToken.substring(0, 20) + '...' });

      // Register with backend using authenticated API client
      const response = await apiClient.post('/notification/register-token', payload);

      if (response.success) {
        console.log('✅ Push token registered successfully', userId ? `for user ${userId}` : '');
        console.log('📱 Response:', response);
        return {
          success: true,
          data: response
        };
      } else {
        console.error('❌ Failed to register push token:', response);
        console.error('❌ Response details:', JSON.stringify(response, null, 2));
        return {
          success: false,
          error: response.error || 'Failed to register push token'
        };
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        platform: Platform.OS,
      });
      return {
        success: false,
        error: error.message || 'Unknown error registering push token'
      };
    }
  }

  /**
   * Initialize notifications (request permission and register token)
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📱 Notifications already initialized');
      return { success: true, message: 'Already initialized' };
    }

    try {
      console.log('🚀 Initializing notifications...');

      // Request permission
      const hasPermission = await this.isEnabled();
      if (!hasPermission) {
        const result = await this.enable();
        if (!result.success) {
          return {
            success: false,
            error: 'Notification permission denied'
          };
        }
      }

      // Register push token
      const registerResult = await this.registerPushToken();
      if (!registerResult.success) {
        console.warn('⚠️ Failed to register push token, but continuing...');
      }

      this.isInitialized = true;
      console.log('✅ Notifications initialized successfully');
      
      return {
        success: true,
        tokenRegistered: registerResult.success
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return {
        success: false,
        error: error.message
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
  reset() {
    this.removeListeners();
    this.expoPushToken = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new NotificationService();

