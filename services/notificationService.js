import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // Request notification permissions and register
  async enable() {
    if (!Device.isDevice) {
      return { success: false, message: 'Notifications require a physical device' };
    }

    try {
      // Setup Android channels first
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });

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
  async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
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

      const response = await fetch('https://zeusodx-web.onrender.com/notification/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expoPushToken: token,
          deviceId,
          platform: Platform.OS,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error registering with backend:', error);
      return false;
    }
  }
}

export default NotificationService.getInstance();