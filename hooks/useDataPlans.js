// hooks/useDataPlans.js
import { useState, useCallback, useRef } from 'react';
import { dataPlansService } from '../services/dataPlanService';

export const useDataPlans = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for data plans by network
  const dataPlansCache = useRef({});
  
  // Loading states by network
  const loadingStates = useRef({});

  /**
   * Get cached data plans for a network
   * @param {string} networkId - Network ID (mtn, airtel, glo, 9mobile, smile)
   * @returns {Array} Cached data plans or empty array
   */
  const getCachedDataPlans = useCallback((networkId) => {
    if (!networkId) return [];
    const cacheKey = networkId.toLowerCase();
    return dataPlansCache.current[cacheKey] || [];
  }, []);

  /**
   * Check if data plans exist in cache for a network
   * @param {string} networkId - Network ID
   * @returns {boolean} True if plans exist in cache
   */
  const hasDataPlans = useCallback((networkId) => {
    if (!networkId) return false;
    const cacheKey = networkId.toLowerCase();
    const cachedPlans = dataPlansCache.current[cacheKey];
    return Array.isArray(cachedPlans) && cachedPlans.length > 0;
  }, []);

  /**
   * Get data plans for a network
   * @param {string} networkId - Network ID (mtn, airtel, glo, 9mobile, smile)
   * @returns {Promise<Object>} Result with success status and data
   */
  const getDataPlans = useCallback(async (networkId) => {
    if (!networkId || typeof networkId !== 'string') {
      console.warn('⚠️ Invalid network ID provided to getDataPlans');
      return {
        success: false,
        error: 'INVALID_NETWORK_ID',
        message: 'Please provide a valid network ID',
        data: []
      };
    }

    const cacheKey = networkId.toLowerCase();
    
    // Check if already loading for this network
    if (loadingStates.current[cacheKey]) {
      console.log('📋 Already loading plans for:', networkId);
      return {
        success: false,
        error: 'ALREADY_LOADING',
        message: 'Data plans are already being loaded for this network',
        data: getCachedDataPlans(networkId)
      };
    }

    // Check cache first
    if (hasDataPlans(networkId)) {
      console.log('📋 Using cached plans for:', networkId);
      return {
        success: true,
        data: getCachedDataPlans(networkId),
        categorized: dataPlansService.categorizePlans(getCachedDataPlans(networkId)),
        message: 'Data plans loaded from cache'
      };
    }

    try {
      // Set loading states
      setLoading(true);
      setError(null);
      loadingStates.current[cacheKey] = true;

      console.log('📋 Fetching fresh data plans for:', networkId);

      // Fetch from service
      const result = await dataPlansService.getDataPlans(networkId);

      if (result.success && result.data) {
        // Cache the results
        dataPlansCache.current[cacheKey] = result.data;
        
        console.log('✅ Data plans cached for:', networkId, 'Count:', result.data.length);
        
        return {
          success: true,
          data: result.data,
          categorized: result.categorized || dataPlansService.categorizePlans(result.data),
          meta: result.meta,
          message: result.message || 'Data plans loaded successfully'
        };
      } else {
        // Handle API errors
        const errorMessage = result.message || 'Failed to load data plans';
        setError(result.error || 'FETCH_FAILED');
        
        console.log('❌ Failed to fetch data plans for:', networkId, 'Error:', result.error);
        
        return {
          success: false,
          error: result.error || 'FETCH_FAILED',
          message: errorMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Unexpected error fetching data plans:', error);
      
      const errorCode = 'NETWORK_ERROR';
      const errorMessage = 'Failed to load data plans. Please check your connection.';
      
      setError(errorCode);
      
      return {
        success: false,
        error: errorCode,
        message: errorMessage,
        data: []
      };
    } finally {
      // Clear loading states
      setLoading(false);
      loadingStates.current[cacheKey] = false;
    }
  }, [getCachedDataPlans, hasDataPlans]);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear cache for a specific network or all networks
   * @param {string} networkId - Optional network ID to clear specific cache
   */
  const clearCache = useCallback((networkId = null) => {
    if (networkId) {
      const cacheKey = networkId.toLowerCase();
      delete dataPlansCache.current[cacheKey];
      console.log('📋 Cache cleared for:', networkId);
    } else {
      dataPlansCache.current = {};
      console.log('📋 All data plans cache cleared');
    }
  }, []);

  /**
   * Refresh data plans for a network (force fetch)
   * @param {string} networkId - Network ID
   * @returns {Promise<Object>} Result with success status and data
   */
  const refreshDataPlans = useCallback(async (networkId) => {
    if (!networkId) return { success: false, error: 'INVALID_NETWORK_ID', data: [] };
    
    // Clear cache for this network
    clearCache(networkId);
    
    // Fetch fresh data
    return await getDataPlans(networkId);
  }, [clearCache, getDataPlans]);

  /**
   * Get formatted plans for modal display
   * @param {string} networkId - Network ID
   * @returns {Object} Formatted plans by category
   */
  const getModalFormattedPlans = useCallback((networkId) => {
    const plans = getCachedDataPlans(networkId);
    return dataPlansService.getModalFormattedPlans(plans);
  }, [getCachedDataPlans]);

  /**
   * Search data plans
   * @param {string} networkId - Network ID
   * @param {string} query - Search query
   * @returns {Array} Filtered plans
   */
  const searchDataPlans = useCallback((networkId, query) => {
    const plans = getCachedDataPlans(networkId);
    return dataPlansService.searchPlans(plans, query);
  }, [getCachedDataPlans]);

  /**
   * Get network display name
   * @param {string} networkId - Network ID
   * @returns {string} Display name
   */
  const getNetworkDisplayName = useCallback((networkId) => {
    return dataPlansService.getNetworkDisplayName(networkId);
  }, []);

  /**
   * Get error action based on error type
   * @param {string} errorType - Error type
   * @returns {Object|null} Error action object
   */
  const getErrorAction = useCallback((errorType) => {
    const errorActions = {
      'INVALID_SERVICE_ID': {
        title: 'Invalid Network',
        message: 'Please select a valid network provider and try again.',
        actionText: 'Select Network',
        priority: 'high'
      },
      'NO_PLANS_AVAILABLE': {
        title: 'No Plans Available',
        message: 'No data plans are currently available for this network.',
        actionText: 'Try Different Network',
        priority: 'medium'
      },
      'EBILLS_API_ERROR': {
        title: 'Service Unavailable',
        message: 'The data plans service is temporarily unavailable.',
        actionText: 'Try Again Later',
        priority: 'high'
      },
      'REQUEST_TIMEOUT': {
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        actionText: 'Retry',
        priority: 'medium'
      },
      'NETWORK_ERROR': {
        title: 'Network Error',
        message: 'Please check your internet connection and try again.',
        actionText: 'Retry',
        priority: 'high'
      },
      'SERVICE_ERROR': {
        title: 'Service Error',
        message: 'The service is temporarily unavailable.',
        actionText: 'Try Again Later',
        priority: 'medium'
      }
    };

    return errorActions[errorType] || null;
  }, []);

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} fallbackMessage - Fallback message
   * @returns {string} User-friendly message
   */
  const getUserFriendlyMessage = useCallback((errorCode, fallbackMessage = 'Something went wrong') => {
    const errorMessages = {
      'INVALID_SERVICE_ID': 'Invalid network selected. Please choose a different network.',
      'NO_PLANS_AVAILABLE': 'No data plans are available for this network at the moment.',
      'EBILLS_API_ERROR': 'Data plans service is temporarily unavailable.',
      'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'SERVICE_ERROR': 'Service is temporarily unavailable.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'FETCH_FAILED': 'Failed to load data plans. Please try again.',
      'INVALID_NETWORK_ID': 'Please select a network first.',
      'ALREADY_LOADING': 'Data plans are already being loaded.'
    };
    
    return errorMessages[errorCode] || fallbackMessage;
  }, []);

  // Get current loading state for a specific network
  const isLoadingForNetwork = useCallback((networkId) => {
    if (!networkId) return false;
    const cacheKey = networkId.toLowerCase();
    return loadingStates.current[cacheKey] || false;
  }, []);

  // Get cache status for debugging
  const getCacheStatus = useCallback(() => {
    const networks = Object.keys(dataPlansCache.current);
    const totalPlans = networks.reduce((total, network) => {
      return total + (dataPlansCache.current[network]?.length || 0);
    }, 0);

    return {
      cachedNetworks: networks,
      totalCachedPlans: totalPlans,
      cacheKeys: Object.keys(dataPlansCache.current)
    };
  }, []);

  return {
    // State
    loading,
    error,
    
    // Data fetching
    getDataPlans,
    refreshDataPlans,
    getCachedDataPlans,
    hasDataPlans,
    isLoadingForNetwork,
    
    // Plan formatting for modal
    getModalFormattedPlans,
    searchDataPlans,
    
    // Utility functions
    getNetworkDisplayName,
    
    // Error handling
    clearErrors,
    getErrorAction,
    getUserFriendlyMessage,
    
    // Cache management
    clearCache,
    getCacheStatus
  };
};