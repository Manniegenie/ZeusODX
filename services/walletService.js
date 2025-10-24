import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export const balanceService = {
  // Cache variables
  balanceCache: null,
  cacheExpiry: 0,
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutes (more frequent for balance data)
  CACHE_KEY: 'balance_cache',

  /**
   * Get all user balances from backend
   */
  async getAllBalances() {
    try {
      console.log('💰 Fetching all balance data from API...');
      
      // Check cache first
      if (this.balanceCache && Date.now() < this.cacheExpiry) {
        console.log('📋 Using cached balance data');
        return { success: true, data: this.balanceCache };
      }

      // Fetch from API
      const response = await apiClient.post('/balance/balance', { types: ['all'] });
      
      if (response.success || Object.keys(response).length > 0) {
        const balanceData = response.success ? response : response; // Handle both response formats
        
        // Cache the data
        this.balanceCache = balanceData;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        
        // Also store in AsyncStorage for offline access
        await this.storeCachedData(balanceData);
        
        console.log('✅ Balance data fetched successfully');
        return { success: true, data: balanceData };
      } else {
        console.log('❌ Failed to fetch balance data:', response.error);
        
        // Try to get cached data from storage
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('📋 Using stored cached data as fallback');
          return { success: true, data: cachedData };
        }
        
        return { success: false, error: response.error || 'Failed to fetch balance data' };
      }
    } catch (error) {
      console.log('❌ Balance service error:', error);
      
      // Try cached data as fallback
      const cachedData = await this.getCachedData();
      if (cachedData) {
        console.log('📋 Using stored cached data due to error');
        return { success: true, data: cachedData };
      }
      
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get specific balance types
   */
  async getSpecificBalances(types) {
    try {
      console.log('💰 Fetching specific balance data:', types);
      
      if (!types || !Array.isArray(types) || types.length === 0) {
        return { success: false, error: 'Invalid types array provided' };
      }

      // Updated allowed fields - TRX instead of AVAX
      const allowedFields = [
        'solBalance', 'solBalanceUSD', 'solPendingBalance',
        'btcBalance', 'btcBalanceUSD', 'btcPendingBalance',
        'usdtBalance', 'usdtBalanceUSD', 'usdtPendingBalance',
        'usdcBalance', 'usdcBalanceUSD', 'usdcPendingBalance',
        'ethBalance', 'ethBalanceUSD', 'ethPendingBalance',
        'bnbBalance', 'bnbBalanceUSD', 'bnbPendingBalance',
        'maticBalance', 'maticBalanceUSD', 'maticPendingBalance',
        'trxBalance', 'trxBalanceUSD', 'trxPendingBalance',
        'ngnzBalance', 'ngnzBalanceUSD', 'ngnzPendingBalance',
        'totalPortfolioBalance'
      ];

      const invalidFields = types.filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return { success: false, error: `Invalid balance types: ${invalidFields.join(', ')}` };
      }

      const response = await apiClient.post('/balance/balance', { types });
      
      if (response.success || Object.keys(response).length > 0) {
        const balanceData = response.success ? response : response;
        console.log('✅ Specific balance data fetched successfully');
        return { success: true, data: balanceData };
      } else {
        console.log('❌ Failed to fetch specific balance data:', response.error);
        return { success: false, error: response.error || 'Failed to fetch balance data' };
      }
    } catch (error) {
      console.log('❌ Error fetching specific balances:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get portfolio summary with formatted values
   */
  async getPortfolioSummary() {
    try {
      console.log('📊 Getting portfolio summary...');
      const balanceResult = await this.getAllBalances();
      
      if (!balanceResult.success || !balanceResult.data) {
        return { success: false, error: balanceResult.error };
      }

      const balances = balanceResult.data;
      const totalPortfolioBalance = balances.totalPortfolioBalance || 0;

      // Updated token balances - TRX instead of AVAX
      const tokenBalances = {
        sol: {
          balance: balances.solBalance || 0,
          balanceUSD: balances.solBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.solBalance || 0, 'SOL'),
          formattedUSD: this.formatCurrency(balances.solBalanceUSD || 0)
        },
        btc: {
          balance: balances.btcBalance || 0,
          balanceUSD: balances.btcBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.btcBalance || 0, 'BTC'),
          formattedUSD: this.formatCurrency(balances.btcBalanceUSD || 0)
        },
        eth: {
          balance: balances.ethBalance || 0,
          balanceUSD: balances.ethBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.ethBalance || 0, 'ETH'),
          formattedUSD: this.formatCurrency(balances.ethBalanceUSD || 0)
        },
        usdt: {
          balance: balances.usdtBalance || 0,
          balanceUSD: balances.usdtBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.usdtBalance || 0, 'USDT'),
          formattedUSD: this.formatCurrency(balances.usdtBalanceUSD || 0)
        },
        usdc: {
          balance: balances.usdcBalance || 0,
          balanceUSD: balances.usdcBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.usdcBalance || 0, 'USDC'),
          formattedUSD: this.formatCurrency(balances.usdcBalanceUSD || 0)
        },
        bnb: {
          balance: balances.bnbBalance || 0,
          balanceUSD: balances.bnbBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.bnbBalance || 0, 'BNB'),
          formattedUSD: this.formatCurrency(balances.bnbBalanceUSD || 0)
        },
        matic: {
          balance: balances.maticBalance || 0,
          balanceUSD: balances.maticBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.maticBalance || 0, 'MATIC'),
          formattedUSD: this.formatCurrency(balances.maticBalanceUSD || 0)
        },
        trx: {
          balance: balances.trxBalance || 0,
          balanceUSD: balances.trxBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.trxBalance || 0, 'TRX'),
          formattedUSD: this.formatCurrency(balances.trxBalanceUSD || 0)
        },
        ngnz: {
          balance: balances.ngnzBalance || 0,
          balanceUSD: balances.ngnzBalanceUSD || 0,
          formatted: this.formatTokenBalance(balances.ngnzBalance || 0, 'NGNZ'),
          formattedUSD: this.formatCurrency(balances.ngnzBalanceUSD || 0)
        }
      };

      const portfolioSummary = {
        totalPortfolioBalance,
        formattedTotalUSD: this.formatCurrency(totalPortfolioBalance),
        formattedTotalNGN: this.formatNaira(totalPortfolioBalance * 1600), // Default rate
        tokenBalances,
        hasAnyBalance: totalPortfolioBalance > 0,
        nonZeroTokens: Object.values(tokenBalances).filter(token => token.balance > 0).length
      };

      console.log('✅ Portfolio summary calculated:', portfolioSummary);
      return { success: true, data: portfolioSummary };
    } catch (error) {
      console.log('❌ Error getting portfolio summary:', error);
      return { success: false, error: 'Failed to calculate portfolio summary' };
    }
  },

  /**
   * Get only USD balances for quick display
   */
  async getUSDBalances() {
    try {
      console.log('💵 Getting USD balances...');
      const types = [
        'solBalanceUSD', 'btcBalanceUSD', 'usdtBalanceUSD', 
        'usdcBalanceUSD', 'ethBalanceUSD', 'bnbBalanceUSD',
        'maticBalanceUSD', 'trxBalanceUSD', 'ngnzBalanceUSD', 
        'totalPortfolioBalance'
      ];
      
      return await this.getSpecificBalances(types);
    } catch (error) {
      console.log('❌ Error getting USD balances:', error);
      return { success: false, error: 'Failed to get USD balances' };
    }
  },

  /**
   * Get only token balances (non-USD)
   */
  async getTokenBalances() {
    try {
      console.log('🪙 Getting token balances...');
      const types = [
        'solBalance', 'btcBalance', 'usdtBalance', 
        'usdcBalance', 'ethBalance', 'bnbBalance',
        'maticBalance', 'trxBalance', 'ngnzBalance'
      ];
      
      return await this.getSpecificBalances(types);
    } catch (error) {
      console.log('❌ Error getting token balances:', error);
      return { success: false, error: 'Failed to get token balances' };
    }
  },

  /**
   * Force refresh balance data (clears cache)
   */
  async refreshBalances() {
    console.log('🔄 Force refreshing balance data...');
    
    // Clear in-memory cache
    this.balanceCache = null;
    this.cacheExpiry = 0;
    
    // Clear AsyncStorage cache
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Balance cache cleared from storage');
    } catch (error) {
      console.log('⚠️ Failed to clear cached balance data:', error);
    }
    
    // Fetch fresh data
    return await this.getAllBalances();
  },

  /**
   * Check if user has any non-zero balances
   */
  async hasAnyBalances() {
    try {
      const balanceResult = await this.getAllBalances();
      if (balanceResult.success && balanceResult.data) {
        const hasBalances = (balanceResult.data.totalPortfolioBalance || 0) > 0;
        return { success: true, data: { hasBalances } };
      }
      return { success: false, error: 'Failed to check balances' };
    } catch (error) {
      console.log('❌ Error checking for balances:', error);
      return { success: false, error: 'Failed to check balances' };
    }
  },

  /**
   * Store balance data in AsyncStorage
   */
  async storeCachedData(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Balance data cached successfully');
    } catch (error) {
      console.log('⚠️ Failed to store cached balance data:', error);
    }
  },

  /**
   * Get cached balance data from AsyncStorage
   */
  async getCachedData() {
    try {
      const cachedString = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cachedString) {
        console.log('📋 No cached balance data found');
        return null;
      }

      const cached = JSON.parse(cachedString);
      
      // Check if cache is not too old (1 hour max for offline balance data)
      const maxOfflineAge = 60 * 60 * 1000;
      if (Date.now() - cached.timestamp > maxOfflineAge) {
        console.log('⏰ Cached balance data too old, removing...');
        await AsyncStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      console.log('📋 Using cached balance data from storage');
      return cached.data;
    } catch (error) {
      console.log('⚠️ Failed to get cached balance data:', error);
      return null;
    }
  },

  /**
   * Format currency with proper decimals
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format Naira currency
   */
  formatNaira(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format token balance based on token type
   */
  formatTokenBalance(balance, symbol) {
    if (symbol === 'BTC') {
      return balance.toFixed(8); // 8 decimal places for BTC
    }
    
    if (symbol === 'ETH' || symbol === 'SOL') {
      return balance.toFixed(6); // 6 decimal places for ETH/SOL
    }
    
    if (symbol === 'USDT' || symbol === 'USDC') {
      return balance.toFixed(2); // 2 decimal places for stablecoins
    }
    
    if (symbol === 'NGNZ') {
      return balance.toFixed(0); // No decimals for NGNZ
    }
    
    // TRX, BNB, MATIC and others use default 4 decimals
    return balance.toFixed(4); // Default 4 decimal places
  },

  /**
   * Check if balance data is cached and fresh
   */
  isCacheFresh() {
    return this.balanceCache && Date.now() < this.cacheExpiry;
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    const now = Date.now();
    const remainingTime = this.cacheExpiry - now;
    
    return {
      hasCachedData: !!this.balanceCache,
      isFresh: remainingTime > 0,
      remainingMinutes: Math.max(0, Math.floor(remainingTime / (1000 * 60))),
      cacheExpiry: new Date(this.cacheExpiry).toISOString()
    };
  },

  /**
   * Clear all balance caches
   */
  async clearAllCache() {
    console.log('🧹 Clearing all balance caches...');
    
    // Clear memory cache
    this.balanceCache = null;
    this.cacheExpiry = 0;
    
    // Clear storage cache
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('✅ All balance caches cleared');
    } catch (error) {
      console.log('❌ Error clearing balance storage cache:', error);
    }
  }
};