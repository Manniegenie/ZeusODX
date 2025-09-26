import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('🔔 Setting notification handler');
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

class NotificationService {
  constructor() {
    this.pushToken = null;
    this.listeners = [];
    console.log('🔔 NotificationService instance created');
  }

  static getInstance() {
    if (!NotificationService.instance) {
      console.log('🆕 Creating new NotificationService instance');
      NotificationService.instance = new NotificationService();
    } else {
      console.log('🔄 Reusing existing NotificationService instance');
    }
    return NotificationService.instance;
  }

  async initialize() {
    console.log('🔔 Initializing notification service...');
    try {
      console.log('🔧 Setting up notification channels');
      await this.setupNotificationChannels();
      console.log('🔍 Registering for push notifications');
      const token = await this.registerForPushNotifications();
      if (token) {
        console.log('🔗 Attempting to register token with backend');
        const success = await this.registerWithBackend();
        if (success) {
          console.log('✅ Notification service initialized and registered with backend');
          return true;
        } else {
          console.log('❌ Backend registration failed');
        }
      } else {
        console.log('❌ No push token obtained');
      }
      console.log('❌ Failed to initialize notification service');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error.message, error.stack);
      return false;
    }
  }

  async registerForPushNotifications() {
    console.log('🔍 Checking if running on physical device');
    if (!Device.isDevice) {
      console.log('❌ Push notifications require a physical device');
      return null;
    }

    try {
      console.log('🔍 Checking existing notification permissions');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log('ℹ️ Current permission status:', existingStatus);

      if (existingStatus !== 'granted') {
        console.log('🔍 Requesting notification permissions');
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowSound: true, allowBadge: true },
        });
        finalStatus = status;
        console.log('ℹ️ New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return null;
      }

      console.log('🔍 Generating push token');
      let token;
      const isExpoGo = Constants.appOwnership === 'expo';
      console.log('ℹ️ Expo Go mode:', isExpoGo);
      if (isExpoGo) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log('ℹ️ Project ID:', projectId);
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }

      this.pushToken = token;
      console.log('✅ Push token generated:', token.substring(0, 20) + '...');
      console.log('🔍 Saving push token');
      await this.savePushToken(token);
      console.log('✅ Push token saved');
      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error.message, error.stack);
      return null;
    }
  }

  async setupNotificationChannels() {
    if (Platform.OS === 'android') {
      console.log('🔧 Setting up Android notification channel');
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
        console.log('✅ Android notification channel set up');
      } catch (error) {
        console.error('❌ Error setting up Android notification channel:', error.message, error.stack);
      }
    } else {
      console.log('ℹ️ Skipping notification channel setup (not Android)');
    }
  }

  async registerWithBackend() {
    if (!this.pushToken) {
      console.log('❌ No push token available for backend registration');
      return false;
    }

    try {
      console.log('🔍 Checking for existing deviceId');
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        console.log('🆕 Generating new deviceId');
        deviceId = uuidv4();
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('✅ Generated and saved deviceId:', deviceId);
      } else {
        console.log('✅ Using existing deviceId:', deviceId);
      }

      console.log('🔗 Sending push token to backend');
      const response = await fetch('https://zeusodx-web.onrender.com/notification/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expoPushToken: this.pushToken,
          deviceId,
          platform: Platform.OS,
        }),
      });

      console.log('ℹ️ Backend response status:', response.status);
      const responseText = await response.text();
      console.log('ℹ️ Backend response body:', responseText);

      if (response.ok) {
        console.log('✅ Successfully registered with backend');
        return true;
      } else {
        console.log('❌ Failed to register with backend:', response.status, responseText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering with backend:', error.message, error.stack);
      return false;
    }
  }

  setupListeners(onNotificationReceived, onNotificationTapped) {
    console.log('🔧 Setting up notification listeners');
    this.removeListeners();

    this.listeners.push(
      Notifications.addNotificationReceivedListener(notification => {
        console.log('📨 Notification received:', JSON.stringify(notification, null, 2));
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      })
    );

    this.listeners.push(
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', JSON.stringify(response, null, 2));
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      })
    );
    console.log('✅ Notification listeners set up');
  }

  removeListeners() {
    console.log('🧹 Removing notification listeners');
    this.listeners.forEach(subscription => {
      Notifications.removeNotificationSubscription(subscription);
    });
    this.listeners = [];
    console.log('✅ Notification listeners removed');
  }

  async savePushToken(token) {
    console.log('🔍 Saving push token to AsyncStorage');
    try {
      await AsyncStorage.setItem('expo_push_token', token);
      console.log('✅ Push token saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Error saving push token:', error.message, error.stack);
    }
  }

  async loadPushToken() {
    console.log('🔍 Loading push token from AsyncStorage');
    try {
      const token = await AsyncStorage.getItem('expo_push_token');
      if (token) {
        console.log('✅ Loaded push token:', token.substring(0, 20) + '...');
        this.pushToken = token;
      } else {
        console.log('ℹ️ No push token found in AsyncStorage');
      }
      return token;
    } catch (error) {
      console.error('❌ Error loading push token:', error.message, error.stack);
      return null;
    }
  }

  async clearBadge() {
    console.log('🔍 Clearing notification badge');
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('✅ Badge cleared');
    } catch (error) {
      console.error('❌ Error clearing badge:', error.message, error.stack);
    }
  }
}

const notificationService = NotificationService.getInstance();
export default notificationService;