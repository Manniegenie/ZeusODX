// hooks/useCableTvPackages.js
import { useState, useCallback, useRef } from 'react';
import { cableTvPackagesService } from '../services/cabletvpackagesService';

export const useCableTvPackages = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for cable TV packages by provider
  const cableTvPackagesCache = useRef({});
  
  // Loading states by provider
  const loadingStates = useRef({});

  /**
   * Get cached cable TV packages for a provider
   * @param {string} providerId - Provider ID (dstv, gotv, startimes, showmax)
   * @returns {Array} Cached cable TV packages or empty array
   */
  const getCachedCableTvPackages = useCallback((providerId) => {
    if (!providerId) return [];
    const cacheKey = providerId.toLowerCase();
    return cableTvPackagesCache.current[cacheKey] || [];
  }, []);

  /**
   * Check if cable TV packages exist in cache for a provider
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if packages exist in cache
   */
  const hasCableTvPackages = useCallback((providerId) => {
    if (!providerId) return false;
    const cacheKey = providerId.toLowerCase();
    const cachedPackages = cableTvPackagesCache.current[cacheKey];
    return Array.isArray(cachedPackages) && cachedPackages.length > 0;
  }, []);

  /**
   * Get cable TV packages for a provider
   * @param {string} providerId - Provider ID (dstv, gotv, startimes, showmax)
   * @returns {Promise<Object>} Result with success status and data
   */
  const getCableTvPackages = useCallback(async (providerId) => {
    if (!providerId || typeof providerId !== 'string') {
      console.warn('⚠️ Invalid provider ID provided to getCableTvPackages');
      return {
        success: false,
        error: 'INVALID_PROVIDER_ID',
        message: 'Please provide a valid provider ID',
        data: []
      };
    }

    const cacheKey = providerId.toLowerCase();
    
    // Check if already loading for this provider
    if (loadingStates.current[cacheKey]) {
      console.log('📺 Already loading packages for:', providerId);
      return {
        success: false,
        error: 'ALREADY_LOADING',
        message: 'Cable TV packages are already being loaded for this provider',
        data: getCachedCableTvPackages(providerId)
      };
    }

    // Check cache first
    if (hasCableTvPackages(providerId)) {
      console.log('📺 Using cached packages for:', providerId);
      return {
        success: true,
        data: getCachedCableTvPackages(providerId),
        categorized: cableTvPackagesService.categorizePackages(getCachedCableTvPackages(providerId)),
        message: 'Cable TV packages loaded from cache'
      };
    }

    try {
      // Set loading states
      setLoading(true);
      setError(null);
      loadingStates.current[cacheKey] = true;

      console.log('📺 Fetching fresh cable TV packages for:', providerId);

      // Fetch from service
      const result = await cableTvPackagesService.getCableTvPackages(providerId);

      if (result.success && result.data) {
        // Cache the results
        cableTvPackagesCache.current[cacheKey] = result.data;
        
        console.log('✅ Cable TV packages cached for:', providerId, 'Count:', result.data.length);
        
        return {
          success: true,
          data: result.data,
          categorized: result.categorized || cableTvPackagesService.categorizePackages(result.data),
          meta: result.meta,
          message: result.message || 'Cable TV packages loaded successfully'
        };
      } else {
        // Handle API errors
        const errorMessage = result.message || 'Failed to load cable TV packages';
        setError(result.error || 'FETCH_FAILED');
        
        console.log('❌ Failed to fetch cable TV packages for:', providerId, 'Error:', result.error);
        
        return {
          success: false,
          error: result.error || 'FETCH_FAILED',
          message: errorMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Unexpected error fetching cable TV packages:', error);
      
      const errorCode = 'NETWORK_ERROR';
      const errorMessage = 'Failed to load cable TV packages. Please check your connection.';
      
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
  }, [getCachedCableTvPackages, hasCableTvPackages]);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear cache for a specific provider or all providers
   * @param {string} providerId - Optional provider ID to clear specific cache
   */
  const clearCache = useCallback((providerId = null) => {
    if (providerId) {
      const cacheKey = providerId.toLowerCase();
      delete cableTvPackagesCache.current[cacheKey];
      console.log('📺 Cache cleared for:', providerId);
    } else {
      cableTvPackagesCache.current = {};
      console.log('📺 All cable TV packages cache cleared');
    }
  }, []);

  /**
   * Refresh cable TV packages for a provider (force fetch)
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Result with success status and data
   */
  const refreshCableTvPackages = useCallback(async (providerId) => {
    if (!providerId) return { success: false, error: 'INVALID_PROVIDER_ID', data: [] };
    
    // Clear cache for this provider
    clearCache(providerId);
    
    // Fetch fresh data
    return await getCableTvPackages(providerId);
  }, [clearCache, getCableTvPackages]);

  /**
   * Get formatted packages for modal display
   * @param {string} providerId - Provider ID
   * @returns {Object} Formatted packages by category
   */
  const getModalFormattedPackages = useCallback((providerId) => {
    const packages = getCachedCableTvPackages(providerId);
    return cableTvPackagesService.getModalFormattedPackages(packages);
  }, [getCachedCableTvPackages]);

  /**
   * Search cable TV packages
   * @param {string} providerId - Provider ID
   * @param {string} query - Search query
   * @returns {Array} Filtered packages
   */
  const searchCableTvPackages = useCallback((providerId, query) => {
    const packages = getCachedCableTvPackages(providerId);
    return cableTvPackagesService.searchPackages(packages, query);
  }, [getCachedCableTvPackages]);

  /**
   * Get provider display name
   * @param {string} providerId - Provider ID
   * @returns {string} Display name
   */
  const getProviderDisplayName = useCallback((providerId) => {
    return cableTvPackagesService.getProviderDisplayName(providerId);
  }, []);

  /**
   * Filter packages by category
   * @param {string} providerId - Provider ID
   * @param {string} category - Package category
   * @returns {Array} Filtered packages
   */
  const getPackagesByCategory = useCallback((providerId, category) => {
    const packages = getCachedCableTvPackages(providerId);
    if (!category || category === 'all') return packages;
    return packages.filter(pkg => pkg.category === category);
  }, [getCachedCableTvPackages]);

  /**
   * Filter packages by subscription type
   * @param {string} providerId - Provider ID
   * @param {string} subscriptionType - Subscription type (monthly, quarterly, yearly)
   * @returns {Array} Filtered packages
   */
  const getPackagesBySubscriptionType = useCallback((providerId, subscriptionType) => {
    const packages = getCachedCableTvPackages(providerId);
    if (!subscriptionType || subscriptionType === 'all') return packages;
    return packages.filter(pkg => pkg.subscriptionType === subscriptionType);
  }, [getCachedCableTvPackages]);

  /**
   * Filter packages by price range
   * @param {string} providerId - Provider ID
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} Filtered packages
   */
  const getPackagesByPriceRange = useCallback((providerId, minPrice = 0, maxPrice = Infinity) => {
    const packages = getCachedCableTvPackages(providerId);
    return packages.filter(pkg => pkg.price >= minPrice && pkg.price <= maxPrice);
  }, [getCachedCableTvPackages]);

  /**
   * Get available categories for a provider
   * @param {string} providerId - Provider ID
   * @returns {Array} Array of available categories
   */
  const getAvailableCategories = useCallback((providerId) => {
    const packages = getCachedCableTvPackages(providerId);
    const categories = [...new Set(packages.map(pkg => pkg.category))];
    return categories.sort();
  }, [getCachedCableTvPackages]);

  /**
   * Get available subscription types for a provider
   * @param {string} providerId - Provider ID
   * @returns {Array} Array of available subscription types
   */
  const getAvailableSubscriptionTypes = useCallback((providerId) => {
    const packages = getCachedCableTvPackages(providerId);
    const subscriptionTypes = [...new Set(packages.map(pkg => pkg.subscriptionType))];
    return subscriptionTypes.sort();
  }, [getCachedCableTvPackages]);

  /**
   * Get price range for a provider
   * @param {string} providerId - Provider ID
   * @returns {Object} Min and max prices
   */
  const getPriceRange = useCallback((providerId) => {
    const packages = getCachedCableTvPackages(providerId);
    if (packages.length === 0) return { min: 0, max: 0 };
    
    const prices = packages.map(pkg => pkg.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [getCachedCableTvPackages]);

  /**
   * Get error action based on error type
   * @param {string} errorType - Error type
   * @returns {Object|null} Error action object
   */
  const getErrorAction = useCallback((errorType) => {
    const errorActions = {
      'INVALID_SERVICE_ID': {
        title: 'Invalid Provider',
        message: 'Please select a valid cable TV provider and try again.',
        actionText: 'Select Provider',
        priority: 'high'
      },
      'NO_PACKAGES_AVAILABLE': {
        title: 'No Packages Available',
        message: 'No cable TV packages are currently available for this provider.',
        actionText: 'Try Different Provider',
        priority: 'medium'
      },
      'PROVIDER_UNAVAILABLE': {
        title: 'Provider Unavailable',
        message: 'This cable TV provider is currently unavailable.',
        actionText: 'Try Different Provider',
        priority: 'high'
      },
      'EBILLS_API_ERROR': {
        title: 'Service Unavailable',
        message: 'The cable TV packages service is temporarily unavailable.',
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
      'INVALID_SERVICE_ID': 'Invalid provider selected. Please choose a different provider.',
      'NO_PACKAGES_AVAILABLE': 'No cable TV packages are available for this provider at the moment.',
      'PROVIDER_UNAVAILABLE': 'This cable TV provider is currently unavailable.',
      'EBILLS_API_ERROR': 'Cable TV packages service is temporarily unavailable.',
      'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'SERVICE_ERROR': 'Service is temporarily unavailable.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'FETCH_FAILED': 'Failed to load cable TV packages. Please try again.',
      'INVALID_PROVIDER_ID': 'Please select a provider first.',
      'ALREADY_LOADING': 'Cable TV packages are already being loaded.'
    };
    
    return errorMessages[errorCode] || fallbackMessage;
  }, []);

  // Get current loading state for a specific provider
  const isLoadingForProvider = useCallback((providerId) => {
    if (!providerId) return false;
    const cacheKey = providerId.toLowerCase();
    return loadingStates.current[cacheKey] || false;
  }, []);

  // Get cache status for debugging
  const getCacheStatus = useCallback(() => {
    const providers = Object.keys(cableTvPackagesCache.current);
    const totalPackages = providers.reduce((total, provider) => {
      return total + (cableTvPackagesCache.current[provider]?.length || 0);
    }, 0);

    return {
      cachedProviders: providers,
      totalCachedPackages: totalPackages,
      cacheKeys: Object.keys(cableTvPackagesCache.current)
    };
  }, []);

  return {
    // State
    loading,
    error,
    
    // Data fetching
    getCableTvPackages,
    refreshCableTvPackages,
    getCachedCableTvPackages,
    hasCableTvPackages,
    isLoadingForProvider,
    
    // Package formatting for modal
    getModalFormattedPackages,
    searchCableTvPackages,
    
    // Filtering and categorization
    getPackagesByCategory,
    getPackagesBySubscriptionType,
    getPackagesByPriceRange,
    getAvailableCategories,
    getAvailableSubscriptionTypes,
    getPriceRange,
    
    // Utility functions
    getProviderDisplayName,
    
    // Error handling
    clearErrors,
    getErrorAction,
    getUserFriendlyMessage,
    
    // Cache management
    clearCache,
    getCacheStatus
  };
};