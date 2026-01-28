// hooks/useData.js
import { useCallback, useState } from 'react';
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
        const errorMessage = validation.errors[0] || 'Validation failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage, // Client-side validation error directly
          message: errorMessage,
          errors: validation.errors
        };
      }

      const result = await dataService.purchaseData(purchaseData);
      
      if (!result.success) {
        // Set backend error message directly from service
        setError(result.error || result.message || 'Data purchase failed');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Data purchase hook error:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage, // Network/unexpected error message directly
        message: errorMessage
      };
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
      const errorMessage = 'Network provider is required';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
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
      const errorMessage = err.message || 'Failed to load data plans. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage, // Network error message directly
        message: errorMessage,
        data: []
      };
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
    error, // This now holds the exact backend message (or client-side validation error)
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
    validatePhoneNumber
  };
};