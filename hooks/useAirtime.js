// hooks/useAirtime.js
import { useState, useCallback } from 'react';
import { airtimeService } from '../services/airtimeService';

export function useAirtime() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [purchaseResult, setPurchaseResult] = useState(null);

  /**
   * Purchase airtime
   * @param {Object} purchaseData - Airtime purchase data
   * @param {string} purchaseData.phone - Phone number
   * @param {string} purchaseData.service_id - Network provider (mtn, airtel, glo, 9mobile)
   * @param {number|string} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase result
   */
  const purchaseAirtime = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setPurchaseResult(null);

    try {
      console.log('🚀 useAirtime: Starting purchase flow...');

      // Client-side validation first
      const validation = airtimeService.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Please fix the validation errors',
          validationErrors: validation.errors
        };
      }

      // Call service (handles API communication and error parsing)
      const result = await airtimeService.purchaseAirtime(purchaseData);

      if (result.success) {
        setPurchaseResult(result.data);
        console.log('✅ useAirtime: Purchase completed successfully');

        return {
          success: true,
          data: result.data,
          message: result.data.message || 'Purchase completed successfully'
        };
      } else {
        // Handle structured error from service
        const userFriendlyMessage = airtimeService.getUserFriendlyMessage(result.error, result.message);
        setError(userFriendlyMessage);
        
        console.log('🚫 useAirtime: Purchase failed with structured error:', {
          error_code: result.error,
          user_message: userFriendlyMessage,
          requires_action: result.requiresAction
        });
        
        return {
          success: false,
          error: result.error,
          message: userFriendlyMessage,
          originalMessage: result.message,
          requiresAction: result.requiresAction,
          status: result.status
        };
      }

    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('❌ useAirtime: Unexpected error:', error.message);

      return {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate form data without purchasing
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  const validateForm = useCallback((formData) => {
    const validation = airtimeService.validatePurchaseData(formData);
    setValidationErrors(validation.errors);
    return validation;
  }, []);

  /**
   * Clear validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setValidationErrors([]);
    setPurchaseResult(null);
  }, []);

  /**
   * Check if a specific field has validation errors
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field has errors
   */
  const hasFieldError = useCallback((fieldName) => {
    return validationErrors.some(error => 
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  }, [validationErrors]);

  /**
   * Get validation errors for a specific field
   * @param {string} fieldName - Field name
   * @returns {string[]} Array of errors for the field
   */
  const getFieldErrors = useCallback((fieldName) => {
    return validationErrors.filter(error => 
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  }, [validationErrors]);

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  const formatPhoneNumber = useCallback((phone) => {
    return airtimeService.formatPhoneNumber(phone);
  }, []);

  /**
   * Get network display name
   * @param {string} serviceId - Service ID
   * @returns {string} Display name
   */
  const getNetworkDisplayName = useCallback((serviceId) => {
    return airtimeService.getNetworkDisplayName(serviceId);
  }, []);

  /**
   * Get error action configuration for UI
   * @param {string} requiresAction - Action required from service
   * @returns {Object|null} Action configuration
   */
  const getErrorAction = useCallback((requiresAction) => {
    const actionConfigs = {
      SETUP_2FA: {
        title: 'Set Up 2FA',
        message: 'Two-factor authentication is required for transactions. Please set it up in your security settings.',
        actionText: 'Set Up 2FA',
        route: '/settings/security',
        priority: 'high'
      },
      SETUP_PIN: {
        title: 'Set Up PIN',
        message: 'A password PIN is required for transactions. Please set it up in your security settings.',
        actionText: 'Set Up PIN',
        route: '/settings/security',
        priority: 'high'
      },
      RETRY_2FA: {
        title: 'Invalid 2FA Code',
        message: 'The 2FA code you entered is incorrect. Please check your authenticator app and try again.',
        actionText: 'Try Again',
        route: null,
        priority: 'medium'
      },
      RETRY_PIN: {
        title: 'Invalid PIN',
        message: 'The password PIN you entered is incorrect. Please try again.',
        actionText: 'Try Again',
        route: null,
        priority: 'medium'
      },
      UPGRADE_KYC: {
        title: 'Upgrade Account',
        message: 'This transaction exceeds your current account limits. Please upgrade your verification level.',
        actionText: 'Upgrade Now',
        route: '/settings/kyc',
        priority: 'high'
      },
      ADD_FUNDS: {
        title: 'Add Funds',
        message: 'You don\'t have enough balance for this transaction. Please add funds to your account.',
        actionText: 'Add Funds',
        route: '/wallet/deposit',
        priority: 'high'
      },
      WAIT_PENDING: {
        title: 'Transaction Pending',
        message: 'You have a pending airtime transaction. Please wait for it to complete.',
        actionText: 'View Transactions',
        route: '/transactions',
        priority: 'low'
      },
      FIX_INPUT: {
        title: 'Check Input',
        message: 'Please check your input and try again.',
        actionText: 'Try Again',
        route: null,
        priority: 'medium'
      },
      RETRY_LATER: {
        title: 'Service Unavailable',
        message: 'The airtime service is temporarily unavailable. Please try again later.',
        actionText: 'Try Again',
        route: null,
        priority: 'low'
      },
      CONTACT_SUPPORT: {
        title: 'Contact Support',
        message: 'There\'s an issue with the network provider. Please contact support for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      }
    };

    return actionConfigs[requiresAction] || null;
  }, []);

  /**
   * Check if purchase is in progress (processing status)
   * @returns {boolean} True if purchase is processing
   */
  const isProcessing = useCallback(() => {
    return purchaseResult?.status === 'processing-api' || 
           purchaseResult?.status === 'initiated-api';
  }, [purchaseResult]);

  /**
   * Check if purchase is completed
   * @returns {boolean} True if purchase is completed
   */
  const isCompleted = useCallback(() => {
    return purchaseResult?.status === 'completed-api';
  }, [purchaseResult]);

  /**
   * Get purchase status message
   * @returns {string|null} Status message
   */
  const getStatusMessage = useCallback(() => {
    if (!purchaseResult) return null;

    const statusMessages = {
      'completed-api': 'Airtime purchase completed successfully!',
      'processing-api': 'Your airtime purchase is being processed...',
      'initiated-api': 'Airtime purchase initiated, processing...',
      'failed': 'Airtime purchase failed. Please try again.',
      'refunded': 'Transaction was refunded to your account.'
    };

    return statusMessages[purchaseResult.status] || 
           purchaseResult.message || 
           'Purchase status unknown';
  }, [purchaseResult]);

  /**
   * Get comprehensive error info for UI display
   * @returns {Object|null} Error information
   */
  const getErrorInfo = useCallback(() => {
    if (!error && validationErrors.length === 0) return null;

    return {
      hasErrors: true,
      mainError: error,
      validationErrors: validationErrors,
      errorCount: validationErrors.length + (error ? 1 : 0),
      canRetry: !loading
    };
  }, [error, validationErrors, loading]);

  return {
    // State
    loading,
    error,
    validationErrors,
    purchaseResult,

    // Actions
    purchaseAirtime,
    validateForm,
    clearValidationErrors,
    clearErrors,
    reset,

    // Helpers
    hasFieldError,
    getFieldErrors,
    formatPhoneNumber,
    getNetworkDisplayName,
    getErrorAction,
    getErrorInfo,

    // Status checks
    isProcessing: isProcessing(),
    isCompleted: isCompleted(),
    getStatusMessage: getStatusMessage(),

    // Computed state
    hasErrors: !!(error || validationErrors.length > 0),
    isValid: validationErrors.length === 0,
    canPurchase: !loading && validationErrors.length === 0
  };
}