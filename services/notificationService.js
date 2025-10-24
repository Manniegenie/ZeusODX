import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.pushToken = null;
    this.listeners = [];
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if notifications are enabled
  async isEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  // Auto-enable notifications for Android (as requested by user)
  async autoEnable() {
    if (!Device.isDevice) {
      return { success: false, message: 'Notifications require a physical device' };
    }

    try {
      // Check if already enabled
      const alreadyEnabled = await this.isEnabled();
      if (alreadyEnabled) {
        return { success: true, message: 'Notifications already enabled' };
      }

      // For Android, automatically enable notifications
      if (Platform.OS === 'android') {
        console.log('🤖 Auto-enabling notifications for Android');
        return await this.enable();
      }

      // For iOS, still require user permission
      return await this.enable();
    } catch (error) {
      console.error('Error auto-enabling notifications:', error);
      return { success: false, message: 'Failed to auto-enable notifications' };
    }
  }

  // Request notification permissions and register
  async enable() {
    if (!Device.isDevice) {
      return { success: false, message: 'Notifications require a physical device' };
    }

    try {
      // Setup Android channels first
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Request permissions with Android-specific options
      const permissionRequest = {
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      };

      // Add Android-specific permissions
      if (Platform.OS === 'android') {
        permissionRequest.android = {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        };
      }

      const { status } = await Notifications.requestPermissionsAsync(permissionRequest);

      if (status !== 'granted') {
        return { 
          success: false, 
          message: 'Permission denied. Please enable notifications in Settings.' 
        };
      }

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        return { success: false, message: 'Failed to get push token' };
      }

      this.pushToken = token;
      await AsyncStorage.setItem('expo_push_token', token);

      // Register with backend
      const registered = await this.registerWithBackend(token);
      if (!registered) {
        return { success: false, message: 'Failed to register with backend' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return { success: false, message: 'Failed to enable notifications' };
    }
  }

  // Open device notification settings
  async openSettings() {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  // Clear badge count
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  // Setup listeners
  setupListeners(onReceived, onTapped) {
    this.removeListeners();

    if (onReceived) {
      this.listeners.push(
        Notifications.addNotificationReceivedListener(onReceived)
      );
    }

    if (onTapped) {
      this.listeners.push(
        Notifications.addNotificationResponseReceivedListener(onTapped)
      );
    }
  }

  removeListeners() {
    this.listeners.forEach(sub => {
      Notifications.removeNotificationSubscription(sub);
    });
    this.listeners = [];
  }

  // Private helper methods
  async setupAndroidChannels() {
    try {
      // Create default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#35297F',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Create transactions channel (matches backend channelId)
      await Notifications.setNotificationChannelAsync('transactions', {
        name: 'Transaction Notifications',
        description: 'Notifications for deposits, withdrawals, and transfers',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#35297F',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Create security channel
      await Notifications.setNotificationChannelAsync('security', {
        name: 'Security Alerts',
        description: 'Important security notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      console.log('✅ Android notification channels created successfully');
    } catch (error) {
      console.error('❌ Error setting up Android channels:', error);
      throw error;
    }
  }

  async getPushToken() {
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      let token;
      
      if (isExpoGo) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async registerWithBackend(token) {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = uuidv4();
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      // Get current user ID if available
      let userId = null;
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      } catch (error) {
        console.log('No user data found for notification registration');
      }

      const requestBody = {
        expoPushToken: token,
        deviceId,
        platform: Platform.OS,
      };

      // Add userId if available (for authenticated users)
      if (userId) {
        requestBody.userId = userId;
      }

      const response = await fetch('https://zeusodx-web.onrender.com/notification/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Notification registration successful:', result.message);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Notification registration failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Error registering with backend:', error);
      return false;
    }
  }
}

export default NotificationService.getInstance();