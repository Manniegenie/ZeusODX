// hooks/use2FA.js
import { useCallback, useState } from 'react';
import { twoFAService } from '../services/2faService';

/**
 * Custom hook for 2FA management
 * Provides state management and 2FA service methods
 */
export const use2FA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [twoFAData, setTwoFAData] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Generate 2FA secret and QR code
   * @returns {Promise<Object>} Setup result
   */
  const generate2FASecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFAService.setup2FA();
      
      if (result.success) {
        setTwoFAData(result.data);
        setIsEnabled(result.data.isEnabled);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Generate 2FA secret hook error:', err);
      const errorResult = {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        requiresAction: 'RETRY'
      };
      setError(errorResult.error);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify 2FA token and enable 2FA
   * @param {string} token - 6-digit verification token
   * @returns {Promise<Object>} Verification result
   */
  const verify2FAToken = useCallback(async (token) => {
    if (!token) {
      const result = {
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Verification code is required'
      };
      setError(result.error);
      return result;
    }

    // Validate token format first
    const validation = twoFAService.validateToken(token);
    if (!validation.isValid) {
      const result = {
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: validation.errors[0],
        errors: validation.errors
      };
      setError(result.error);
      return result;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFAService.verify2FA({ token });
      
      if (result.success) {
        setIsEnabled(result.data.isEnabled);
        // Update existing 2FA data
        setTwoFAData(prev => prev ? {
          ...prev,
          isEnabled: result.data.isEnabled
        } : result.data);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Verify 2FA token hook error:', err);
      const errorResult = {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        requiresAction: 'RETRY'
      };
      setError(errorResult.error);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disable 2FA
   * @param {string} token - 6-digit 2FA code from authenticator app
   * @returns {Promise<Object>} Disable result
   */
  const disable2FA = useCallback(async (token) => {
    if (!token || typeof token !== 'string' || token.length !== 6) {
      const errorResult = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid 6-digit 2FA code is required to disable 2FA',
        requiresAction: 'RETRY'
      };
      setError(errorResult.error);
      return errorResult;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFAService.disable2FA(token);
      
      if (result.success) {
        setIsEnabled(false);
        setTwoFAData(null); // Clear 2FA data when disabled
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Disable 2FA hook error:', err);
      const errorResult = {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        requiresAction: 'RETRY'
      };
      setError(errorResult.error);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get current 2FA status
   * @returns {Promise<Object>} Status result
   */
  const get2FAStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFAService.get2FAStatus();
      
      if (result.success) {
        setIsEnabled(result.data.isEnabled);
        // Don't override existing 2FA data, just update status
        if (twoFAData) {
          setTwoFAData(prev => ({
            ...prev,
            isEnabled: result.data.isEnabled
          }));
        }
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Get 2FA status hook error:', err);
      const errorResult = {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        requiresAction: 'RETRY'
      };
      setError(errorResult.error);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [twoFAData]);

  /**
   * Get cached 2FA data
   * @returns {Object|null} Cached 2FA data
   */
  const getCached2FAData = useCallback(() => {
    return twoFAData;
  }, [twoFAData]);

  /**
   * Check if 2FA is currently loading
   * @returns {boolean} True if any 2FA operation is in progress
   */
  const is2FALoading = useCallback(() => {
    return loading;
  }, [loading]);

  /**
   * Get current 2FA error
   * @returns {string|null} Current error code
   */
  const get2FAError = useCallback(() => {
    return error;
  }, [error]);

  /**
   * Clear 2FA data (useful when logging out)
   */
  const clear2FAData = useCallback(() => {
    setTwoFAData(null);
    setIsEnabled(false);
    setError(null);
  }, []);

  /**
   * Validate 2FA token format
   * @param {string} token - Token to validate
   * @returns {Object} Validation result
   */
  const validateToken = useCallback((token) => {
    return twoFAService.validateToken(token);
  }, []);

  /**
   * Format token for display
   * @param {string} token - Token to format
   * @returns {string} Formatted token
   */
  const formatToken = useCallback((token) => {
    return twoFAService.formatToken(token);
  }, []);

  /**
   * Clean token input
   * @param {string} token - Token to clean
   * @returns {string} Cleaned token
   */
  const cleanToken = useCallback((token) => {
    return twoFAService.cleanToken(token);
  }, []);

  /**
   * Check if token is complete
   * @param {string} token - Token to check
   * @returns {boolean} True if token is complete
   */
  const isTokenComplete = useCallback((token) => {
    return twoFAService.isTokenComplete(token);
  }, []);

  /**
   * Get error action based on error type
   * @param {string} requiresAction - Required action type
   * @returns {Object|null} Error action object
   */
  const getErrorAction = useCallback((requiresAction) => {
    const errorActions = {
      'RETRY_TOKEN': {
        title: 'Invalid Verification Code',
        message: 'The verification code you entered is incorrect. Please check your authenticator app and try again.',
        actionText: 'Try Again',
        priority: 'high'
      },
      'ENTER_VALID_TOKEN': {
        title: 'Invalid Code Format',
        message: 'Please enter a valid 6-digit verification code from your authenticator app.',
        actionText: 'Enter Code',
        priority: 'medium'
      },
      'COMPLETE_SETUP': {
        title: 'Setup Not Complete',
        message: '2FA setup was not completed properly. Please start the setup process again.',
        actionText: 'Restart Setup',
        priority: 'high'
      },
      'GO_TO_SETTINGS': {
        title: '2FA Already Enabled',
        message: '2FA is already enabled on your account. You can manage it in security settings.',
        actionText: 'Go to Settings',
        route: '/profile',
        priority: 'medium'
      },
      'SETUP_2FA': {
        title: '2FA Not Enabled',
        message: '2FA is not currently enabled on your account. Would you like to set it up?',
        actionText: 'Setup 2FA',
        priority: 'medium'
      },
      'LOGIN_AGAIN': {
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again to continue.',
        actionText: 'Login',
        route: '/auth/login',
        priority: 'high'
      },
      'WAIT_AND_RETRY': {
        title: 'Too Many Attempts',
        message: 'Too many verification attempts. Please wait a few minutes before trying again.',
        actionText: 'Wait & Retry',
        priority: 'medium'
      },
      'RETRY_LATER': {
        title: 'Service Unavailable',
        message: 'The 2FA service is temporarily unavailable. Please try again later.',
        actionText: 'Try Later',
        priority: 'medium'
      }
    };

    return errorActions[requiresAction] || null;
  }, []);

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} originalMessage - Original error message
   * @returns {string} User-friendly message
   */
  const getUserFriendlyMessage = useCallback((errorCode, originalMessage) => {
    return twoFAService.getUserFriendlyMessage(errorCode, originalMessage);
  }, []);

  /**
   * Get recommended authenticator apps
   * @returns {Array} Array of recommended apps
   */
  const getRecommendedApps = useCallback(() => {
    return twoFAService.getRecommendedApps();
  }, []);

  /**
   * Get setup instructions
   * @returns {Array} Array of setup steps
   */
  const getSetupInstructions = useCallback(() => {
    return twoFAService.getSetupInstructions();
  }, []);

  /**
   * Check if 2FA data is available
   * @returns {boolean} True if 2FA data is loaded
   */
  const has2FAData = useCallback(() => {
    return !!twoFAData;
  }, [twoFAData]);

  /**
   * Check if QR code is available
   * @returns {boolean} True if QR code is available
   */
  const hasQRCode = useCallback(() => {
    return !!(twoFAData?.qrCode?.dataUrl);
  }, [twoFAData]);

  /**
   * Get QR code data URL
   * @returns {string|null} QR code data URL
   */
  const getQRCodeURL = useCallback(() => {
    return twoFAData?.qrCode?.dataUrl || null;
  }, [twoFAData]);

  /**
   * Get secret key
   * @returns {string|null} Secret key
   */
  const getSecretKey = useCallback(() => {
    return twoFAData?.secretKey || null;
  }, [twoFAData]);

  /**
   * Check if 2FA is enabled
   * @returns {boolean} True if 2FA is enabled
   */
  const is2FAEnabled = useCallback(() => {
    return isEnabled;
  }, [isEnabled]);

  /**
   * Refresh 2FA data by fetching status
   * @returns {Promise<Object>} Refresh result
   */
  const refresh2FAData = useCallback(async () => {
    return await get2FAStatus();
  }, [get2FAStatus]);

  return {
    // State
    loading,
    error,
    twoFAData,
    isEnabled,

    // Core actions
    generate2FASecret,
    verify2FAToken,
    disable2FA,
    get2FAStatus,
    clearErrors,
    clear2FAData,
    refresh2FAData,

    // Data access utilities
    getCached2FAData,
    has2FAData,
    hasQRCode,
    getQRCodeURL,
    getSecretKey,
    is2FAEnabled,

    // Status checks
    is2FALoading,
    get2FAError,

    // Token utilities
    validateToken,
    formatToken,
    cleanToken,
    isTokenComplete,

    // Information utilities
    getRecommendedApps,
    getSetupInstructions,

    // Error handling utilities
    getErrorAction,
    getUserFriendlyMessage
  };
};