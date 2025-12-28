/**
 * Notification Service
 * Expo push notifications (Android + iOS)
 * OPTION 1: System-handled notifications (RECOMMENDED)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /* ----------------------------------------------------
   * Permissions
   * -------------------------------------------------- */

  async isEnabled() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  async requestPermission() {
    if (Platform.OS === 'android') {
      await this.setupAndroidNotificationChannel();
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return { success: status === 'granted', status };
  }

  /* ----------------------------------------------------
   * Android Channels (CRITICAL)
   * -------------------------------------------------- */

  async setupAndroidNotificationChannel() {
    if (Platform.OS !== 'android') return { success: true };

    try {
      await Notifications.setNotificationChannelAsync('transactions', {
        name: 'Transactions',
        description: 'Deposits, withdrawals, swaps, and payments',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Android channel setup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /* ----------------------------------------------------
   * Token Handling
   * -------------------------------------------------- */

  async getExpoPushToken() {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      await this.setupAndroidNotificationChannel();
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync();
      if (res.status !== 'granted') return null;
    }

    const projectId =
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.manifest?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('EAS projectId not found');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token?.data || null;
  }

  /* ----------------------------------------------------
   * Device ID
   * -------------------------------------------------- */

  async getDeviceId() {
    const STORAGE_KEY = 'zeusodx_device_id';

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;

    const id = Device.isDevice
      ? `${Platform.OS}-${Device.modelId || Device.modelName || 'device'}`
      : `${Platform.OS}-simulator`;

    await AsyncStorage.setItem(STORAGE_KEY, id);
    return id;
  }

  /* ----------------------------------------------------
   * Registration
   * -------------------------------------------------- */

  async initializePushNotifications() {
    if (Platform.OS === 'android') {
      await this.setupAndroidNotificationChannel();
    }

    const expoPushToken = await this.getExpoPushToken();
    if (!expoPushToken) {
      return { success: false, error: 'Token generation failed' };
    }

    const deviceId = await this.getDeviceId();

    let userId = null;
    try {
      const user = JSON.parse(await AsyncStorage.getItem('user_data'));
      userId = user?._id || user?.id || null;
    } catch {}

    const payload = {
      expoPushToken,
      deviceId,
      platform: Platform.OS,
      ...(userId && { userId }),
    };

    const response = await apiClient.post('/notification/register-token', payload);
    return response.success
      ? { success: true }
      : { success: false, error: response.error };
  }

  /* ----------------------------------------------------
   * Listeners (OPTIONAL)
   * -------------------------------------------------- */

  setupListeners(onReceived, onTapped) {
    this.removeListeners();

    if (onReceived) {
      this.notificationListener =
        Notifications.addNotificationReceivedListener(onReceived);
    }

    if (onTapped) {
      this.responseListener =
        Notifications.addNotificationResponseReceivedListener(onTapped);
    }
  }

  removeListeners() {
    this.notificationListener?.remove();
    this.responseListener?.remove();
    this.notificationListener = null;
    this.responseListener = null;
  }

  async reset() {
    this.removeListeners();
    await AsyncStorage.removeItem('last_registered_push_token');
  }
}

export default new NotificationService();
