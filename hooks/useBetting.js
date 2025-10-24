// hooks/useBetting.js
import { useCallback, useState } from 'react';
import { bettingService } from '../services/bettingService';

export const useBetting = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Clear any existing errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fund betting account
   * @param {Object} fundingData - Betting funding data
   * @returns {Promise<Object>} Funding response
   */
  const fundBettingAccount = useCallback(async (fundingData) => {
    setLoading(true);
    clearErrors();

    try {
      console.log('🎰 useBetting: Starting betting account funding', {
        userId: fundingData.userId,
        provider: fundingData.service_id,
        amount: fundingData.amount
      });

      // Validate data before making request
      const validation = bettingService.validateFundingData(fundingData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        console.log('❌ useBetting: Validation failed:', validation.errors);
        
        setError(errorMessage);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: errorMessage,
          requiresAction: 'FIX_INPUT'
        };
      }

      // Make the service call
      const result = await bettingService.fundBettingAccount(fundingData);
      
      console.log('📊 useBetting: Service response:', {
        success: result.success,
        error: result.error,
        status: result.data?.status,
        orderId: result.data?.orderId
      });

      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ useBetting: Unexpected error:', error);
      
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate betting customer
   * @param {Object} validationData - Customer validation data
   * @returns {Promise<Object>} Validation response
   */
  const validateBettingCustomer = useCallback(async (validationData) => {
    setLoading(true);
    clearErrors();

    try {
      console.log('🎰 useBetting: Starting customer validation', {
        service: validationData.service,
        customerId: validationData.customerId
      });

      const result = await bettingService.validateBettingCustomer(validationData);
      
      console.log('📊 useBetting: Validation response:', {
        success: result.success,
        error: result.error,
        customerName: result.data?.customerName
      });

      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ useBetting: Validation error:', error);
      
      const errorMessage = 'An unexpected error occurred during validation. Please try again.';
      setError(errorMessage);
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get available betting providers from PayBeta API
   * @returns {Promise<Array>} Available betting providers
   */
  const getBettingProviders = useCallback(async () => {
    setLoading(true);
    clearErrors();

    try {
      console.log('🎰 useBetting: Fetching betting providers...');
      
      const providers = await bettingService.getBettingProviders();
      
      console.log('📊 useBetting: Providers fetched:', {
        providerCount: providers.length
      });

      return providers;
    } catch (error) {
      console.error('❌ useBetting: Providers fetch error:', error);
      
      const errorMessage = 'Failed to fetch betting providers. Please try again.';
      setError(errorMessage);
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get static betting providers (fallback)
   * @returns {Array} Static betting providers
   */
  const getStaticBettingProviders = useCallback(() => {
    return bettingService.getStaticBettingProviders();
  }, []);

  /**
   * Validate user ID format
   * @param {string} userId - User ID to validate
   * @returns {boolean} True if valid
   */
  const validateUserId = useCallback((userId) => {
    return bettingService.validateUserId(userId);
  }, []);

  /**
   * Format user ID for display
   * @param {string} userId - User ID to format
   * @returns {string} Formatted user ID
   */
  const formatUserId = useCallback((userId) => {
    return bettingService.formatUserId(userId);
  }, []);

  /**
   * Get provider display name
   * @param {string} providerId - Provider ID
   * @returns {string} Provider display name
   */
  const getProviderDisplayName = useCallback((providerId) => {
    return bettingService.getProviderDisplayName(providerId);
  }, []);

  /**
   * Get provider category
   * @param {string} providerId - Provider ID
   * @returns {string} Provider category
   */
  const getProviderCategory = useCallback((providerId) => {
    return bettingService.getProviderCategory(providerId);
  }, []);

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount
   */
  const formatAmount = useCallback((amount) => {
    return bettingService.formatAmount(amount);
  }, []);

  /**
   * Get betting funding limits
   * @returns {Object} Funding limits
   */
  const getFundingLimits = useCallback(() => {
    return bettingService.getFundingLimits();
  }, []);

  /**
   * Get popular betting amounts
   * @returns {Array} Popular amounts
   */
  const getPopularAmounts = useCallback(() => {
    return bettingService.getPopularAmounts();
  }, []);

  /**
   * Check if provider is valid
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if valid
   */
  const isValidProvider = useCallback((providerId) => {
    return bettingService.isValidProvider(providerId);
  }, []);

  /**
   * Get providers by category
   * @param {string} category - Category name
   * @returns {Array} Providers in category
   */
  const getProvidersByCategory = useCallback((category) => {
    return bettingService.getProvidersByCategory(category);
  }, []);

  /**
   * Format transaction status
   * @param {string} status - Status to format
   * @returns {Object} Formatted status info
   */
  const formatTransactionStatus = useCallback((status) => {
    return bettingService.formatTransactionStatus(status);
  }, []);

  /**
   * Generate transaction reference
   * @param {string} orderId - Order ID
   * @param {string} providerId - Provider ID
   * @returns {string} Transaction reference
   */
  const generateTransactionReference = useCallback((orderId, providerId) => {
    return bettingService.generateTransactionReference(orderId, providerId);
  }, []);

  /**
   * Get estimated funding time
   * @param {string} providerId - Provider ID
   * @returns {string} Estimated time
   */
  const getEstimatedFundingTime = useCallback((providerId) => {
    return bettingService.getEstimatedFundingTime(providerId);
  }, []);

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} originalMessage - Original message
   * @returns {string} User-friendly message
   */
  const getUserFriendlyMessage = useCallback((errorCode, originalMessage) => {
    return bettingService.getUserFriendlyMessage(errorCode, originalMessage);
  }, []);

  /**
   * Get error action based on error code
   * @param {string} requiresAction - Required action code
   * @returns {Object|null} Error action object
   */
  const getErrorAction = useCallback((requiresAction) => {
    if (!requiresAction) return null;

    const actionMap = {
      'SETUP_2FA': {
        title: '2FA Setup Required',
        message: 'Set up two-factor authentication to secure your betting transactions.',
        actionText: 'Set up 2FA',
        route: '/security/setup-2fa',
        priority: 'high'
      },
      'SETUP_PIN': {
        title: 'Password PIN Setup Required',
        message: 'Set up a password PIN to secure your betting transactions.',
        actionText: 'Set up PIN',
        route: '/security/setup-pin',
        priority: 'high'
      },
      'RETRY_2FA': {
        title: 'Invalid 2FA Code',
        message: 'The two-factor authentication code is incorrect. Please try again.',
        actionText: 'Retry 2FA',
        priority: 'medium'
      },
      'RETRY_PIN': {
        title: 'Invalid Password PIN',
        message: 'The password PIN is incorrect. Please try again.',
        actionText: 'Retry PIN',
        priority: 'medium'
      },
      'UPGRADE_KYC': {
        title: 'KYC Upgrade Required',
        message: 'Your verification level doesn\'t support this transaction amount.',
        actionText: 'Upgrade Verification',
        route: '/kyc/upgrade',
        priority: 'high'
      },
      'ADD_FUNDS': {
        title: 'Insufficient Balance',
        message: 'You don\'t have enough NGNZ balance for this transaction.',
        actionText: 'Add Funds',
        route: '/wallet/add-funds',
        priority: 'high'
      },
      'CHECK_USER_ID': {
        title: 'Invalid User ID',
        message: 'Please check your betting account User ID and try again.',
        actionText: 'Check User ID',
        priority: 'medium'
      },
      'SELECT_PROVIDER': {
        title: 'Select Betting Provider',
        message: 'Please select a valid betting provider.',
        actionText: 'Select Provider',
        priority: 'medium'
      },
      'INCREASE_AMOUNT': {
        title: 'Amount Too Low',
        message: 'Minimum betting funding amount is ₦1,000.',
        actionText: 'Increase Amount',
        priority: 'medium'
      },
      'REDUCE_AMOUNT': {
        title: 'Amount Too High',
        message: 'Maximum betting funding amount is ₦100,000.',
        actionText: 'Reduce Amount',
        priority: 'medium'
      },
      'WAIT_PENDING': {
        title: 'Pending Transaction',
        message: 'You have a pending betting transaction. Please wait for it to complete.',
        actionText: 'Check Status',
        route: '/transactions',
        priority: 'low'
      },
      'FIX_INPUT': {
        title: 'Check Your Input',
        message: 'Please review your information and try again.',
        actionText: 'Review Input',
        priority: 'medium'
      },
      'RETRY_LATER': {
        title: 'Service Unavailable',
        message: 'The betting service is temporarily unavailable. Please try again later.',
        actionText: 'Retry Later',
        priority: 'low'
      },
      'VERIFY_ACCOUNT': {
        title: 'Account Verification Required',
        message: 'Your betting account needs verification. Contact the provider.',
        actionText: 'Contact Support',
        priority: 'high'
      },
      'CONTACT_SUPPORT': {
        title: 'Contact Support',
        message: 'Please contact our support team for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      }
    };

    return actionMap[requiresAction] || null;
  }, []);

  /**
   * Validate funding amount
   * @param {number} amount - Amount to validate
   * @param {string} providerId - Provider ID
   * @returns {Object} Validation result
   */
  const validateFundingAmount = useCallback((amount, providerId) => {
    const numAmount = parseFloat(amount);
    const limits = getFundingLimits();

    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        isValid: false,
        error: 'Amount must be a positive number'
      };
    }

    if (numAmount < limits.minimum) {
      return {
        isValid: false,
        error: `Minimum funding amount is ${limits.formattedMinimum}`
      };
    }

    if (numAmount > limits.maximum) {
      return {
        isValid: false,
        error: `Maximum funding amount is ${limits.formattedMaximum}`
      };
    }

    return { isValid: true };
  }, [getFundingLimits]);

  /**
   * Search providers by name
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered providers
   */
  const searchProviders = useCallback(async (searchTerm) => {
    try {
      const providers = await getBettingProviders();
      
      if (!searchTerm || typeof searchTerm !== 'string') {
        return providers;
      }

      const term = searchTerm.toLowerCase().trim();
      return providers.filter(provider =>
        provider.name.toLowerCase().includes(term) ||
        provider.displayName.toLowerCase().includes(term) ||
        provider.category.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('❌ useBetting: Error searching providers:', error);
      return [];
    }
  }, [getBettingProviders]);

  /**
   * Get betting categories
   * @returns {Promise<Array>} Unique categories
   */
  const getBettingCategories = useCallback(async () => {
    try {
      const providers = await getBettingProviders();
      const categories = [...new Set(providers.map(p => p.category))];
      return categories.sort();
    } catch (error) {
      console.error('❌ useBetting: Error getting categories:', error);
      return [];
    }
  }, [getBettingProviders]);

  /**
   * Check if amount is a popular amount
   * @param {number} amount - Amount to check
   * @returns {boolean} True if popular
   */
  const isPopularAmount = useCallback((amount) => {
    const popularAmounts = getPopularAmounts();
    return popularAmounts.some(pa => pa.amount === parseFloat(amount) && pa.popular);
  }, [getPopularAmounts]);

  return {
    // State
    loading,
    error,

    // Main actions
    fundBettingAccount,
    validateBettingCustomer,
    clearErrors,

    // Provider utilities
    getBettingProviders,
    getStaticBettingProviders,
    getProviderDisplayName,
    getProviderCategory,
    isValidProvider,
    getProvidersByCategory,
    searchProviders,
    getBettingCategories,

    // User ID utilities
    validateUserId,
    formatUserId,

    // Amount utilities
    formatAmount,
    getFundingLimits,
    getPopularAmounts,
    validateFundingAmount,
    isPopularAmount,

    // Transaction utilities
    formatTransactionStatus,
    generateTransactionReference,
    getEstimatedFundingTime,

    // Error handling
    getUserFriendlyMessage,
    getErrorAction
  };
};