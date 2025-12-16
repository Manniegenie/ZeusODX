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

// Configure notification behavior - MUST be set before any notification operations
// This is critical for Android production builds
// Updated to match Expo documentation recommendations for Android
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // Android: Show notification banner
    shouldShowList: true,    // Android: Show in notification list
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
   * Request notification permissions
   * CRITICAL: For Android 13+, must create notification channel first
   */
  async requestPermission() {
    try {
      // Android 13+ requires notification channel before permission request
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannel();
      }

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
   * Setup Android notification channel (required for Android 13+)
   * Must be called before requesting permissions or getting push token
   * CRITICAL: Channel must exist before permission prompt appears
   */
  async setupAndroidNotificationChannel() {
    if (Platform.OS !== 'android') {
      return { success: true, skipped: true };
    }

    try {
      // Check if channel already exists
      let existingChannel;
      try {
        existingChannel = await Notifications.getNotificationChannelAsync('default');
      } catch (err) {
        // getNotificationChannelAsync might fail if channel doesn't exist
        existingChannel = null;
      }
      
      if (existingChannel) {
        console.log('✅ [ANDROID] Notification channel already exists');
        return { success: true, skipped: true };
      }

      // CRITICAL: Create default notification channel for Android 13+
      // The channel ID 'default' is what Expo expects
      console.log('🤖 [ANDROID] Creating notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        description: 'Default notification channel for ZeusODX',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#35297F',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        // Ensure channel is enabled
        enableLights: true,
      });

      // Verify channel was created
      const verifyChannel = await Notifications.getNotificationChannelAsync('default');
      if (verifyChannel) {
        console.log('✅ [ANDROID] Notification channel created and verified');
        return { success: true };
      } else {
        console.error('❌ [ANDROID] Channel creation failed - channel not found after creation');
        return { success: false, error: 'Channel not found after creation' };
      }
    } catch (error) {
      console.error('❌ [ANDROID] Error setting up notification channel:', error.message);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Don't fail completely - try to continue (might work on older Android)
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Expo push token - CRITICAL: For Android 13+, requires notification channel and permission
   */
  async getExpoPushToken() {
    try {
      // Simulators don't support push tokens
      if (!Device.isDevice) {
        console.log('⚠️ Not a physical device, skipping token generation');
        return null;
      }

      // CRITICAL FIX: Android 13+ requires notification channel BEFORE getting token
      if (Platform.OS === 'android') {
        console.log('🤖 [ANDROID] Step 1: Setting up notification channel...');
        const channelResult = await this.setupAndroidNotificationChannel();
        if (!channelResult.success && !channelResult.skipped) {
          console.error('❌ [ANDROID] Failed to setup notification channel');
          // Continue anyway - might work on older Android versions
        }
        
        // CRITICAL: Wait a moment for channel to be fully registered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Request permission explicitly for Android 13+ (API 33+)
        // This is REQUIRED for production builds on Android 13+
        console.log('🤖 [ANDROID] Step 2: Checking notification permission...');
        let { status } = await Notifications.getPermissionsAsync();
        console.log('🤖 [ANDROID] Current permission status:', status);
        
        if (status !== 'granted') {
          console.log('🤖 [ANDROID] Step 3: Requesting notification permission...');
          const permissionResult = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: false,
            },
            android: {
              // Explicitly request POST_NOTIFICATIONS for Android 13+
            },
          });
          
          status = permissionResult.status;
          console.log('🤖 [ANDROID] Permission request result:', status);
          
          if (status !== 'granted') {
            console.error('❌ [ANDROID] Notification permission DENIED. Token generation will likely fail.');
            console.error('   User must grant notification permission in app settings.');
            // In production, we should still try to get token, but it will likely fail
            // Some Android versions might allow token generation but notifications won't work
          } else {
            console.log('✅ [ANDROID] Notification permission GRANTED');
          }
        } else {
          console.log('✅ [ANDROID] Notification permission already granted');
        }
        
        // CRITICAL: For Android 13+, permission MUST be granted before token generation
        // Some production builds will fail silently if permission is not granted
        if (status !== 'granted') {
          console.warn('⚠️ [ANDROID] Proceeding without permission - token may fail in production');
        }
      }

      // Get project ID from config (try multiple sources for production compatibility)
      let projectId = null;
      
      // Try EAS config first (production builds)
      if (Constants.easConfig?.projectId) {
        projectId = Constants.easConfig.projectId;
        console.log('📱 Using projectId from Constants.easConfig');
      }
      // Fallback to expo config (development)
      else if (Constants.expoConfig?.extra?.eas?.projectId) {
        projectId = Constants.expoConfig.extra.eas.projectId;
        console.log('📱 Using projectId from Constants.expoConfig.extra.eas');
      }
      // Last resort: try manifest (some builds)
      else if (Constants.manifest?.extra?.eas?.projectId) {
        projectId = Constants.manifest.extra.eas.projectId;
        console.log('📱 Using projectId from Constants.manifest.extra.eas');
      }
      
      if (!projectId) {
        console.error('❌ EAS projectId not found in app config');
        console.error('   Platform:', Platform.OS);
        console.error('   Constants.easConfig:', Constants.easConfig ? 'exists' : 'null');
        console.error('   Constants.expoConfig?.extra?.eas:', Constants.expoConfig?.extra?.eas ? 'exists' : 'null');
        console.error('   Constants.manifest?.extra?.eas:', Constants.manifest?.extra?.eas ? 'exists' : 'null');
        console.error('   Full Constants:', JSON.stringify({
          easConfig: Constants.easConfig,
          expoConfigExtra: Constants.expoConfig?.extra,
          manifestExtra: Constants.manifest?.extra
        }, null, 2));
        return null;
      }

      console.log('📱 Step 4: Generating Expo push token with projectId:', projectId.substring(0, 20) + '...');
      
      // CRITICAL: Wrap in try-catch to catch any silent failures in production
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({ 
          projectId,
          // Explicitly set applicationId for Android production builds
          ...(Platform.OS === 'android' && {
            // Some production builds need explicit app identifier
          })
        });
      } catch (tokenError) {
        console.error('❌ getExpoPushTokenAsync threw an error:', tokenError);
        console.error('   Error type:', tokenError.constructor.name);
        console.error('   Error message:', tokenError.message);
        console.error('   Error stack:', tokenError.stack);
        
        // Check if it's a permission error
        if (tokenError.message?.includes('permission') || tokenError.message?.includes('Permission')) {
          console.error('❌ Permission-related error. User must grant notification permission.');
        }
        
        return null;
      }
      
      if (!token || !token.data) {
        console.error('❌ Failed to get Expo push token - token or token.data is null');
        console.error('   Token object:', token);
        console.error('   Platform:', Platform.OS);
        return null;
      }

      console.log('✅ Expo push token generated successfully:', token.data.substring(0, 30) + '...');
      console.log('   Full token length:', token.data.length);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error.message);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        platform: Platform.OS,
        isDevice: Device.isDevice,
      });
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
   * CRITICAL: For Android 13+, sets up notification channel and requests permission
   */
  async initializePushNotifications() {
    try {
      // CRITICAL FIX: Android 13+ requires notification channel setup FIRST
      if (Platform.OS === 'android') {
        console.log('🤖 [ANDROID] Setting up notification channel before token generation...');
        const channelResult = await this.setupAndroidNotificationChannel();
        if (!channelResult.success && !channelResult.skipped) {
          console.warn('⚠️ [ANDROID] Notification channel setup had issues, but continuing...');
        }
      }

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

      // Step 2: Generate token (with Android 13+ permission handling)
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

      console.log('📤 Registering token:', { 
        deviceId, 
        platform: Platform.OS, 
        hasUserId: !!userId,
        tokenPrefix: expoPushToken?.substring(0, 20) + '...'
      });
      
      const response = await apiClient.post('/notification/register-token', payload);

      if (response.success) {
        console.log('✅ Push token registered successfully in database');
        console.log('   Response:', JSON.stringify(response.data || response, null, 2));
        return {
          success: true,
          data: response
        };
      } else {
        console.error('❌ Failed to register push token:', response.error);
        console.error('   Full response:', JSON.stringify(response, null, 2));
        console.error('   Payload sent:', JSON.stringify({
          ...payload,
          expoPushToken: payload.expoPushToken?.substring(0, 20) + '...'
        }, null, 2));
        return {
          success: false,
          error: response.error || 'Failed to register push token',
          details: response
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

