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
      console.error('❌ AppsFlyer init error:', error);
      return { success: false, error };
    }

    // Log configuration for debugging
    if (Platform.OS === 'ios') {
      console.log('📱 [APPSFLYER] iOS App ID:', this.iosAppId);
    }
    console.log('📱 [APPSFLYER] Dev Key:', this.devKey ? `${this.devKey.substring(0, 10)}...` : 'NOT SET');

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

  async setHashedPhone(rawPhone) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer || !this.isInitialized || !rawPhone) return;
    try {
      const hash = sha256(rawPhone.replace(/\D/g, ''));
      if (hash) {
        await this.setUserData({ snap_hashed_phone: hash });
        if (__DEV__) console.log('✅ AppsFlyer hashed phone set');
      }
    } catch (e) {
      if (__DEV__) console.warn('⚠️ AppsFlyer setHashedPhone failed:', e);
    }
  }

  async setHashedEmail(rawEmail) {
    const appsFlyer = getAppsFlyer();
    if (!appsFlyer || !this.isInitialized || !rawEmail) return;
    try {
      const hash = sha256(rawEmail.toLowerCase().trim());
      if (hash) {
        await this.setUserData({ snap_hashed_email: hash });
        if (__DEV__) console.log('✅ AppsFlyer hashed email set');
      }
    } catch (e) {
      if (__DEV__) console.warn('⚠️ AppsFlyer setHashedEmail failed:', e);
    }
  }
}

// Pure JS SHA-256 — works in Hermes (no crypto.subtle needed)
function sha256(str) {
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
  function add(...a) { return a.reduce((s, v) => (s + v) >>> 0); }

  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  const len = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bits = len * 8;
  bytes.push(0, 0, 0, 0, (bits >>> 24) & 0xff, (bits >>> 16) & 0xff, (bits >>> 8) & 0xff, bits & 0xff);

  const h = [...H];
  for (let i = 0; i < bytes.length; i += 64) {
    const w = new Array(64);
    for (let j = 0; j < 16; j++)
      w[j] = (bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3];
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(7,w[j-15]) ^ rotr(18,w[j-15]) ^ (w[j-15]>>>3);
      const s1 = rotr(17,w[j-2]) ^ rotr(19,w[j-2]) ^ (w[j-2]>>>10);
      w[j] = add(w[j-16], s0, w[j-7], s1);
    }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(6,e) ^ rotr(11,e) ^ rotr(25,e);
      const ch = (e & f) ^ (~e & g);
      const t1 = add(hh, S1, ch, K[j], w[j]);
      const S0 = rotr(2,a) ^ rotr(13,a) ^ rotr(22,a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = add(S0, maj);
      hh=g; g=f; f=e; e=add(d,t1); d=c; c=b; b=a; a=add(t1,t2);
    }
    h[0]=add(h[0],a); h[1]=add(h[1],b); h[2]=add(h[2],c); h[3]=add(h[3],d);
    h[4]=add(h[4],e); h[5]=add(h[5],f); h[6]=add(h[6],g); h[7]=add(h[7],hh);
  }
  return h.map(v => (v>>>0).toString(16).padStart(8,'0')).join('');
}

export default new AppsFlyerService();
