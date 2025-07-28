// hooks/useElectricity.js
import { useState, useCallback } from 'react';
import { electricityService } from '../services/electricityService';

/**
 * Custom hook for electricity purchases
 * Provides state management and electricity service methods
 */
export const useElectricity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [meterTypes, setMeterTypes] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedMeterType, setSelectedMeterType] = useState(null);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Purchase electricity
   * @param {Object} purchaseData - Electricity purchase details
   * @returns {Promise<Object>} Purchase result
   */
  const purchaseElectricity = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate purchase data first
      const validation = electricityService.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        const result = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.errors[0],
          errors: validation.errors
        };
        setError(result.error);
        return result;
      }

      const result = await electricityService.purchaseElectricity(purchaseData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Electricity purchase hook error:', err);
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
   * Get available electricity providers
   * @returns {Array} Electricity providers
   */
  const getElectricityProviders = useCallback(() => {
    const providersList = electricityService.getElectricityProviders();
    setProviders(providersList);
    return providersList;
  }, []);

  /**
   * Get available meter types
   * @returns {Array} Meter types
   */
  const getMeterTypes = useCallback(() => {
    const meterTypesList = electricityService.getMeterTypes();
    setMeterTypes(meterTypesList);
    return meterTypesList;
  }, []);

  /**
   * Select an electricity provider
   * @param {Object} provider - Selected provider
   */
  const selectProvider = useCallback((provider) => {
    setSelectedProvider(provider);
  }, []);

  /**
   * Clear selected provider
   */
  const clearSelectedProvider = useCallback(() => {
    setSelectedProvider(null);
  }, []);

  /**
   * Select a meter type
   * @param {Object} meterType - Selected meter type
   */
  const selectMeterType = useCallback((meterType) => {
    setSelectedMeterType(meterType);
  }, []);

  /**
   * Clear selected meter type
   */
  const clearSelectedMeterType = useCallback(() => {
    setSelectedMeterType(null);
  }, []);

  /**
   * Validate meter number format
   * @param {string} meterNumber - Meter number to validate
   * @returns {boolean} True if valid meter number
   */
  const validateMeterNumber = useCallback((meterNumber) => {
    return electricityService.validateMeterNumber(meterNumber);
  }, []);

  /**
   * Format meter number for display
   * @param {string} meterNumber - Meter number to format
   * @returns {string} Formatted meter number
   */
  const formatMeterNumber = useCallback((meterNumber) => {
    return electricityService.formatMeterNumber(meterNumber);
  }, []);

  /**
   * Get provider display name
   * @param {string} providerId - Provider identifier
   * @returns {string} Provider display name
   */
  const getProviderDisplayName = useCallback((providerId) => {
    return electricityService.getProviderDisplayName(providerId);
  }, []);

  /**
   * Get provider region
   * @param {string} providerId - Provider identifier
   * @returns {string} Provider region
   */
  const getProviderRegion = useCallback((providerId) => {
    return electricityService.getProviderRegion(providerId);
  }, []);

  /**
   * Get meter type display name
   * @param {string} meterTypeId - Meter type identifier
   * @returns {string} Meter type display name
   */
  const getMeterTypeDisplayName = useCallback((meterTypeId) => {
    return electricityService.getMeterTypeDisplayName(meterTypeId);
  }, []);

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount with currency
   */
  const formatAmount = useCallback((amount) => {
    return electricityService.formatAmount(amount);
  }, []);

  /**
   * Get electricity purchase limits
   * @returns {Object} Purchase limits
   */
  const getPurchaseLimits = useCallback(() => {
    return electricityService.getPurchaseLimits();
  }, []);

  /**
   * Get popular electricity amounts
   * @returns {Array} Popular electricity amounts
   */
  const getPopularAmounts = useCallback(() => {
    return electricityService.getPopularAmounts();
  }, []);

  /**
   * Format electricity units for display
   * @param {string|number} units - Electricity units
   * @returns {string} Formatted units
   */
  const formatElectricityUnits = useCallback((units) => {
    return electricityService.formatElectricityUnits(units);
  }, []);

  /**
   * Format electricity token for display
   * @param {string} token - Electricity token
   * @returns {string} Formatted token
   */
  const formatElectricityToken = useCallback((token) => {
    return electricityService.formatElectricityToken(token);
  }, []);

  /**
   * Get error action based on error type
   * @param {string} requiresAction - Required action type
   * @returns {Object|null} Error action object
   */
  const getErrorAction = useCallback((requiresAction) => {
    const errorActions = {
      'RETRY_2FA': {
        title: 'Invalid 2FA Code',
        message: 'The two-factor authentication code you entered is invalid. Please check your authenticator app and try again.',
        actionText: 'Retry 2FA',
        priority: 'high'
      },
      'RETRY_PIN': {
        title: 'Invalid Password PIN',
        message: 'The password PIN you entered is incorrect. Please check and try again.',
        actionText: 'Retry PIN',
        priority: 'high'
      },
      'UPGRADE_KYC': {
        title: 'KYC Limit Exceeded',
        message: 'This transaction exceeds your current KYC limits. Please upgrade your verification level to continue.',
        actionText: 'Upgrade KYC',
        route: '/kyc/upgrade',
        priority: 'high'
      },
      'ADD_FUNDS': {
        title: 'Insufficient Balance',
        message: 'You don\'t have enough NGNB balance for this purchase. Please top up your wallet.',
        actionText: 'Add Funds',
        route: '/wallet/deposit',
        priority: 'high'
      },
      'CHECK_METER': {
        title: 'Invalid Meter Number',
        message: 'The meter/account number you entered is invalid. Please check and try again.',
        actionText: 'Check Meter Number',
        priority: 'medium'
      },
      'SELECT_PROVIDER': {
        title: 'Select Provider',
        message: 'Please select a valid electricity provider to continue.',
        actionText: 'Select Provider',
        priority: 'medium'
      },
      'SELECT_METER_TYPE': {
        title: 'Select Meter Type',
        message: 'Please select whether your meter is Prepaid or Postpaid.',
        actionText: 'Select Meter Type',
        priority: 'medium'
      },
      'INCREASE_AMOUNT': {
        title: 'Amount Too Low',
        message: 'Minimum electricity purchase amount is ₦1,000. Please increase your amount.',
        actionText: 'Increase Amount',
        priority: 'medium'
      },
      'REDUCE_AMOUNT': {
        title: 'Amount Too High',
        message: 'Maximum electricity purchase amount is ₦100,000. Please reduce your amount.',
        actionText: 'Reduce Amount',
        priority: 'medium'
      },
      'WAIT_PENDING': {
        title: 'Pending Transaction',
        message: 'You have a pending electricity transaction. Please wait a few minutes before trying again.',
        actionText: 'Try Again Later',
        priority: 'medium'
      },
      'FIX_INPUT': {
        title: 'Invalid Details',
        message: 'Please check your meter number, provider selection, and amount, then try again.',
        actionText: 'Check Details',
        priority: 'medium'
      },
      'SETUP_2FA': {
        title: '2FA Setup Required',
        message: 'Two-factor authentication is required for transactions. Please set it up in your security settings.',
        actionText: 'Setup 2FA',
        route: '/security/2fa',
        priority: 'high'
      },
      'SETUP_PIN': {
        title: 'PIN Setup Required',
        message: 'A password PIN is required for transactions. Please set it up in your security settings.',
        actionText: 'Setup PIN',
        route: '/security/pin',
        priority: 'high'
      },
      'CONTACT_SUPPORT': {
        title: 'Service Issue',
        message: 'There\'s an issue with the electricity service. Please contact support for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      },
      'RETRY_LATER': {
        title: 'Service Unavailable',
        message: 'The electricity service is temporarily unavailable. Please try again later.',
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
    return electricityService.getUserFriendlyMessage(errorCode, originalMessage);
  }, []);

  /**
   * Validate purchase amount
   * @param {number} amount - Amount to validate
   * @returns {Object} Validation result
   */
  const validatePurchaseAmount = useCallback((amount) => {
    const limits = getPurchaseLimits();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        isValid: false,
        error: 'INVALID_AMOUNT',
        message: 'Please enter a valid amount'
      };
    }
    
    if (numAmount < limits.minimum) {
      return {
        isValid: false,
        error: 'AMOUNT_TOO_LOW',
        message: `Minimum amount is ${limits.formattedMinimum}`
      };
    }
    
    if (numAmount > limits.maximum) {
      return {
        isValid: false,
        error: 'AMOUNT_TOO_HIGH',
        message: `Maximum amount is ${limits.formattedMaximum}`
      };
    }
    
    return {
      isValid: true,
      amount: numAmount
    };
  }, [getPurchaseLimits]);

  /**
   * Check if provider is selected
   * @returns {boolean} True if provider is selected
   */
  const hasSelectedProvider = useCallback(() => {
    return !!selectedProvider;
  }, [selectedProvider]);

  /**
   * Check if meter type is selected
   * @returns {boolean} True if meter type is selected
   */
  const hasSelectedMeterType = useCallback(() => {
    return !!selectedMeterType;
  }, [selectedMeterType]);

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {Object|null} Provider object
   */
  const getProviderById = useCallback((providerId) => {
    return providers.find(p => p.id === providerId) || null;
  }, [providers]);

  /**
   * Get meter type by ID
   * @param {string} meterTypeId - Meter type ID
   * @returns {Object|null} Meter type object
   */
  const getMeterTypeById = useCallback((meterTypeId) => {
    return meterTypes.find(t => t.id === meterTypeId) || null;
  }, [meterTypes]);

  /**
   * Reset all selections
   */
  const resetSelections = useCallback(() => {
    setSelectedProvider(null);
    setSelectedMeterType(null);
    setError(null);
  }, []);

  /**
   * Initialize providers and meter types
   */
  const initialize = useCallback(() => {
    getElectricityProviders();
    getMeterTypes();
  }, [getElectricityProviders, getMeterTypes]);

  /**
   * Check if all required selections are made
   * @param {string} meterNumber - Meter number
   * @param {number} amount - Purchase amount
   * @returns {boolean} True if all selections are valid
   */
  const isFormComplete = useCallback((meterNumber, amount) => {
    return !!(
      selectedProvider &&
      selectedMeterType &&
      validateMeterNumber(meterNumber) &&
      validatePurchaseAmount(amount).isValid
    );
  }, [selectedProvider, selectedMeterType, validateMeterNumber, validatePurchaseAmount]);

  return {
    // State
    loading,
    error,
    providers,
    meterTypes,
    selectedProvider,
    selectedMeterType,

    // Actions
    purchaseElectricity,
    getElectricityProviders,
    getMeterTypes,
    selectProvider,
    clearSelectedProvider,
    selectMeterType,
    clearSelectedMeterType,
    clearErrors,
    resetSelections,
    initialize,

    // Utilities
    validateMeterNumber,
    formatMeterNumber,
    getProviderDisplayName,
    getProviderRegion,
    getMeterTypeDisplayName,
    formatAmount,
    getPurchaseLimits,
    getPopularAmounts,
    formatElectricityUnits,
    formatElectricityToken,
    validatePurchaseAmount,

    // State checks
    hasSelectedProvider,
    hasSelectedMeterType,
    getProviderById,
    getMeterTypeById,
    isFormComplete,

    // Error handling
    getErrorAction,
    getUserFriendlyMessage
  };
};