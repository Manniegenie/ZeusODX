// services/giftcardCountriesService.js

import { apiClient } from './apiClient';

const ENDPOINT = '/giftcardcountry';

/**
 * Normalize card type to match API expectations
 */
function normalizeCardType(cardType) {
  if (!cardType) return '';
  return cardType.toString().trim().toUpperCase();
}

/**
 * Extract and normalize API response
 */
function extractApiResponse(apiResponse) {
  if (!apiResponse) {
    return { success: false, message: 'Empty response', data: null };
  }

  // Handle Axios response wrapper
  if (apiResponse.data && typeof apiResponse.data === 'object') {
    const actualResponse = apiResponse.data;
    
    // Standard API structure: { success: boolean, data: {...}, message: string }
    if (typeof actualResponse.success === 'boolean') {
      return {
        success: actualResponse.success,
        data: actualResponse.data || null,
        message: actualResponse.message || ''
      };
    }
  }

  // Fallback: if response is already in expected format
  if (typeof apiResponse.success === 'boolean') {
    return {
      success: apiResponse.success,
      data: apiResponse.data || null,
      message: apiResponse.message || ''
    };
  }

  // Last resort: treat whole response as data
  return {
    success: false,
    message: 'Unknown response format',
    data: apiResponse
  };
}

/**
 * Normalize country data for consistent UI consumption
 */
function normalizeCountryData(data) {
  if (!data || !Array.isArray(data.countries)) {
    return {
      cardType: '',
      cardTypeDisplay: '',
      totalCountries: 0,
      countries: []
    };
  }

  return {
    cardType: data.cardType || '',
    cardTypeDisplay: data.cardTypeDisplay || data.cardType || '',
    totalCountries: data.totalCountries || data.countries.length,
    countries: data.countries.map(country => ({
      code: country.code || '',
      name: country.name || country.code || '',
      rate: typeof country.rate === 'number' ? country.rate : 0,
      rateDisplay: country.rateDisplay || `${country.rate}/USD`,
      sourceCurrency: country.sourceCurrency || 'USD'
    }))
  };
}

/**
 * Gift Card Countries Service
 */
export const giftcardCountriesService = {
  /**
   * Fetch available countries for a specific gift card type
   * @param {string} cardType - The gift card type (e.g., 'AMAZON', 'APPLE')
   * @returns {Promise<{success: boolean, data: Object|null, message: string}>}
   */
  async getCountriesForCard(cardType) {
    if (!cardType) {
      return {
        success: false,
        message: 'Card type is required',
        data: null
      };
    }

    const normalizedCardType = normalizeCardType(cardType);
    
    try {
      const apiResponse = await apiClient.get(`${ENDPOINT}/${normalizedCardType}/countries`);
      const response = extractApiResponse(apiResponse);

      if (response.success && response.data) {
        const normalizedData = normalizeCountryData(response.data);
        return {
          success: true,
          data: normalizedData,
          message: response.message
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to fetch countries for gift card',
        data: null
      };
    } catch (error) {
      console.error('Countries API Error:', error);
      
      // Extract error message from various possible locations
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch available countries';
      
      return {
        success: false,
        message: errorMessage,
        data: null
      };
    }
  },

  /**
   * Get all supported card types (for reference)
   */
  getSupportedCardTypes() {
    return [
      'APPLE', 'STEAM', 'NORDSTROM', 'MACY', 'NIKE', 'GOOGLE_PLAY',
      'AMAZON', 'VISA', 'RAZOR_GOLD', 'AMERICAN_EXPRESS', 'SEPHORA',
      'FOOTLOCKER', 'XBOX', 'EBAY'
    ];
  },

  /**
   * Validate if a card type is supported
   */
  isValidCardType(cardType) {
    const normalizedType = normalizeCardType(cardType);
    return this.getSupportedCardTypes().includes(normalizedType);
  }
};