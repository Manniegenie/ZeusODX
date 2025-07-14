import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const dashboardService = {
  // Cache variables
  dashboardCache: null,
  cacheExpiry: 0,
  CACHE_DURATION: 30 * 1000, // 30 seconds
  CACHE_KEY: 'dashboard_cache',

  /**
   * Get comprehensive dashboard data from backend
   */
  async getDashboardData() {
    try {
      // Check cache first
      if (this.dashboardCache && Date.now() < this.cacheExpiry) {
        return { success: true, data: this.dashboardCache };
      }

      // Fetch from API
      const response = await apiClient.get('/dashboard/dashboard');
      
      if (response.success && response.data) {
        // Cache the data
        this.dashboardCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        
        // Also store in AsyncStorage for offline access
        await this.storeCachedData(response.data);
        
        return { success: true, data: response.data };
      } else {
        // Try to get cached data from storage
        const cachedData = await this.getCachedData();
        if (cachedData) {
          return { success: true, data: cachedData };
        }
        
        return { success: false, error: response.error || 'Failed to fetch dashboard data' };
      }
    } catch (error) {
      // Try cached data as fallback
      const cachedData = await this.getCachedData();
      if (cachedData) {
        return { success: true, data: cachedData };
      }
      
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get portfolio balance formatted for the UI
   */
  async getPortfolioBalance() {
    try {
      const dashboardResult = await this.getDashboardData();
      
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error };
      }

      const { portfolio, market } = dashboardResult.data;
      
      // Calculate total portfolio balance
      const totalUSD = portfolio.totalPortfolioBalance || 0;
      
      // Convert to Naira using NGNZ rate or default rate
      const ngnRate = market.ngnzExchangeRate?.rate || 1600; // Default fallback rate
      const totalNGN = totalUSD * ngnRate;

      const portfolioBalance = {
        nairaBalance: `₦${this.formatCurrency(totalNGN)}`,
        usdBalance: `$${this.formatCurrency(totalUSD)}`,
        totalUSD,
        totalNGN
      };

      return { success: true, data: portfolioBalance };
    } catch (error) {
      return { success: false, error: 'Failed to calculate portfolio balance' };
    }
  },

  /**
   * Get tokens data formatted for the UI
   */
  async getTokensData() {
    try {
      const dashboardResult = await this.getDashboardData();
      
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error };
      }

      const { portfolio, market } = dashboardResult.data;
      
      // Define token metadata
      const tokenMetadata = {
        BTC: { name: 'Bitcoin', symbol: 'BTC' },
        ETH: { name: 'Ethereum', symbol: 'ETH' },
        SOL: { name: 'Solana', symbol: 'SOL' },
        USDT: { name: 'USD Tether', symbol: 'USDT' },
        USDC: { name: 'USDC', symbol: 'USDC' },
        NGNZ: { name: 'Nigeria Naira', symbol: 'NGNZ' }
      };

      const tokens = [];

      // Process each token
      Object.entries(tokenMetadata).forEach(([tokenSymbol, metadata]) => {
        const balanceData = portfolio.balances[tokenSymbol];
        const price = market.prices[tokenSymbol] || 0;
        const priceChange = market.priceChanges12h[tokenSymbol];

        if (balanceData || price > 0) {
          const changePercent = priceChange?.percentageChange || 0;
          const isPositive = changePercent >= 0;

          tokens.push({
            id: tokenSymbol.toLowerCase(),
            name: metadata.name,
            symbol: metadata.symbol,
            price: `${this.formatPrice(price, tokenSymbol)} ${tokenSymbol === 'NGNZ' ? 'NGN' : 'USD'}`,
            change: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
            changePercent: `${changePercent.toFixed(2)}%`,
            isPositive,
            balance: balanceData?.balance || 0,
            balanceUSD: balanceData?.balanceUSD || 0,
            currentPrice: price,
            priceChange12h: changePercent
          });
        }
      });

      return { success: true, data: tokens };
    } catch (error) {
      return { success: false, error: 'Failed to process tokens data' };
    }
  },

  /**
   * Get setup status for the progress banner
   */
  async getSetupStatus() {
    try {
      const dashboardResult = await this.getDashboardData();
      
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error };
      }

      const { kyc } = dashboardResult.data;

      const setupStatus = {
        completionPercentage: kyc.completionPercentage || 0,
        isSetupComplete: kyc.completionPercentage >= 100,
        kycLevel: kyc.level || 0,
        kycStatus: kyc.status || 'pending'
      };

      return { success: true, data: setupStatus };
    } catch (error) {
      return { success: false, error: 'Failed to get setup status' };
    }
  },

  /**
   * Force refresh dashboard data (clears cache)
   */
  async refreshDashboard() {
    // Clear in-memory cache
    this.dashboardCache = null;
    this.cacheExpiry = 0;
    
    // Clear AsyncStorage cache
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      // Silent fail
    }
    
    // Trigger price storage on backend
    try {
      await apiClient.post('/store-prices');
    } catch (error) {
      // Silent fail
    }
  },

  /**
   * Get user profile data
   */
  async getUserProfile() {
    try {
      const dashboardResult = await this.getDashboardData();
      
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error };
      }

      return { success: true, data: dashboardResult.data.profile };
    } catch (error) {
      return { success: false, error: 'Failed to get user profile' };
    }
  },

  /**
   * Get market data
   */
  async getMarketData() {
    try {
      const dashboardResult = await this.getDashboardData();
      
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error };
      }

      return { success: true, data: dashboardResult.data.market };
    } catch (error) {
      return { success: false, error: 'Failed to get market data' };
    }
  },

  /**
   * Store dashboard data in AsyncStorage
   */
  async storeCachedData(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      // Silent fail
    }
  },

  /**
   * Get cached dashboard data from AsyncStorage
   */
  async getCachedData() {
    try {
      const cachedString = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cachedString) {
        return null;
      }

      const cached = JSON.parse(cachedString);
      
      // Check if cache is not too old (24 hours max for offline data)
      const maxOfflineAge = 24 * 60 * 60 * 1000;
      if (Date.now() - cached.timestamp > maxOfflineAge) {
        await AsyncStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return cached.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Format currency with proper decimals
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format price based on token type
   */
  formatPrice(price, symbol) {
    // Special formatting for different tokens
    if (symbol === 'NGNZ') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    
    if (symbol === 'BTC') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    
    if (price < 1) {
      return price.toFixed(4);
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  },

  /**
   * Check if dashboard data is cached and fresh
   */
  isCacheFresh() {
    return this.dashboardCache && Date.now() < this.cacheExpiry;
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    const now = Date.now();
    const remainingTime = this.cacheExpiry - now;
    
    return {
      hasCachedData: !!this.dashboardCache,
      isFresh: remainingTime > 0,
      remainingMinutes: Math.max(0, Math.floor(remainingTime / (1000 * 60))),
      cacheExpiry: new Date(this.cacheExpiry).toISOString()
    };
  },

  /**
   * Clear all dashboard caches
   */
  async clearAllCache() {
    // Clear memory cache
    this.dashboardCache = null;
    this.cacheExpiry = 0;
    
    // Clear storage cache
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      // Silent fail
    }
  },

  /**
   * Check if user has any token balances
   */
  async hasTokenBalances() {
    try {
      const tokensResult = await this.getTokensData();
      if (tokensResult.success && tokensResult.data) {
        const hasBalances = tokensResult.data.some(token => token.balance > 0);
        return { success: true, data: { hasBalances } };
      }
      return { success: false, error: 'Failed to check token balances' };
    } catch (error) {
      return { success: false, error: 'Failed to check token balances' };
    }
  },

  /**
   * Get portfolio summary for quick access
   */
  async getPortfolioSummary() {
    try {
      const [balanceResult, tokensResult, setupResult] = await Promise.allSettled([
        this.getPortfolioBalance(),
        this.getTokensData(),
        this.getSetupStatus()
      ]);

      const summary = {};

      // Add balance data
      if (balanceResult.status === 'fulfilled' && balanceResult.value.success) {
        summary.balance = balanceResult.value.data;
      }

      // Add token count
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success) {
        summary.totalTokens = tokensResult.value.data.length;
        summary.tokensWithBalance = tokensResult.value.data.filter(t => t.balance > 0).length;
      }

      // Add setup status
      if (setupResult.status === 'fulfilled' && setupResult.value.success) {
        summary.setup = setupResult.value.data;
      }

      return { success: true, data: summary };
    } catch (error) {
      return { success: false, error: 'Failed to get portfolio summary' };
    }
  }
};
