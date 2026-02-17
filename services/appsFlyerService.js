import { Platform } from 'react-native';

// Lazy-load native module so Expo Go doesn't crash (react-native-appsflyer requires a dev build)
let _appsFlyer = undefined;
function getAppsFlyer() {
  if (_appsFlyer === undefined) {
    try {
      _appsFlyer = require('react-native-appsflyer').default;
    } catch (e) {
      if (__DEV__) {
        console.warn('⚠️ AppsFlyer native module not available (use a development build for full support).');
      }
      _appsFlyer = null;
    }
  }
  return _appsFlyer;
}


class AppsFlyerService {
  constructor() {
    this.isInitialized = false;
    this.devKey = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY || '';
    this.iosAppId = process.env.EXPO_PUBLIC_APPSFLYER_IOS_APP_ID || '';
  }

  async init(onInstallConversionData = null, onDeepLink = null) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer) return { success: false, error: 'AppsFlyer not available' };

    if (this.isInitialized) {
      if (__DEV__) console.log('⚠️ AppsFlyer already initialized');
      return { success: true, message: 'Already initialized' };
    }

    if (!this.devKey) {
      const error = 'AppsFlyer dev key not configured. Set EXPO_PUBLIC_APPSFLYER_DEV_KEY in .env';
      if (__DEV__) console.error('❌ AppsFlyer init error:', error);
      return { success: false, error };
    }

    if (Platform.OS === 'ios' && !this.iosAppId) {
      const error = 'AppsFlyer iOS app ID not configured. Set EXPO_PUBLIC_APPSFLYER_IOS_APP_ID in .env';
      if (__DEV__) console.error('❌ AppsFlyer init error:', error);
      return { success: false, error };
    }

    return new Promise((resolve) => {
      const options = {
        devKey: this.devKey,
        isDebug: __DEV__,
        appId: this.iosAppId,
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
      };

      if (onInstallConversionData) {
        appsFlyer.onInstallConversionData((data) => {
          if (__DEV__) console.log('📊 AppsFlyer Install Conversion Data (GCD):', JSON.stringify(data, null, 2));
          onInstallConversionData(data);
        });
      }

      if (onDeepLink) {
        appsFlyer.onDeepLink((data) => {
          if (__DEV__) console.log('🔗 AppsFlyer Deep Link (UDL):', JSON.stringify(data, null, 2));
          onDeepLink(data);
        });
      }

      appsFlyer.initSdk(
        options,
        (result) => {
          this.isInitialized = true;
          if (__DEV__) console.log('✅ AppsFlyer init success:', result);
          resolve({ success: true, data: result });
        },
        (error) => {
          if (__DEV__) console.error('❌ AppsFlyer init error:', error);
          resolve({ success: false, error: error?.message || 'AppsFlyer initialization failed' });
        }
      );
    });
  }

  async getAppsFlyerUID() {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer) return Promise.resolve({ success: false, error: 'AppsFlyer not available' });

    return new Promise((resolve) => {
      appsFlyer.getAppsFlyerUID((error, uid) => {
        if (error) {
          if (__DEV__) console.error('❌ Error getting AppsFlyer UID:', error);
          resolve({ success: false, error: error?.message || 'Failed to get AppsFlyer UID' });
        } else {
          if (__DEV__) console.log('✅ AppsFlyer UID:', uid);
          resolve({ success: true, uid });
        }
      });
    });
  }

  async logEvent(eventName, eventValues = {}) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer) return Promise.resolve({ success: false, error: 'AppsFlyer not available' });
    if (!this.isInitialized) {
      if (__DEV__) console.warn('⚠️ AppsFlyer not initialized, skipping event:', eventName);
      return { success: false, error: 'AppsFlyer not initialized' };
    }

    return new Promise((resolve) => {
      appsFlyer.logEvent(
        eventName,
        eventValues,
        (result) => {
          if (__DEV__) console.log(`✅ AppsFlyer event logged: ${eventName}`, result);
          resolve({ success: true, data: result });
        },
        (error) => {
          if (__DEV__) console.error(`❌ AppsFlyer event error: ${eventName}`, error);
          resolve({ success: false, error: error?.message || 'Failed to log event' });
        }
      );
    });
  }

  async setUserId(userId) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer) return Promise.resolve({ success: false, error: 'AppsFlyer not available' });
    if (!this.isInitialized) {
      if (__DEV__) console.warn('⚠️ AppsFlyer not initialized, skipping setUserId');
      return { success: false, error: 'AppsFlyer not initialized' };
    }

    return new Promise((resolve) => {
      appsFlyer.setCustomerUserId(userId, (result) => {
        if (__DEV__) console.log('✅ AppsFlyer user ID set:', userId, result);
        resolve({ success: true, data: result });
      });
    });
  }

  async setUserData(userData) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer) return Promise.resolve({ success: false, error: 'AppsFlyer not available' });
    if (!this.isInitialized) {
      if (__DEV__) console.warn('⚠️ AppsFlyer not initialized, skipping setUserData');
      return { success: false, error: 'AppsFlyer not initialized' };
    }

    return new Promise((resolve) => {
      appsFlyer.setAdditionalData(userData, (result) => {
        if (__DEV__) console.log('✅ AppsFlyer user data set:', result);
        resolve({ success: true, data: result });
      });
    });
  }
}

export default new AppsFlyerService();
