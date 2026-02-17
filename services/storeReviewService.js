import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = '@zeusodx_store_review_done';
let promptShownThisSession = false;

const ANDROID_PACKAGE = 'com.manniegenie.zeusodx';
// Set your Apple App Store numeric ID in app.config.js extra.appleAppId or EXPO_PUBLIC_APPLE_APP_ID
const getAppleAppId = () =>
  Constants.expoConfig?.extra?.appleAppId ||
  process.env.EXPO_PUBLIC_APPLE_APP_ID ||
  '';

const getStoreUrl = () => {
  if (Platform.OS === 'ios') {
    const appId = getAppleAppId();
    if (appId) {
      return `https://apps.apple.com/app/id${appId}?action=write-review`;
    }
    return null;
  }
  if (Platform.OS === 'android') {
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  }
  return null;
};

export const storeReviewService = {
  /**
   * Returns true if the user has already been prompted and completed (opened store) or we've marked as done.
   */
  async hasUserReviewed() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async markReviewDone() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('storeReviewService: failed to persist review done', e?.message);
    }
  },

  /**
   * Checks if the user has already reviewed; if not, shows an Alert asking them to review.
   * On "Review", opens the store and marks as done so we don't prompt again.
   * Safe to call repeatedly – no-op if already reviewed.
   */
  async requestStoreReviewIfNeeded() {
    try {
      const alreadyDone = await this.hasUserReviewed();
      if (alreadyDone || promptShownThisSession) return;
      promptShownThisSession = true;

      const storeUrl = getStoreUrl();
      const storeName = Platform.OS === 'ios' ? 'App Store' : 'Play Store';

      Alert.alert(
        'Enjoying ZeusODX?',
        `If you have a moment, we’d love a review on the ${storeName}. It helps us a lot.`,
        [
          {
            text: 'Not now',
            style: 'cancel',
          },
          {
            text: 'Review',
            onPress: () => {
              this.markReviewDone();
              if (storeUrl) {
                Linking.openURL(storeUrl).catch((err) =>
                  console.warn('storeReviewService: could not open store', err?.message)
                );
              }
            },
          },
        ]
      );
    } catch (e) {
      console.warn('storeReviewService: requestStoreReviewIfNeeded failed', e?.message);
    }
  },
};
