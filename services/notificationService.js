import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

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
    this.pushToken = null;
    this.listeners = [];
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    console.log('🔔 Initializing notification service...');
    try {
      await this.setupNotificationChannels();
      const token = await this.registerForPushNotifications();
      if (token) {
        const success = await this.registerWithBackend();
        if (success) {
          console.log('✅ Notification service initialized and registered with backend');
          return true;
        }
      }
      console.log('❌ Failed to initialize notification service');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('❌ Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowSound: true, allowBadge: true },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return null;
      }

      let token;
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }

      this.pushToken = token;
      await this.savePushToken(token);
      console.log('✅ Push token registered:', token.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  async setupNotificationChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
  }

  async registerWithBackend() {
    if (!this.pushToken) {
      console.log('❌ No push token available for backend registration');
      return false;
    }

    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = uuidv4();
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('🆕 Generated new deviceId:', deviceId);
      }

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

      const responseText = await response.text();
      if (response.ok) {
        console.log('✅ Successfully registered with backend');
        return true;
      } else {
        console.log('❌ Failed to register with backend:', response.status, responseText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering with backend:', error);
      return false;
    }
  }

  setupListeners(onNotificationReceived, onNotificationTapped) {
    this.removeListeners();

    this.listeners.push(
      Notifications.addNotificationReceivedListener(notification => {
        console.log('📨 Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      })
    );

    this.listeners.push(
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      })
    );
  }

  removeListeners() {
    this.listeners.forEach(subscription => {
      Notifications.removeNotificationSubscription(subscription);
    });
    this.listeners = [];
  }

  async savePushToken(token) {
    try {
      await AsyncStorage.setItem('expo_push_token', token);
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  async loadPushToken() {
    try {
      const token = await AsyncStorage.getItem('expo_push_token');
      if (token) {
        this.pushToken = token;
      }
      return token;
    } catch (error) {
      console.error('❌ Error loading push token:', error);
      return null;
    }
  }

  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('✅ Badge cleared');
    } catch (error) {
      console.error('❌ Error clearing badge:', error);
    }
  }
}

const notificationService = NotificationService.getInstance();
export default notificationService;