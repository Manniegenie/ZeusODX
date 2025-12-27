// services/bannerService.js
import { apiClient } from './apiClient';

export const bannerService = {
  async getBanners() {
    try {
      // CHANGE THIS from '/banners/banner' to '/banners/banners-live'
      // (Assuming your app.use prefix in app.js is '/banners')
      const response = await apiClient.get('/banners/banners-live');

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data 
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to load banners'
        };
      }
    } catch (error) {
      console.error('❌ Banner service error:', error.message);
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }
};