// services/twoFAService.js
import { apiClient } from './apiClient';

export const twoFAService = {
  /**
   * Generate 2FA secret and QR code
   * @returns {Promise<Object>} Setup response with QR code and secret
   */
  async setup2FA() {
    try {
      console.log('🔐 Starting 2FA setup...');

      const response = await apiClient.get('/2FA/setup-2fa');

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ 2FA setup successful:', {
          hasQrCode: !!response.data.qrCodeDataURL,
          hasManualKey: !!response.data.manualEntryKey
        });

        return {
          success: true,
          data: {
            secretKey: response.data.manualEntryKey,
            qrCode: response.data.qrCodeDataURL ? {
              dataUrl: response.data.qrCodeDataURL,
              format: 'png',
              type: 'qr'
            } : null,
            isEnabled: false,
            message: response.data.message || '2FA setup initiated successfully'
          }
        };
      } 
      
      // Handle error response
      else {
        const backendMessage = response.error || '2FA setup failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ 2FA setup failed:', {
          backend_message: backendMessage,
          error_code: errorCode,
          requires_action: requiresAction,
          status: statusCode
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          status: statusCode,
          requiresAction: requiresAction
        };
      }

    } catch (error) {
      console.error('❌ 2FA setup network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  /**
   * Verify 2FA token and enable 2FA
   * @param {Object} verificationData - Verification data
   * @param {string} verificationData.token - 6-digit 2FA token
   * @returns {Promise<Object>} Verification response
   */
  async verify2FA(verificationData) {
    try {
      console.log('🔐 Starting 2FA verification...');

      const response = await apiClient.post('/2FA/verify-2fa', {
        token: verificationData.token
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ 2FA verification successful:', {
          verified: response.data.verified,
          enabled: response.data.verified
        });

        return {
          success: true,
          data: {
            verified: response.data.verified,
            isEnabled: response.data.verified,
            message: response.data.message || '2FA enabled successfully'
          }
        };
      } 
      
      // Handle error response
      else {
        const backendMessage = response.error || '2FA verification failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ 2FA verification failed:', {
          backend_message: backendMessage,
          error_code: errorCode,
          requires_action: requiresAction,
          status: statusCode
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          status: statusCode,
          requiresAction: requiresAction
        };
      }

    } catch (error) {
      console.error('❌ 2FA verification network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  /**
   * Disable 2FA
   * @param {string} token - 6-digit 2FA code from authenticator app
   * @returns {Promise<Object>} Disable response
   */
  async disable2FA(token) {
    try {
      if (!token || typeof token !== 'string' || token.length !== 6) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Valid 6-digit 2FA code is required to disable 2FA'
        };
      }

      console.log('🔐 Starting 2FA disable with verification...');

      const response = await apiClient.post('/2FA/disable-2fa', { token });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ 2FA disabled successfully');

        return {
          success: true,
          data: {
            isEnabled: false,
            message: response.data.message || '2FA disabled successfully'
          }
        };
      } 
      
      // Handle error response
      else {
        const backendMessage = response.error || '2FA disable failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ 2FA disable failed:', {
          backend_message: backendMessage,
          error_code: errorCode,
          requires_action: requiresAction,
          status: statusCode
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          status: statusCode,
          requiresAction: requiresAction
        };
      }

    } catch (error) {
      console.error('❌ 2FA disable network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  /**
   * Get current 2FA status
   * @returns {Promise<Object>} Status response
   */
  async get2FAStatus() {
    try {
      console.log('🔐 Fetching 2FA status...');

      const response = await apiClient.get('/2fa-status');

      if (response.success && response.data) {
        console.log('✅ 2FA status fetched successfully:', {
          enabled: response.data.is2FAEnabled
        });

        return {
          success: true,
          data: {
            isEnabled: response.data.is2FAEnabled,
            hasSecret: response.data.hasSecret,
            message: 'Status retrieved successfully'
          }
        };
      } else {
        const backendMessage = response.error || 'Failed to get 2FA status';
        const errorCode = this.generateErrorCode(backendMessage);
        
        console.log('❌ Failed to fetch 2FA status:', {
          backend_message: backendMessage,
          error_code: errorCode
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage
        };
      }

    } catch (error) {
      console.error('❌ 2FA status fetch network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to check 2FA status. Please check your connection.'
      };
    }
  },

  /**
   * Generate standardized error code from backend error message
   * @param {string} errorMessage - Error message from backend
   * @returns {string} Standardized error code
   */
  generateErrorCode(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'SETUP_FAILED';
    }
    
    const message = errorMessage.toLowerCase().trim();
    
    // Token/verification related errors
    if (message.includes('invalid 2fa token') || 
        message.includes('invalid token') ||
        message.includes('token is invalid')) {
      return 'INVALID_2FA_TOKEN';
    }
    
    if (message.includes('token is required') || 
        message.includes('6-digit token') ||
        message.includes('valid token')) {
      return 'INVALID_TOKEN_FORMAT';
    }
    
    // Setup related errors
    if (message.includes('2fa not set up') || 
        message.includes('not set up') ||
        message.includes('secret not found')) {
      return 'SETUP_NOT_COMPLETED';
    }
    
    if (message.includes('already enabled') || 
        message.includes('2fa already active')) {
      return 'ALREADY_ENABLED';
    }
    
    if (message.includes('already disabled') || 
        message.includes('2fa not enabled')) {
      return 'ALREADY_DISABLED';
    }
    
    // User related errors
    if (message.includes('user not found') || 
        message.includes('invalid user')) {
      return 'USER_NOT_FOUND';
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || 
        message.includes('access denied') ||
        message.includes('authentication required')) {
      return 'UNAUTHORIZED';
    }
    
    // Rate limiting errors
    if (message.includes('too many attempts') || 
        message.includes('rate limit') ||
        message.includes('try again later')) {
      return 'RATE_LIMITED';
    }
    
    // Service related errors
    if (message.includes('internal server error') || 
        message.includes('service unavailable') ||
        message.includes('server error')) {
      return 'SERVICE_ERROR';
    }
    
    // Default fallback
    return 'SETUP_FAILED';
  },

  /**
   * Determine required user action based on error
   * @param {string} errorCode - Generated error code
   * @param {string} errorMessage - Original error message
   * @returns {string|null} Required action type
   */
  getRequiredAction(errorCode, errorMessage) {
    const actionMap = {
      'INVALID_2FA_TOKEN': 'RETRY_TOKEN',
      'INVALID_TOKEN_FORMAT': 'ENTER_VALID_TOKEN',
      'SETUP_NOT_COMPLETED': 'COMPLETE_SETUP',
      'ALREADY_ENABLED': 'GO_TO_SETTINGS',
      'ALREADY_DISABLED': 'SETUP_2FA',
      'USER_NOT_FOUND': 'LOGIN_AGAIN',
      'UNAUTHORIZED': 'LOGIN_AGAIN',
      'RATE_LIMITED': 'WAIT_AND_RETRY',
      'SERVICE_ERROR': 'RETRY_LATER'
    };

    return actionMap[errorCode] || null;
  },

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Generated error code
   * @param {string} originalMessage - Original backend message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorCode, originalMessage) {
    const friendlyMessages = {
      'INVALID_2FA_TOKEN': 'The verification code you entered is incorrect. Please check your authenticator app and try again.',
      'INVALID_TOKEN_FORMAT': 'Please enter a valid 6-digit verification code from your authenticator app.',
      'SETUP_NOT_COMPLETED': '2FA setup was not completed properly. Please start the setup process again.',
      'ALREADY_ENABLED': '2FA is already enabled on your account.',
      'ALREADY_DISABLED': '2FA is already disabled on your account.',
      'USER_NOT_FOUND': 'User account not found. Please log in again.',
      'UNAUTHORIZED': 'Authentication required. Please log in again.',
      'RATE_LIMITED': 'Too many attempts. Please wait a few minutes before trying again.',
      'SERVICE_ERROR': 'The 2FA service is temporarily unavailable. Please try again later.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'SETUP_FAILED': '2FA setup failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with 2FA. Please try again.');
  },

  /**
   * Validate 2FA token format
   * @param {string} token - Token to validate
   * @returns {Object} Validation result with errors array
   */
  validateToken(token) {
    const errors = [];

    if (!token || typeof token !== 'string') {
      errors.push('Verification code is required');
    } else {
      const cleanToken = token.trim();
      
      if (cleanToken.length === 0) {
        errors.push('Verification code is required');
      } else if (!/^\d{6}$/.test(cleanToken)) {
        errors.push('Verification code must be exactly 6 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Format token for display (with spaces)
   * @param {string} token - Token to format
   * @returns {string} Formatted token
   */
  formatToken(token) {
    if (!token) return '';
    
    const cleaned = token.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
  },

  /**
   * Clean token input (remove non-digits)
   * @param {string} token - Token to clean
   * @returns {string} Cleaned token
   */
  cleanToken(token) {
    if (!token) return '';
    return token.replace(/\D/g, '').slice(0, 6);
  },

  /**
   * Check if token is complete (6 digits)
   * @param {string} token - Token to check
   * @returns {boolean} True if token is complete
   */
  isTokenComplete(token) {
    if (!token) return false;
    const cleaned = this.cleanToken(token);
    return cleaned.length === 6;
  },

  /**
   * Get authenticator app recommendations
   * @returns {Array} Array of recommended authenticator apps
   */
  getRecommendedApps() {
    return [
      {
        id: 'google_auth',
        name: 'Google Authenticator',
        description: 'Free authenticator app by Google',
        platforms: ['iOS', 'Android'],
        downloadLinks: {
          ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
          android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
        }
      },
      {
        id: 'authy',
        name: 'Authy',
        description: 'Secure 2FA with cloud backup',
        platforms: ['iOS', 'Android', 'Desktop'],
        downloadLinks: {
          ios: 'https://apps.apple.com/app/authy/id494168017',
          android: 'https://play.google.com/store/apps/details?id=com.authy.authy'
        }
      },
      {
        id: 'microsoft_auth',
        name: 'Microsoft Authenticator',
        description: 'Free authenticator app by Microsoft',
        platforms: ['iOS', 'Android'],
        downloadLinks: {
          ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
          android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator'
        }
      }
    ];
  },

  /**
   * Get setup instructions
   * @returns {Array} Array of setup steps
   */
  getSetupInstructions() {
    return [
      {
        step: 1,
        title: 'Install an authenticator app',
        description: 'Download Google Authenticator, Authy, or Microsoft Authenticator from your app store',
        icon: 'download'
      },
      {
        step: 2,
        title: 'Scan the QR code',
        description: 'Open your authenticator app and scan the QR code displayed above',
        icon: 'qr-scan'
      },
      {
        step: 3,
        title: 'Enter verification code',
        description: 'Enter the 6-digit code from your authenticator app to complete setup',
        icon: 'verify'
      },
      {
        step: 4,
        title: 'Save backup codes',
        description: 'Store your backup codes in a safe place in case you lose access to your device',
        icon: 'backup'
      }
    ];
  }
};