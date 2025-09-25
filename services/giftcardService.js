// services/giftCardService.js
import { apiClient } from './apiClient';

export const giftCardService = {
  /**
   * Submit a gift card for processing
   * @param {Object} giftCardData - The gift card data
   * @returns {Promise<Object>} Response object with success status and data
   */
  async submitGiftCard(giftCardData) {
    try {
      console.log('Submitting gift card data:', {
        ...giftCardData,
        images: `${giftCardData.images?.length || 0} images`
      });

      const formData = new FormData();

      // Required fields validation
      if (!giftCardData.cardType) {
        throw new Error('Card type is required');
      }
      if (!giftCardData.cardFormat) {
        throw new Error('Card format is required');
      }
      if (!giftCardData.country) {
        throw new Error('Country is required');
      }
      if (!giftCardData.cardValue || isNaN(parseFloat(giftCardData.cardValue))) {
        throw new Error('Valid card value is required');
      }

      // Append required fields
      formData.append('cardType', String(giftCardData.cardType).toUpperCase());
      formData.append('cardFormat', String(giftCardData.cardFormat).toUpperCase());
      formData.append('country', String(giftCardData.country).toUpperCase());
      formData.append('cardValue', String(giftCardData.cardValue));
      formData.append('currency', giftCardData.currency || 'USD');

      // Handle card range
      let cardRange = giftCardData.cardRange;
      if (!cardRange && giftCardData.cardRangeMin && giftCardData.cardRangeMax) {
        cardRange = `${giftCardData.cardRangeMin}-${giftCardData.cardRangeMax}`;
      }
      if (!cardRange) {
        throw new Error('Card range is required');
      }
      formData.append('cardRange', String(cardRange));

      // Optional fields
      if (giftCardData.description) {
        formData.append('description', String(giftCardData.description));
      }

      // Handle vanilla type for VANILLA cards
      if (String(giftCardData.cardType).toUpperCase() === 'VANILLA' && giftCardData.vanillaType) {
        formData.append('vanillaType', String(giftCardData.vanillaType));
      }

      // Handle E-code for E_CODE format
      if (String(giftCardData.cardFormat).toUpperCase() === 'E_CODE') {
        if (!giftCardData.eCode) {
          throw new Error('E-code is required for E-Code format');
        }
        formData.append('eCode', String(giftCardData.eCode));
      }

      // Handle images for PHYSICAL format
      if (String(giftCardData.cardFormat).toUpperCase() === 'PHYSICAL') {
        if (!Array.isArray(giftCardData.images) || giftCardData.images.length === 0) {
          throw new Error('At least one image is required for physical cards');
        }

        // Process each image
        giftCardData.images.forEach((image, index) => {
          if (!image || !image.uri) {
            console.warn(`Skipping invalid image at index ${index}`);
            return;
          }

          // Create proper file object
          const fileObj = {
            uri: image.uri,
            type: image.type || image.mime || 'image/jpeg',
            name: image.name || image.fileName || `card_image_${index + 1}.jpg`
          };

          console.log(`Adding image ${index + 1}:`, {
            name: fileObj.name,
            type: fileObj.type,
            uri: fileObj.uri.substring(0, 50) + '...'
          });

          formData.append('cardImages', fileObj);
        });
      }

      console.log('FormData prepared, making API request...');

      // Make the API request
      const response = await apiClient.post('/giftcard/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for image uploads
        transformRequest: [(data) => data],
      });

      console.log('API Response:', response.data);

      const responseData = response.data;
      
      if (responseData?.success) {
        return { success: true, data: responseData.data };
      }

      // Handle validation errors
      if (Array.isArray(responseData?.errors)) {
        return { 
          success: false, 
          error: responseData.errors.join(', '),
          details: responseData.errors
        };
      }
      
      return { 
        success: false, 
        error: responseData?.message || 'Failed to submit gift card' 
      };
      
    } catch (error) {
      console.error('Gift card service error:', {
        message: error.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      // Handle server validation errors
      const serverResponse = error?.response?.data;
      if (serverResponse) {
        if (Array.isArray(serverResponse.errors)) {
          return { 
            success: false, 
            error: serverResponse.errors.join(', '),
            details: serverResponse.errors
          };
        }
        if (serverResponse.message) {
          return { success: false, error: serverResponse.message };
        }
      }
      
      // Handle network/timeout errors
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Request timeout. Please check your internet connection and try again.' };
      }
      
      return { 
        success: false, 
        error: error?.message || 'Network error occurred. Please try again.' 
      };
    }
  },

  /**
   * Get supported gift card types, countries, formats, and vanilla types
   * @returns {Promise<Object>} Response object with gift card configuration data
   */
  async getGiftCardTypes() {
    try {
      const response = await apiClient.get('/giftcard/types');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching gift card types:', error);
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to fetch gift card types' 
      };
    }
  },

  /**
   * Get gift card rates with optional filtering
   * @param {Object} params - Query parameters for filtering rates
   * @param {string} params.country - Filter by country
   * @param {string} params.cardType - Filter by card type
   * @param {string} params.vanillaType - Filter by vanilla type (for VANILLA cards)
   * @returns {Promise<Object>} Response object with rates data
   */
  async getGiftCardRates(params = {}) {
    try {
      const response = await apiClient.get('/giftcard/rates', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching gift card rates:', error);
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to fetch gift card rates' 
      };
    }
  },

  /**
   * Get a specific gift card by ID
   * @param {string} giftCardId - The gift card ID
   * @returns {Promise<Object>} Response object with gift card data
   */
  async getGiftCard(giftCardId) {
    try {
      if (!giftCardId) {
        throw new Error('Gift card ID is required');
      }

      const response = await apiClient.get(`/giftcard/${giftCardId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching gift card:', error);
      
      if (error?.response?.status === 404) {
        return { success: false, error: 'Gift card not found' };
      }
      
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to fetch gift card' 
      };
    }
  },

  /**
   * Get user's gift cards with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response object with gift cards and pagination data
   */
  async getUserGiftCards(params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
      };

      const response = await apiClient.get('/giftcard', { params: queryParams });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user gift cards:', error);
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to fetch gift cards' 
      };
    }
  },

  /**
   * Calculate expected amount for a gift card before submission
   * @param {Object} calculationData - Data for calculation
   * @param {string} calculationData.cardType - Card type
   * @param {string} calculationData.country - Country
   * @param {number} calculationData.cardValue - Card value
   * @param {string} calculationData.cardFormat - Card format (PHYSICAL/E_CODE)
   * @param {string} calculationData.vanillaType - Vanilla type (for VANILLA cards)
   * @returns {Promise<Object>} Response object with calculation result
   */
  async calculateExpectedAmount(calculationData) {
    try {
      const { cardType, country, cardValue, cardFormat, vanillaType } = calculationData;

      // Get rates for the specific card type and country
      const ratesParams = {
        cardType: cardType?.toUpperCase(),
        country: country?.toUpperCase()
      };

      if (cardType?.toUpperCase() === 'VANILLA' && vanillaType) {
        ratesParams.vanillaType = vanillaType;
      }

      const ratesResponse = await this.getGiftCardRates(ratesParams);
      
      if (!ratesResponse.success || !ratesResponse.data || ratesResponse.data.length === 0) {
        return { 
          success: false, 
          error: 'No rates found for this card type and country combination' 
        };
      }

      const rate = ratesResponse.data[0]; // Get the first matching rate
      
      // Calculate based on card format
      let applicableRate;
      if (cardFormat?.toUpperCase() === 'PHYSICAL' && rate.physicalRate) {
        applicableRate = rate.physicalRate;
      } else if (cardFormat?.toUpperCase() === 'E_CODE' && rate.ecodeRate) {
        applicableRate = rate.ecodeRate;
      } else {
        applicableRate = rate.rate; // Fallback to general rate
      }

      // Validate card value is within allowed range
      if (cardValue < rate.minAmount || cardValue > rate.maxAmount) {
        return {
          success: false,
          error: `Card value must be between $${rate.minAmount} and $${rate.maxAmount}`
        };
      }

      const amountToReceive = parseFloat((cardValue * applicableRate).toFixed(2));

      return {
        success: true,
        data: {
          cardValue: parseFloat(cardValue),
          rate: applicableRate,
          rateDisplay: `₦${applicableRate}/$1`,
          amountToReceive,
          sourceCurrency: 'USD',
          targetCurrency: 'NGN',
          minAmount: rate.minAmount,
          maxAmount: rate.maxAmount
        }
      };

    } catch (error) {
      console.error('Error calculating expected amount:', error);
      return { 
        success: false, 
        error: error?.message || 'Failed to calculate expected amount' 
      };
    }
  }
};