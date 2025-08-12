import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const networksService = {
  // Networks cache
  networksCache: new Map(),
  networksCacheExpiry: new Map(),
  
  // Cache duration (5 minutes)
  NETWORKS_CACHE_DURATION: 5 * 60 * 1000,

  /**
   * Get supported currencies for networks
   */
  async getSupportedCurrencies() {
    try {
      console.log('🔄 Fetching supported currencies...');

      const response = await apiClient.get('/fetchnetwork/currencies');

      if (response.success) {
        // Handle double-wrapped response
        const actualData = response.data.data || response.data;
        console.log('✅ Supported currencies retrieved:', actualData.total);
        return {
          success: true,
          data: actualData.currencies
        };
      } else {
        console.log('❌ Failed to fetch supported currencies:', response.error);
        return {
          success: false,
          error: response.error || 'CURRENCIES_FETCH_ERROR',
          message: 'Failed to fetch supported currencies'
        };
      }
    } catch (error) {
      console.log('❌ Error fetching supported currencies:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error occurred while fetching currencies'
      };
    }
  },

  /**
   * Fetch available networks for a specific currency from API
   */
  async fetchNetworksForCurrency(currency) {
    try {
      console.log('🔄 Fetching networks for currency:', currency);

      if (!currency || !currency.trim()) {
        return {
          success: false,
          error: 'INVALID_CURRENCY',
          message: 'Currency is required'
        };
      }

      const upperCurrency = currency.toUpperCase();
      
      // Check cache first
      const cacheKey = upperCurrency;
      const cachedNetworks = this.networksCache.get(cacheKey);
      const cacheExpiry = this.networksCacheExpiry.get(cacheKey);
      
      if (cachedNetworks && cacheExpiry && Date.now() < cacheExpiry) {
        console.log('✅ Using cached networks for:', upperCurrency);
        return {
          success: true,
          data: cachedNetworks,
          fromCache: true
        };
      }

      // Fetch from API
      const response = await apiClient.get(`/fetchnetwork/fetch-network?currency=${upperCurrency}`);

      console.log('🔍 Raw API response for networks:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        // Handle double-wrapped response from apiClient
        const actualData = response.data.data || response.data;
        
        console.log('🔍 Actual networks data:', JSON.stringify(actualData, null, 2));
        
        // Check if networks exists in the response data
        if (!actualData.networks || !Array.isArray(actualData.networks)) {
          console.log('❌ Invalid networks data structure:', actualData);
          throw new Error(`Invalid API response: networks field is missing or not an array. Got: ${typeof actualData.networks}`);
        }
        
        // Format networks for consistent structure
        const formattedNetworks = actualData.networks.map(network => {
          console.log('🔍 Processing network:', JSON.stringify(network, null, 2));
          return {
            id: network.network?.toLowerCase() || network.id,
            name: network.networkName || network.name || network.network,
            code: network.network,
            feeUsd: network.feeUsd
          };
        });

        // Cache the result
        this.networksCache.set(cacheKey, formattedNetworks);
        this.networksCacheExpiry.set(cacheKey, Date.now() + this.NETWORKS_CACHE_DURATION);

        console.log('✅ Networks fetched and cached for:', upperCurrency, 'Count:', formattedNetworks.length);

        return {
          success: true,
          data: formattedNetworks,
          fromCache: false
        };
      } else {
        console.log('❌ Failed to fetch networks:', response.error);
        return {
          success: false,
          error: response.error || 'NETWORKS_FETCH_ERROR',
          message: response.message || 'Failed to fetch networks'
        };
      }
    } catch (error) {
      console.log('❌ Error fetching networks:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error occurred while fetching networks'
      };
    }
  },

  /**
   * Get all networks with fee information for all currencies
   */
  async getAllNetworks() {
    try {
      console.log('🔄 Fetching all networks...');

      const response = await apiClient.get('/fetchnetwork/all');

      if (response.success) {
        // Handle double-wrapped response
        const actualData = response.data.data || response.data;
        console.log('✅ All networks retrieved');
        return {
          success: true,
          data: actualData
        };
      } else {
        console.log('❌ Failed to fetch all networks:', response.error);
        return {
          success: false,
          error: response.error || 'NETWORKS_FETCH_ERROR',
          message: 'Failed to fetch all networks'
        };
      }
    } catch (error) {
      console.log('❌ Error fetching all networks:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error occurred while fetching all networks'
      };
    }
  },

  /**
   * Get available networks for a currency (with API integration and fallback)
   */
  async getAvailableNetworks(currency) {
    try {
      const result = await this.fetchNetworksForCurrency(currency);
      
      if (result.success) {
        return result.data;
      } else {
        // Fallback to hardcoded networks if API fails
        console.log('⚠️ API failed, using fallback networks for:', currency);
        return this.getFallbackNetworks(currency);
      }
    } catch (error) {
      console.log('❌ Error getting networks, using fallback:', error);
      return this.getFallbackNetworks(currency);
    }
  },

  /**
   * Fallback networks (in case API is unavailable)
   */
  getFallbackNetworks(currency) {
    const networks = {
      'BTC': [{ id: 'bitcoin', name: 'Bitcoin Network', code: 'BTC', feeUsd: 5.0 }],
      'ETH': [{ id: 'ethereum', name: 'Ethereum Network', code: 'ETH', feeUsd: 3.0 }],
      'SOL': [{ id: 'solana', name: 'Solana Network', code: 'SOL', feeUsd: 0.5 }],
      'USDT': [
        { id: 'ethereum', name: 'Ethereum Network (ERC20)', code: 'ERC20', feeUsd: 3.0 },
        { id: 'tron', name: 'TRON Network (TRC20)', code: 'TRC20', feeUsd: 1.0 },
        { id: 'bsc', name: 'BSC (BEP20)', code: 'BEP20', feeUsd: 0.5 }
      ],
      'USDC': [
        { id: 'ethereum', name: 'Ethereum Network (ERC20)', code: 'ERC20', feeUsd: 3.0 },
        { id: 'bsc', name: 'BSC (BEP20)', code: 'BEP20', feeUsd: 0.5 }
      ],
      'BNB': [
        { id: 'ethereum', name: 'Ethereum Network (ERC20)', code: 'ERC20', feeUsd: 3.0 },
        { id: 'bsc', name: 'BSC (Binance Smart Chain)', code: 'BSC', feeUsd: 0.1 }
      ],
      'MATIC': [{ id: 'ethereum', name: 'Ethereum Network', code: 'ETH', feeUsd: 3.0 }],
      'AVAX': [{ id: 'avalanche', name: 'Avalanche Network', code: 'AVAX', feeUsd: 0.5 }]
    };

    return networks[currency?.toUpperCase()] || [];
  },

  /**
   * Get networks from cache
   */
  getCachedNetworks(currency) {
    if (!currency) return null;
    
    const cacheKey = currency.toUpperCase();
    const cachedNetworks = this.networksCache.get(cacheKey);
    const cacheExpiry = this.networksCacheExpiry.get(cacheKey);
    
    if (cachedNetworks && cacheExpiry && Date.now() < cacheExpiry) {
      return cachedNetworks;
    }
    
    return null;
  },

  /**
   * Clear networks cache
   */
  clearNetworksCache(currency = null) {
    if (currency) {
      const cacheKey = currency.toUpperCase();
      this.networksCache.delete(cacheKey);
      this.networksCacheExpiry.delete(cacheKey);
      console.log('🧹 Cleared networks cache for:', cacheKey);
    } else {
      this.networksCache.clear();
      this.networksCacheExpiry.clear();
      console.log('🧹 Cleared all networks cache');
    }
  },

  /**
   * Validate currency
   */
  validateCurrency(currency) {
    const supportedCurrencies = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'MATIC', 'AVAX'];
    
    if (!currency || !currency.trim()) {
      return {
        success: false,
        error: 'Currency is required'
      };
    }

    const upperCurrency = currency.toUpperCase();
    if (!supportedCurrencies.includes(upperCurrency)) {
      return {
        success: false,
        error: `Currency ${upperCurrency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}`
      };
    }

    return { success: true };
  },

  /**
   * Handle networks errors with user-friendly messages
   */
  handleNetworksError(errorResponse) {
    const error = errorResponse.error || errorResponse.message || 'Unknown error';
    const statusCode = errorResponse.status || errorResponse.statusCode || 500;

    // Map backend errors to user-friendly messages
    const errorMessages = {
      'MISSING_CURRENCY': 'Please select a currency first',
      'UNSUPPORTED_CURRENCY': 'The selected currency is not supported',
      'NO_NETWORKS_FOUND': 'No networks available for this currency',
      'NETWORKS_FETCH_ERROR': 'Unable to fetch available networks',
      'CURRENCIES_FETCH_ERROR': 'Unable to fetch supported currencies',
      'NETWORK_ERROR': 'Network connection error. Please check your connection.',
      'INVALID_CURRENCY': 'Invalid currency provided'
    };

    const userMessage = errorMessages[error] || 'Failed to fetch networks. Please try again.';

    console.log('❌ Handling networks error:', { error, statusCode, userMessage });

    return {
      success: false,
      error,
      message: userMessage,
      statusCode
    };
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    return {
      networksCacheCount: this.networksCache.size,
      cachedCurrencies: Array.from(this.networksCache.keys()),
      cacheExpiries: Array.from(this.networksCacheExpiry.entries()).map(([currency, expiry]) => ({
        currency,
        expiresAt: new Date(expiry).toISOString(),
        isExpired: Date.now() > expiry
      }))
    };
  },

  /**
   * Clear all data
   */
  async clearAllData() {
    console.log('🧹 Clearing all networks data...');
    
    // Clear networks cache
    this.clearNetworksCache();
    
    console.log('✅ All networks data cleared');
  }
};