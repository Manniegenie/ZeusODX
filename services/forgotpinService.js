import { apiClient } from './apiClient'; // Ensure this path points to your ApiClient file

/**
 * Service for pin management:
 * * Uses the centralized apiClient to ensure correct BASE_URL (zeusadminxyz.online)
 * and automatic token handling.
 */

export const forgotPinService = {
  // FORGOT PIN FLOW: Initiate pin reset using phone number
  async initiate(phoneNumber) {
    if (!phoneNumber) {
      return { success: false, error: 'Phone number is required' };
    }
    
    console.log('🔔 forgotPinService: initiating pin reset for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
    
    // apiClient.post automatically handles JSON stringifying and response parsing
    return await apiClient.post('/forgot-pin/initiate', { phoneNumber });
  },

  // FORGOT PIN FLOW: Verify OTP sent to email
  async verifyOtp(otp, phoneNumber) {
    if (!otp || !phoneNumber) {
      return { success: false, error: 'OTP and phone number are required' };
    }
    
    console.log('🔎 forgotPinService: verifying OTP for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
    
    return await apiClient.post('/forgot-pin/verify-otp', { otp, phoneNumber });
  },

  // FORGOT PIN FLOW: Complete pin reset (after OTP verification)
  async resetPin({ phoneNumber, newPin, confirmPin }) {
    if (!phoneNumber || !newPin || !confirmPin) {
      return { success: false, error: 'All fields (phoneNumber, newPin, confirmPin) are required' };
    }
    
    console.log('🔐 forgotPinService: resetting pin for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
    
    return await apiClient.post('/forgot-pin/reset-pin', { 
      phoneNumber, 
      newPin, 
      confirmPin 
    });
  },

  // UPDATE PIN FLOW: Change existing pin (requires current pin)
  // Note: apiClient will automatically attach the Bearer token here
  async updatePin({ phoneNumber, currentPin, newPin, confirmPin }) {
    if (!phoneNumber || !currentPin || !newPin || !confirmPin) {
      return { 
        success: false, 
        error: 'All fields (phoneNumber, currentPin, newPin, confirmPin) are required' 
      };
    }
    
    console.log('🔄 forgotPinService: updating pin for phone:', phoneNumber.replace(/\d(?=\d{4})/g, '*'));
    
    return await apiClient.post('/forgot-pin/update-pin', { 
      phoneNumber, 
      currentPin, 
      newPin, 
      confirmPin 
    });
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