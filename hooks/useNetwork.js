import { useState, useEffect, useCallback, useRef } from 'react';
import { networksService } from '../services/networkService';

export const useNetworks = () => {
  // Loading states
  const [isFetchingNetworks, setIsFetchingNetworks] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [isLoadingAllNetworks, setIsLoadingAllNetworks] = useState(false);

  // Data states
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [allNetworks, setAllNetworks] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Error states
  const [networksError, setNetworksError] = useState(null);
  const [currenciesError, setCurrenciesError] = useState(null);
  const [allNetworksError, setAllNetworksError] = useState(null);

  // Refs for cleanup
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setNetworksError(null);
    setCurrenciesError(null);
    setAllNetworksError(null);
  }, []);

  /**
   * Clear specific error
   */
  const clearError = useCallback((errorType) => {
    switch (errorType) {
      case 'networks':
        setNetworksError(null);
        break;
      case 'currencies':
        setCurrenciesError(null);
        break;
      case 'allNetworks':
        setAllNetworksError(null);
        break;
      default:
        clearErrors();
    }
  }, [clearErrors]);

  /**
   * Map API error messages to user-friendly errors
   */
  const mapErrorToAction = useCallback((result) => {
    if (!result) return result;

    const error = result.error || result.message || 'Unknown error';
    console.log('🔍 Networks Hook: Analyzing error:', error);

    return networksService.handleNetworksError(result);
  }, []);

  /**
   * Load supported currencies
   */
  const loadSupportedCurrencies = useCallback(async () => {
    if (!mountedRef.current) return null;

    try {
      setIsLoadingCurrencies(true);
      setCurrenciesError(null);
      
      console.log('🔄 Hook: Loading supported currencies...');
      
      const result = await networksService.getSupportedCurrencies();
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setSupportedCurrencies(result.data);
        console.log('✅ Hook: Currencies loaded successfully');
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setCurrenciesError(mappedResult);
        console.log('❌ Hook: Failed to load currencies');
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to load supported currencies. Please check your connection.'
      };
      
      setCurrenciesError(errorResult);
      console.log('❌ Hook: Currencies loading error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsLoadingCurrencies(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Fetch available networks for a currency
   */
  const fetchNetworksForCurrency = useCallback(async (currency) => {
    if (!mountedRef.current || !currency) return null;

    try {
      setIsFetchingNetworks(true);
      setNetworksError(null);
      
      console.log('🔄 Hook: Fetching networks for currency:', currency);
      
      // Validate currency first
      const validation = networksService.validateCurrency(currency);
      if (!validation.success) {
        const errorResult = {
          success: false,
          error: 'INVALID_CURRENCY',
          message: validation.error
        };
        setNetworksError(errorResult);
        return errorResult;
      }
      
      const result = await networksService.fetchNetworksForCurrency(currency);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setAvailableNetworks(result.data);
        setSelectedCurrency(currency.toUpperCase());
        console.log('✅ Hook: Networks fetched successfully for:', currency);
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setNetworksError(mappedResult);
        console.log('❌ Hook: Failed to fetch networks for:', currency);
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to fetch networks. Please check your connection.'
      };
      
      setNetworksError(errorResult);
      console.log('❌ Hook: Networks fetching error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsFetchingNetworks(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Get available networks for a currency (async version)
   */
  const getAvailableNetworks = useCallback(async (currency) => {
    if (!currency) return [];
    
    try {
      const networks = await networksService.getAvailableNetworks(currency);
      return networks || [];
    } catch (error) {
      console.log('❌ Hook: Error getting networks:', error);
      return [];
    }
  }, []);

  /**
   * Load all networks
   */
  const loadAllNetworks = useCallback(async () => {
    if (!mountedRef.current) return null;

    try {
      setIsLoadingAllNetworks(true);
      setAllNetworksError(null);
      
      console.log('🔄 Hook: Loading all networks...');
      
      const result = await networksService.getAllNetworks();
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setAllNetworks(result.data);
        console.log('✅ Hook: All networks loaded successfully');
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setAllNetworksError(mappedResult);
        console.log('❌ Hook: Failed to load all networks');
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to load all networks. Please check your connection.'
      };
      
      setAllNetworksError(errorResult);
      console.log('❌ Hook: All networks loading error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsLoadingAllNetworks(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Get cached networks for a currency
   */
  const getCachedNetworks = useCallback((currency) => {
    return networksService.getCachedNetworks(currency);
  }, []);

  /**
   * Get fallback networks for a currency
   */
  const getFallbackNetworks = useCallback((currency) => {
    return networksService.getFallbackNetworks(currency);
  }, []);

  /**
   * Clear networks cache
   */
  const clearNetworksCache = useCallback((currency = null) => {
    networksService.clearNetworksCache(currency);
    if (currency && selectedCurrency === currency.toUpperCase()) {
      setAvailableNetworks([]);
      setSelectedCurrency(null);
    } else if (!currency) {
      setAvailableNetworks([]);
      setSelectedCurrency(null);
    }
    console.log('🧹 Hook: Networks cache cleared for:', currency || 'all currencies');
  }, [selectedCurrency]);

  /**
   * Validate currency
   */
  const validateCurrency = useCallback((currency) => {
    return networksService.validateCurrency(currency);
  }, []);

  /**
   * Reset networks data
   */
  const resetNetworksData = useCallback(() => {
    setAvailableNetworks([]);
    setSelectedCurrency(null);
    setNetworksError(null);
  }, []);

  /**
   * Reset all data
   */
  const resetAllData = useCallback(() => {
    setAvailableNetworks([]);
    setAllNetworks([]);
    setSupportedCurrencies([]);
    setSelectedCurrency(null);
    clearErrors();
  }, [clearErrors]);

  /**
   * Refresh networks for selected currency
   */
  const refreshNetworks = useCallback(async () => {
    if (selectedCurrency) {
      console.log('🔄 Hook: Refreshing networks for:', selectedCurrency);
      await fetchNetworksForCurrency(selectedCurrency);
    }
  }, [selectedCurrency, fetchNetworksForCurrency]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    console.log('🔄 Hook: Refreshing all networks data...');
    
    // Refresh currencies
    await loadSupportedCurrencies();
    
    // Refresh networks for selected currency if exists
    if (selectedCurrency) {
      await fetchNetworksForCurrency(selectedCurrency);
    }
    
    // Refresh all networks if loaded
    if (allNetworks.length > 0) {
      await loadAllNetworks();
    }
    
    console.log('✅ Hook: All networks data refreshed');
  }, [selectedCurrency, allNetworks.length, loadSupportedCurrencies, fetchNetworksForCurrency, loadAllNetworks]);

  /**
   * Find network by code in available networks
   */
  const findNetworkByCode = useCallback((code) => {
    return availableNetworks.find(network => 
      network.code?.toUpperCase() === code?.toUpperCase() ||
      network.id?.toLowerCase() === code?.toLowerCase()
    );
  }, [availableNetworks]);

  /**
   * Get network fee by code
   */
  const getNetworkFee = useCallback((code) => {
    const network = findNetworkByCode(code);
    return network?.feeUsd || 0;
  }, [findNetworkByCode]);

  // Auto-load supported currencies on mount
  useEffect(() => {
    loadSupportedCurrencies();
  }, [loadSupportedCurrencies]);

  return {
    // Loading states
    isFetchingNetworks,
    isLoadingCurrencies,
    isLoadingAllNetworks,
    isLoading: isFetchingNetworks || isLoadingCurrencies || isLoadingAllNetworks,

    // Data states
    supportedCurrencies,
    availableNetworks,
    allNetworks,
    selectedCurrency,

    // Error states
    networksError,
    currenciesError,
    allNetworksError,
    hasError: !!(networksError || currenciesError || allNetworksError),

    // Data loading actions
    loadSupportedCurrencies,
    fetchNetworksForCurrency,
    getAvailableNetworks,
    loadAllNetworks,

    // Utility functions
    getCachedNetworks,
    getFallbackNetworks,
    validateCurrency,
    findNetworkByCode,
    getNetworkFee,

    // Management functions
    resetNetworksData,
    resetAllData,
    refreshNetworks,
    refreshAll,
    clearErrors,
    clearError,
    clearNetworksCache,

    // Status helpers
    hasAvailableNetworks: availableNetworks.length > 0,
    hasSupportedCurrencies: supportedCurrencies.length > 0,
    hasAllNetworks: allNetworks.length > 0,
    hasSelectedCurrency: !!selectedCurrency,
    
    // Cache info (for debugging)
    cacheStatus: networksService.getCacheStatus()
  };
};