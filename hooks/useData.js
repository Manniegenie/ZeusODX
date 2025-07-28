// hooks/useData.js
import { useState, useCallback } from 'react';
import { dataService } from '../services/dataService';

/**
 * Custom hook for data purchases
 * Provides state management and data service methods
 */
export const useData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataPlans, setDataPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Purchase data
   * @param {Object} purchaseData - Data purchase details
   * @returns {Promise<Object>} Purchase result
   */
  const purchaseData = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate purchase data first
      const validation = dataService.validatePurchaseData(purchaseData);
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

      const result = await dataService.purchaseData(purchaseData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Data purchase hook error:', err);
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
   * Get available data plans for a network
   * @param {string} networkId - Network identifier (mtn, glo, airtel, 9mobile)
   * @returns {Promise<Object>} Data plans result
   */
  const getDataPlans = useCallback(async (networkId) => {
    if (!networkId) {
      return {
        success: false,
        error: 'NETWORK_REQUIRED',
        message: 'Network provider is required',
        data: []
      };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await dataService.getDataPlans(networkId);
      
      if (result.success) {
        setDataPlans(prev => ({
          ...prev,
          [networkId.toLowerCase()]: result.data
        }));
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Get data plans hook error:', err);
      const errorResult = {
        success: false,
        error: 'FETCH_PLANS_ERROR',
        message: 'Failed to load data plans. Please try again.',
        data: []
      };
      setError(errorResult.error);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get cached data plans for a network
   * @param {string} networkId - Network identifier
   * @returns {Array} Cached data plans or empty array
   */
  const getCachedDataPlans = useCallback((networkId) => {
    if (!networkId) return [];
    return dataPlans[networkId.toLowerCase()] || [];
  }, [dataPlans]);

  /**
   * Select a data plan
   * @param {Object} plan - Selected data plan
   */
  const selectDataPlan = useCallback((plan) => {
    setSelectedPlan(plan);
  }, []);

  /**
   * Clear selected data plan
   */
  const clearSelectedPlan = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  /**
   * Get data plans sorted by price
   * @param {string} networkId - Network identifier
   * @returns {Array} Sorted data plans
   */
  const getDataPlansByPrice = useCallback((networkId) => {
    const plans = getCachedDataPlans(networkId);
    return dataService.sortPlansByPrice(plans);
  }, [getCachedDataPlans]);

  /**
   * Get data plans sorted by data allowance
   * @param {string} networkId - Network identifier
   * @returns {Array} Sorted data plans
   */
  const getDataPlansByData = useCallback((networkId) => {
    const plans = getCachedDataPlans(networkId);
    return dataService.sortPlansByData(plans);
  }, [getCachedDataPlans]);

  /**
   * Filter data plans by price range
   * @param {string} networkId - Network identifier
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} Filtered data plans
   */
  const filterDataPlansByPrice = useCallback((networkId, minPrice, maxPrice) => {
    const plans = getCachedDataPlans(networkId);
    return dataService.filterPlansByPriceRange(plans, minPrice, maxPrice);
  }, [getCachedDataPlans]);

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid Nigerian phone number
   */
  const validatePhoneNumber = useCallback((phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return dataService.isValidNigerianPhone(cleaned);
  }, []);

  /**
   * Format phone number for display
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  const formatPhoneNumber = useCallback((phone) => {
    return dataService.formatPhoneNumber(phone);
  }, []);

  /**
   * Get network display name
   * @param {string} networkId - Network identifier
   * @returns {string} Network display name
   */
  const getNetworkDisplayName = useCallback((networkId) => {
    return dataService.getNetworkDisplayName(networkId);
  }, []);

  /**
   * Get network brand color
   * @param {string} networkId - Network identifier
   * @returns {string} Network brand color
   */
  const getNetworkColor = useCallback((networkId) => {
    return dataService.getNetworkColor(networkId);
  }, []);

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount with currency
   */
  const formatAmount = useCallback((amount) => {
    return dataService.formatAmount(amount);
  }, []);

  /**
   * Format data allowance for display
   * @param {string} dataAllowance - Data allowance to format
   * @returns {string} Formatted data allowance
   */
  const formatDataAllowance = useCallback((dataAllowance) => {
    return dataService.formatDataAllowance(dataAllowance);
  }, []);

  /**
   * Format validity period for display
   * @param {string} validity - Validity period to format
   * @returns {string} Formatted validity period
   */
  const formatValidityPeriod = useCallback((validity) => {
    return dataService.formatValidityPeriod(validity);
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
      'SELECT_PLAN': {
        title: 'Invalid Data Plan',
        message: 'The selected data plan is invalid or no longer available. Please select a different plan.',
        actionText: 'Select Plan',
        priority: 'medium'
      },
      'CHECK_AMOUNT': {
        title: 'Amount Mismatch',
        message: 'The amount you entered doesn\'t match the selected data plan price. Please check and try again.',
        actionText: 'Check Amount',
        priority: 'medium'
      },
      'WAIT_PENDING': {
        title: 'Pending Transaction',
        message: 'You have a pending data transaction. Please wait a few minutes before trying again.',
        actionText: 'Try Again Later',
        priority: 'medium'
      },
      'FIX_INPUT': {
        title: 'Invalid Details',
        message: 'Please check your phone number, network selection, and data plan, then try again.',
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
        message: 'There\'s an issue with the service. Please contact support for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      },
      'RETRY_LATER': {
        title: 'Service Unavailable',
        message: 'The data service is temporarily unavailable. Please try again later.',
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
    return dataService.getUserFriendlyMessage(errorCode, originalMessage);
  }, []);

  /**
   * Get popular data plan ranges
   * @returns {Array} Popular data plan ranges
   */
  const getPopularDataRanges = useCallback(() => {
    return dataService.getPopularDataRanges();
  }, []);

  /**
   * Check if data plans are loaded for a network
   * @param {string} networkId - Network identifier
   * @returns {boolean} True if data plans are loaded
   */
  const hasDataPlans = useCallback((networkId) => {
    if (!networkId) return false;
    const plans = dataPlans[networkId.toLowerCase()];
    return Array.isArray(plans) && plans.length > 0;
  }, [dataPlans]);

  /**
   * Clear all cached data plans
   */
  const clearDataPlans = useCallback(() => {
    setDataPlans({});
  }, []);

  /**
   * Refresh data plans for a specific network
   * @param {string} networkId - Network identifier
   * @returns {Promise<Object>} Refresh result
   */
  const refreshDataPlans = useCallback(async (networkId) => {
    return await getDataPlans(networkId);
  }, [getDataPlans]);

  return {
    // State
    loading,
    error,
    dataPlans,
    selectedPlan,

    // Actions
    purchaseData,
    getDataPlans,
    selectDataPlan,
    clearSelectedPlan,
    clearErrors,
    clearDataPlans,
    refreshDataPlans,

    // Data plan utilities
    getCachedDataPlans,
    getDataPlansByPrice,
    getDataPlansByData,
    filterDataPlansByPrice,
    hasDataPlans,
    getPopularDataRanges,

    // Formatting utilities
    formatPhoneNumber,
    getNetworkDisplayName,
    getNetworkColor,
    formatAmount,
    formatDataAllowance,
    formatValidityPeriod,

    // Validation utilities
    validatePhoneNumber,

    // Error handling utilities
    getErrorAction,
    getUserFriendlyMessage
  };
};