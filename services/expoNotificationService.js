import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Use the same API base URL as the rest of the app
// Match the base URL from apiClient.js
const API_BASE_URL = __DEV__
  ? 'https://zeusadminxyz.online'
  : 'https://zeusadminxyz.online';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }
    
    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get Expo push token
 */
export const getExpoPushToken = async () => {
  try {
    // For testing, we'll create a mock token for simulators
    if (!Device.isDevice) {
      console.log('📱 Using simulator - creating mock token for testing');
      const mockToken = `ExponentPushToken[simulator-${Date.now()}]`;
      console.log('📱 Mock Expo Push Token:', mockToken);
      return mockToken;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('📱 Expo Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

/**
 * Get device ID
 */
export const getDeviceId = () => {
  try {
    if (Device.isDevice) {
      return Device.osInternalBuildId || Device.modelId || 'unknown-device';
    } else {
      // For simulators, create a consistent ID
      return 'ios-simulator-test';
    }
  } catch (error) {
    console.error('Error getting device ID:', error);
    return 'unknown-device';
  }
};

/**
 * Register Expo push token with server
 */
export const registerExpoPushToken = async (expoPushToken, deviceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notification/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expoPushToken,
        deviceId,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Expo push token registered successfully:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ Failed to register Expo push token:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('Error registering Expo push token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize Expo Notifications and register token
 */
export const initializeExpoNotifications = async () => {
  try {
    console.log('🚀 Initializing Expo Notifications...');
    
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    // Get device ID
    const deviceId = getDeviceId();
    if (!deviceId) {
      return { success: false, error: 'Could not get device ID' };
    }

    // Get Expo push token
    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) {
      return { success: false, error: 'Could not get Expo push token' };
    }

    // Register with server
    const result = await registerExpoPushToken(expoPushToken, deviceId);
    if (result.success) {
      console.log('✅ Expo Notifications initialized successfully');
    }

    return result;
  } catch (error) {
    console.error('Error initializing Expo Notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up notification listeners
 */
export const setupNotificationListeners = () => {
  // Handle notifications received while app is running
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification);
  });

  // Handle notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification tapped:', response);
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });
    console.log('✅ Local notification scheduled');
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
};
