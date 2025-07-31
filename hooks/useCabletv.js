// hooks/useCableTV.js
import { useState, useCallback } from 'react';
import { cableTVService } from '../services/cabletvService';

/**
 * Custom hook for cable TV purchases
 * Provides state management and cable TV service methods
 */
export const useCableTV = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Purchase cable TV subscription
   * @param {Object} purchaseData - Cable TV purchase details
   * @returns {Promise<Object>} Purchase result
   */
  const purchaseCableTV = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate purchase data first
      const validation = cableTVService.validatePurchaseData(purchaseData);
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

      const result = await cableTVService.purchaseCableTV(purchaseData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Cable TV purchase hook error:', err);
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
   * Get available cable TV providers
   * @returns {Array} Cable TV providers
   */
  const getCableTVProviders = useCallback(() => {
    const providersList = cableTVService.getCableTVProviders();
    setProviders(providersList);
    return providersList;
  }, []);

  /**
   * Get available subscription types
   * @returns {Array} Subscription types
   */
  const getSubscriptionTypes = useCallback(() => {
    const subscriptionTypesList = cableTVService.getSubscriptionTypes();
    setSubscriptionTypes(subscriptionTypesList);
    return subscriptionTypesList;
  }, []);

  /**
   * Select a cable TV provider
   * @param {Object} provider - Selected provider
   */
  const selectProvider = useCallback((provider) => {
    setSelectedProvider(provider);
    // Clear package selection when provider changes
    setSelectedPackage(null);
  }, []);

  /**
   * Clear selected provider
   */
  const clearSelectedProvider = useCallback(() => {
    setSelectedProvider(null);
    setSelectedPackage(null);
  }, []);

  /**
   * Select a subscription type
   * @param {Object} subscriptionType - Selected subscription type
   */
  const selectSubscriptionType = useCallback((subscriptionType) => {
    setSelectedSubscriptionType(subscriptionType);
  }, []);

  /**
   * Clear selected subscription type
   */
  const clearSelectedSubscriptionType = useCallback(() => {
    setSelectedSubscriptionType(null);
  }, []);

  /**
   * Select a package/bouquet
   * @param {Object} package - Selected package
   */
  const selectPackage = useCallback((packageData) => {
    setSelectedPackage(packageData);
  }, []);

  /**
   * Clear selected package
   */
  const clearSelectedPackage = useCallback(() => {
    setSelectedPackage(null);
  }, []);

  /**
   * Validate customer ID format
   * @param {string} customerId - Customer ID to validate
   * @returns {boolean} True if valid customer ID
   */
  const validateCustomerId = useCallback((customerId) => {
    return cableTVService.validateCustomerId(customerId);
  }, []);

  /**
   * Format customer ID for display
   * @param {string} customerId - Customer ID to format
   * @returns {string} Formatted customer ID
   */
  const formatCustomerId = useCallback((customerId) => {
    return cableTVService.formatCustomerId(customerId);
  }, []);

  /**
   * Get provider display name
   * @param {string} providerId - Provider identifier
   * @returns {string} Provider display name
   */
  const getProviderDisplayName = useCallback((providerId) => {
    return cableTVService.getProviderDisplayName(providerId);
  }, []);

  /**
   * Get provider description
   * @param {string} providerId - Provider identifier
   * @returns {string} Provider description
   */
  const getProviderDescription = useCallback((providerId) => {
    return cableTVService.getProviderDescription(providerId);
  }, []);

  /**
   * Get subscription type display name
   * @param {string} subscriptionTypeId - Subscription type identifier
   * @returns {string} Subscription type display name
   */
  const getSubscriptionTypeDisplayName = useCallback((subscriptionTypeId) => {
    return cableTVService.getSubscriptionTypeDisplayName(subscriptionTypeId);
  }, []);

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount with currency
   */
  const formatAmount = useCallback((amount) => {
    return cableTVService.formatAmount(amount);
  }, []);

  /**
   * Get cable TV purchase limits
   * @returns {Object} Purchase limits
   */
  const getPurchaseLimits = useCallback(() => {
    return cableTVService.getPurchaseLimits();
  }, []);

  /**
   * Get popular cable TV amounts
   * @returns {Array} Popular cable TV amounts
   */
  const getPopularAmounts = useCallback(() => {
    return cableTVService.getPopularAmounts();
  }, []);

  /**
   * Format customer name for display
   * @param {string} customerName - Customer name
   * @returns {string} Formatted customer name
   */
  const formatCustomerName = useCallback((customerName) => {
    return cableTVService.formatCustomerName(customerName);
  }, []);

  /**
   * Get provider icon
   * @param {string} providerId - Provider identifier
   * @returns {string} Provider icon name
   */
  const getProviderIcon = useCallback((providerId) => {
    return cableTVService.getProviderIcon(providerId);
  }, []);

  /**
   * Check if provider supports packages
   * @param {string} providerId - Provider identifier
   * @returns {boolean} True if provider supports packages
   */
  const providerSupportsPackages = useCallback((providerId) => {
    return cableTVService.providerSupportsPackages(providerId);
  }, []);

  /**
   * Get default subscription type
   * @returns {string} Default subscription type
   */
  const getDefaultSubscriptionType = useCallback(() => {
    return cableTVService.getDefaultSubscriptionType();
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
        message: 'You don\'t have enough NGNZ balance for this purchase. Please top up your wallet.',
        actionText: 'Add Funds',
        route: '/wallet/deposit',
        priority: 'high'
      },
      'CHECK_CUSTOMER_ID': {
        title: 'Invalid Smartcard/IUC Number',
        message: 'The smartcard/IUC number you entered is invalid. Please check and try again.',
        actionText: 'Check Customer ID',
        priority: 'medium'
      },
      'SELECT_PROVIDER': {
        title: 'Select Provider',
        message: 'Please select a valid cable TV provider to continue.',
        actionText: 'Select Provider',
        priority: 'medium'
      },
      'SELECT_PACKAGE': {
        title: 'Select Package',
        message: 'Please select a package/bouquet to continue.',
        actionText: 'Select Package',
        priority: 'medium'
      },
      'INCREASE_AMOUNT': {
        title: 'Amount Too Low',
        message: 'Minimum cable TV purchase amount is ₦500. Please increase your amount.',
        actionText: 'Increase Amount',
        priority: 'medium'
      },
      'REDUCE_AMOUNT': {
        title: 'Amount Too High',
        message: 'Maximum cable TV purchase amount is ₦50,000. Please reduce your amount.',
        actionText: 'Reduce Amount',
        priority: 'medium'
      },
      'VERIFY_AMOUNT': {
        title: 'Amount Mismatch',
        message: 'The amount doesn\'t match the selected package price. Please verify the amount.',
        actionText: 'Verify Amount',
        priority: 'high'
      },
      'WAIT_PENDING': {
        title: 'Pending Transaction',
        message: 'You have a pending cable TV transaction. Please wait a few minutes before trying again.',
        actionText: 'Try Again Later',
        priority: 'medium'
      },
      'FIX_INPUT': {
        title: 'Invalid Details',
        message: 'Please check your smartcard/IUC number, provider selection, package, and amount, then try again.',
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
        message: 'There\'s an issue with the cable TV service. Please contact support for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      },
      'RETRY_LATER': {
        title: 'Service Unavailable',
        message: 'The cable TV service is temporarily unavailable. Please try again later.',
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
    return cableTVService.getUserFriendlyMessage(errorCode, originalMessage);
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
   * Check if subscription type is selected
   * @returns {boolean} True if subscription type is selected
   */
  const hasSelectedSubscriptionType = useCallback(() => {
    return !!selectedSubscriptionType;
  }, [selectedSubscriptionType]);

  /**
   * Check if package is selected
   * @returns {boolean} True if package is selected
   */
  const hasSelectedPackage = useCallback(() => {
    return !!selectedPackage;
  }, [selectedPackage]);

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {Object|null} Provider object
   */
  const getProviderById = useCallback((providerId) => {
    return providers.find(p => p.id === providerId) || null;
  }, [providers]);

  /**
   * Get subscription type by ID
   * @param {string} subscriptionTypeId - Subscription type ID
   * @returns {Object|null} Subscription type object
   */
  const getSubscriptionTypeById = useCallback((subscriptionTypeId) => {
    return subscriptionTypes.find(t => t.id === subscriptionTypeId) || null;
  }, [subscriptionTypes]);

  /**
   * Reset all selections
   */
  const resetSelections = useCallback(() => {
    setSelectedProvider(null);
    setSelectedSubscriptionType(null);
    setSelectedPackage(null);
    setError(null);
  }, []);

  /**
   * Initialize providers and subscription types
   */
  const initialize = useCallback(() => {
    getCableTVProviders();
    getSubscriptionTypes();
    // Set default subscription type
    const defaultType = getSubscriptionTypes().find(t => t.id === getDefaultSubscriptionType());
    if (defaultType) {
      setSelectedSubscriptionType(defaultType);
    }
  }, [getCableTVProviders, getSubscriptionTypes, getDefaultSubscriptionType]);

  /**
   * Check if all required selections are made
   * @param {string} customerId - Customer ID
   * @param {number} amount - Purchase amount
   * @returns {boolean} True if all selections are valid
   */
  const isFormComplete = useCallback((customerId, amount) => {
    return !!(
      selectedProvider &&
      selectedSubscriptionType &&
      selectedPackage &&
      validateCustomerId(customerId) &&
      validatePurchaseAmount(amount).isValid
    );
  }, [selectedProvider, selectedSubscriptionType, selectedPackage, validateCustomerId, validatePurchaseAmount]);

  /**
   * Validate form for basic completion (without package for initial validation)
   * @param {string} customerId - Customer ID
   * @returns {boolean} True if basic form is valid
   */
  const isBasicFormValid = useCallback((customerId) => {
    return !!(
      selectedProvider &&
      selectedSubscriptionType &&
      validateCustomerId(customerId)
    );
  }, [selectedProvider, selectedSubscriptionType, validateCustomerId]);

  /**
   * Get purchase summary
   * @param {string} customerId - Customer ID
   * @param {number} amount - Purchase amount
   * @returns {Object} Purchase summary
   */
  const getPurchaseSummary = useCallback((customerId, amount) => {
    return {
      provider: selectedProvider,
      subscriptionType: selectedSubscriptionType,
      package: selectedPackage,
      customerId: customerId,
      amount: amount,
      formattedAmount: formatAmount(amount),
      isValid: isFormComplete(customerId, amount)
    };
  }, [selectedProvider, selectedSubscriptionType, selectedPackage, formatAmount, isFormComplete]);

  return {
    // State
    loading,
    error,
    providers,
    subscriptionTypes,
    selectedProvider,
    selectedSubscriptionType,
    selectedPackage,

    // Actions
    purchaseCableTV,
    getCableTVProviders,
    getSubscriptionTypes,
    selectProvider,
    clearSelectedProvider,
    selectSubscriptionType,
    clearSelectedSubscriptionType,
    selectPackage,
    clearSelectedPackage,
    clearErrors,
    resetSelections,
    initialize,

    // Utilities
    validateCustomerId,
    formatCustomerId,
    getProviderDisplayName,
    getProviderDescription,
    getSubscriptionTypeDisplayName,
    formatAmount,
    getPurchaseLimits,
    getPopularAmounts,
    formatCustomerName,
    getProviderIcon,
    providerSupportsPackages,
    getDefaultSubscriptionType,
    validatePurchaseAmount,

    // State checks
    hasSelectedProvider,
    hasSelectedSubscriptionType,
    hasSelectedPackage,
    getProviderById,
    getSubscriptionTypeById,
    isFormComplete,
    isBasicFormValid,
    getPurchaseSummary,

    // Error handling
    getErrorAction,
    getUserFriendlyMessage
  };
};