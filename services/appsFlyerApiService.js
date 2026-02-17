// services/appsFlyerApiService.js
import { apiClient } from './apiClient';

export const appsFlyerApiService = {
  /**
   * Store AppsFlyer UID in backend database
   * This is CRITICAL for backend S2S tracking
   * @param {string} appsflyerId - The AppsFlyer UID
   * @returns {Promise<Object>} API response
   */
  async storeAppsFlyerId(appsflyerId) {
    try {
      if (!appsflyerId) {
        return {
          success: false,
          error: 'AppsFlyer ID is required'
        };
      }

      const response = await apiClient.post('/user/appsflyer-id', {
        appsflyer_id: appsflyerId
      });

      if (response.success && response.data?.success) {
        if (__DEV__) {
          console.log('✅ AppsFlyer ID stored successfully:', appsflyerId);
        }
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: response.data?.message || response.error || 'Failed to store AppsFlyer ID'
      };
    } catch (error) {
      if (__DEV__) {
        console.error('❌ storeAppsFlyerId error:', error?.message || error);
      }
      return {
        success: false,
        error: 'Failed to store AppsFlyer ID'
      };
    }
  }
};
