// services/forgotPinService.js

/**
 * Service for pin management:
 * FORGOT PIN FLOW (when user forgot their pin):
 * - POST /forgot-pin/initiate
 * - POST /forgot-pin/verify-otp
 * - POST /forgot-pin/reset-pin
 * 
 * UPDATE PIN FLOW (when user knows current pin):
 * - POST /forgot-pin/update-pin
 *
 * Each method returns: { success: boolean, data?: any, error?: string, status?: number }
 */

const BASE_URL = __DEV__ 
  ? 'https://zeusodx-web.onrender.com'
  : 'https://zeusodx-web.onrender.com';

// Helper function to make direct API calls without authentication
const makeApiCall = async (endpoint, body) => {
  try {
    console.log(`🌐 forgotPinService: calling ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error(`❌ forgotPinService: API Error ${response.status}:`, data);
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      return { 
        success: false, 
        error: errorMessage,
        status: response.status 
      };
    }

    console.log(`✅ forgotPinService: API Success ${endpoint}:`, data);
    return { success: true, data };
    
  } catch (error) {
    console.error(`❌ forgotPinService: Network Error ${endpoint}:`, error);
    return { 
      success: false, 
      error: error.message || 'Network request failed' 
    };
  }
};

export const forgotPinService = {
  // FORGOT PIN FLOW: Initiate pin reset using phone number
  async initiate(phoneNumber) {
    try {
      if (!phoneNumber) {
        return { success: false, error: 'Phone number is required' };
      }
      
      console.log('🔔 forgotPinService: initiating pin reset for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
      
      const result = await makeApiCall('/forgot-pin/initiate', { phoneNumber });
      return result;
      
    } catch (err) {
      console.error('❌ forgotPinService.initiate error', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  // FORGOT PIN FLOW: Verify OTP sent to email
  async verifyOtp(otp, phoneNumber) {
    try {
      if (!otp || !phoneNumber) {
        return { success: false, error: 'OTP and phone number are required' };
      }
      
      console.log('🔎 forgotPinService: verifying OTP for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
      
      const result = await makeApiCall('/forgot-pin/verify-otp', { otp, phoneNumber });
      return result;
      
    } catch (err) {
      console.error('❌ forgotPinService.verifyOtp error', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  // FORGOT PIN FLOW: Complete pin reset (after OTP verification)
  async resetPin({ phoneNumber, newPin, confirmPin }) {
    try {
      if (!phoneNumber || !newPin || !confirmPin) {
        return { success: false, error: 'All fields (phoneNumber, newPin, confirmPin) are required' };
      }
      
      console.log('🔐 forgotPinService: resetting pin for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
      
      const result = await makeApiCall('/forgot-pin/reset-pin', { 
        phoneNumber, 
        newPin, 
        confirmPin 
      });
      return result;
      
    } catch (err) {
      console.error('❌ forgotPinService.resetPin error', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  // UPDATE PIN FLOW: Change existing pin (requires current pin)
  async updatePin({ phoneNumber, currentPin, newPin, confirmPin }) {
    try {
      if (!phoneNumber || !currentPin || !newPin || !confirmPin) {
        return { 
          success: false, 
          error: 'All fields (phoneNumber, currentPin, newPin, confirmPin) are required' 
        };
      }
      
      console.log('🔄 forgotPinService: updating pin for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
      
      const result = await makeApiCall('/forgot-pin/update-pin', { 
        phoneNumber, 
        currentPin, 
        newPin, 
        confirmPin 
      });
      return result;
      
    } catch (err) {
      console.error('❌ forgotPinService.updatePin error', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  // DEPRECATED: Legacy method name for backward compatibility
  async changePin(params) {
    console.warn('⚠️ forgotPinService.changePin is deprecated, use resetPin instead');
    return this.resetPin(params);
  }
};

// Export individual methods for convenience
export const {
  initiate: initiatePinReset,
  verifyOtp: verifyPinResetOtp, 
  resetPin: completePinReset,
  updatePin: updateExistingPin
} = forgotPinService;