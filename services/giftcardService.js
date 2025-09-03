// services/giftcardService.js
import { apiClient } from './apiClient';

export const giftcardService = {
  async submitGiftCard(giftCardData) {
    try {
      const formData = new FormData();

      // Required fields - ensure they exist and are strings
      formData.append('cardType', giftCardData.cardType || '');
      formData.append('cardFormat', giftCardData.cardFormat || '');
      formData.append('country', giftCardData.country || '');
      formData.append('cardRange', giftCardData.cardRange || '');
      formData.append('cardValue', String(giftCardData.cardValue || ''));
      formData.append('currency', giftCardData.currency || 'USD');

      // Optional fields
      if (giftCardData.description) formData.append('description', giftCardData.description);
      if (giftCardData.eCode && giftCardData.cardFormat === 'E_CODE') {
        formData.append('eCode', giftCardData.eCode);
      }

      // Images - CRITICAL: Your backend expects 'cardImages' field name
      if (Array.isArray(giftCardData.images) && giftCardData.images.length > 0) {
        giftCardData.images.forEach((image, idx) => {
          const file = {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `card_image_${idx}.jpg`,
          };
          // Your multer setup expects 'cardImages' - this should be correct
          formData.append('cardImages', file);
        });
      }

      // CRITICAL: Don't set Content-Type header - let apiClient handle it
      const response = await apiClient.post('/giftcard/submit', formData, {
        timeout: 60000,
      });

      // Handle response properly
      const responseData = response.data || response;
      
      if (responseData?.success) {
        return { success: true, data: responseData.data };
      }

      // Handle validation errors
      if (Array.isArray(responseData?.errors)) {
        return { success: false, error: responseData.errors.join(', ') };
      }
      
      return { success: false, error: responseData?.message || 'Failed to submit gift card' };
      
    } catch (error) {
      console.error('Service error:', error);
      
      const serverResponse = error?.response?.data;
      if (serverResponse) {
        if (Array.isArray(serverResponse.errors)) {
          return { success: false, error: serverResponse.errors.join(', ') };
        }
        if (serverResponse.message) {
          return { success: false, error: serverResponse.message };
        }
      }
      
      return { success: false, error: error?.message || 'Network error occurred' };
    }
  },
};