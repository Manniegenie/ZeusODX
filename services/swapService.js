import { apiClient } from './apiClient';
import { balanceService } from './walletService'; // Import balance service

export const swapService = {
  /**
   * Create a crypto-to-crypto swap quote
   * POST /swap/quote
   */
  async createQuote(from, to, amount, side) {
    try {
      console.log(`💱 Creating crypto swap quote: ${from} -> ${to}, Amount: ${amount}, Side: ${side}`);
      
      // Validate that this is crypto-to-crypto only (no NGNZ)
      if (from.toUpperCase() === 'NGNZ' || to.toUpperCase() === 'NGNZ') {
        console.log('❌ NGNZ not supported in crypto-to-crypto swaps');
        return { success: false, error: 'NGNZ swaps are not supported in this service. Use NGNZ swap service instead.' };
      }
      
      const response = await apiClient.post('/swap/quote', {
        from,
        to,
        amount,
        side
      });

      if (response.success && response.data) {
        console.log('✅ Crypto swap quote created successfully:', response.data);
        return { success: true, data: response.data };
      } else {
        console.log('❌ Failed to create crypto swap quote:', response.error);
        return { success: false, error: response.error || 'Failed to create quote' };
      }

    } catch (error) {
      console.log('❌ Crypto swap service error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Accept a crypto-to-crypto swap quote
   * POST /swap/quote/:quoteId
   */
  async acceptQuote(quoteId) {
    try {
      console.log(`✅ Accepting crypto swap quote: ${quoteId}`);
      
      const response = await apiClient.post(`/swap/quote/${quoteId}`);

      if (response.success && response.data) {
        console.log('✅ Crypto swap quote accepted successfully:', response.data);
        
        // 🎯 CRITICAL: Clear balance cache after successful crypto swap
        try {
          console.log('🔄 Clearing balance cache after successful crypto swap...');
          await balanceService.clearAllCache();
          
          // Force refresh balances to get updated values
          console.log('🔄 Force refreshing balances...');
          const freshBalances = await balanceService.refreshBalances();
          
          if (freshBalances.success) {
            console.log('✅ Balances refreshed successfully after crypto swap');
            console.log('💰 Fresh balance data:', freshBalances.data);
          } else {
            console.log('⚠️ Failed to refresh balances after crypto swap:', freshBalances.error);
          }
          
        } catch (cacheError) {
          console.log('⚠️ Error clearing balance cache after crypto swap:', cacheError);
          // Don't fail the entire swap because of cache issues
        }
        
        return { 
          success: true, 
          data: response.data,
          balancesRefreshed: true // Indicate that balances were refreshed
        };
      } else {
        console.log('❌ Failed to accept crypto swap quote:', response.error);
        return { success: false, error: response.error || 'Failed to accept quote' };
      }

    } catch (error) {
      console.log('❌ Accept crypto swap quote error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Execute a complete crypto-to-crypto swap (quote + accept) with automatic balance refresh
   */
  async executeSwap(from, to, amount, side) {
    try {
      console.log(`🚀 Executing complete crypto swap: ${from} -> ${to}, Amount: ${amount}`);
      
      // Validate that this is crypto-to-crypto only (no NGNZ)
      if (from.toUpperCase() === 'NGNZ' || to.toUpperCase() === 'NGNZ') {
        console.log('❌ NGNZ not supported in crypto-to-crypto swaps');
        return { success: false, error: 'NGNZ swaps are not supported in this service. Use NGNZ swap service instead.' };
      }
      
      // Step 1: Create quote
      const quoteResult = await this.createQuote(from, to, amount, side);
      if (!quoteResult.success) {
        return quoteResult;
      }
      
      const quoteId = quoteResult.data.data?.id || quoteResult.data.id;
      if (!quoteId) {
        return { success: false, error: 'No quote ID received' };
      }
      
      console.log(`📋 Crypto swap quote created with ID: ${quoteId}`);
      
      // Step 2: Accept quote (this will automatically clear cache)
      const acceptResult = await this.acceptQuote(quoteId);
      if (!acceptResult.success) {
        return acceptResult;
      }
      
      console.log('🎉 Crypto swap executed successfully with balance refresh');
      
      return {
        success: true,
        data: {
          quote: quoteResult.data,
          swap: acceptResult.data,
          balancesRefreshed: true
        }
      };
      
    } catch (error) {
      console.log('❌ Execute crypto swap error:', error);
      return { success: false, error: 'Failed to execute swap' };
    }
  },

  /**
   * Get supported tokens for crypto-to-crypto swapping
   * GET /swap/tokens
   */
  async getSupportedTokens() {
    try {
      console.log('🪙 Fetching supported crypto tokens...');
      
      const response = await apiClient.get('/swap/tokens');

      if (response.success && response.data) {
        // Filter out NGNZ from supported tokens for crypto-to-crypto swaps
        const cryptoTokens = response.data.filter(token => 
          token.code.toUpperCase() !== 'NGNZ'
        );
        
        console.log('✅ Supported crypto tokens retrieved:', cryptoTokens);
        return { success: true, data: cryptoTokens };
      } else {
        console.log('❌ Failed to get supported crypto tokens:', response.error);
        return { success: false, error: response.error || 'Failed to get supported tokens' };
      }

    } catch (error) {
      console.log('❌ Get crypto tokens error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get user balance for a specific cryptocurrency
   * GET /swap/balance/:currency
   */
  async getCurrencyBalance(currency) {
    try {
      // Prevent NGNZ balance requests in crypto service
      if (currency.toUpperCase() === 'NGNZ') {
        console.log('❌ NGNZ balance not supported in crypto swap service');
        return { success: false, error: 'NGNZ balance requests not supported in crypto swap service' };
      }
      
      console.log(`💰 Fetching crypto balance for ${currency}...`);
      
      const response = await apiClient.get(`/swap/balance/${currency}`);

      if (response.success && response.data) {
        console.log(`✅ Crypto balance for ${currency}:`, response.data);
        return { success: true, data: response.data };
      } else {
        console.log(`❌ Failed to get ${currency} balance:`, response.error);
        return { success: false, error: response.error || `Failed to get ${currency} balance` };
      }

    } catch (error) {
      console.log(`❌ Get ${currency} balance error:`, error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Manual balance refresh (for user-triggered refresh)
   */
  async refreshBalancesManually() {
    try {
      console.log('🔄 Manually refreshing crypto balances...');
      
      await balanceService.clearAllCache();
      const freshBalances = await balanceService.refreshBalances();
      
      if (freshBalances.success) {
        console.log('✅ Manual crypto balance refresh successful');
        return { success: true, data: freshBalances.data };
      } else {
        console.log('❌ Manual crypto balance refresh failed:', freshBalances.error);
        return { success: false, error: 'Failed to refresh balances' };
      }
      
    } catch (error) {
      console.log('❌ Manual crypto refresh error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Validate if currencies are supported for crypto-to-crypto swap
   */
  validateCryptoSwap(from, to) {
    const supportedCryptos = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'AVAX', 'BNB', 'MATIC'];
    
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    if (fromUpper === 'NGNZ' || toUpper === 'NGNZ') {
      return {
        success: false,
        error: 'NGNZ is not supported for crypto-to-crypto swaps. Use NGNZ swap service instead.'
      };
    }
    
    if (!supportedCryptos.includes(fromUpper)) {
      return {
        success: false,
        error: `${from} is not a supported cryptocurrency for swapping.`
      };
    }
    
    if (!supportedCryptos.includes(toUpper)) {
      return {
        success: false,
        error: `${to} is not a supported cryptocurrency for swapping.`
      };
    }
    
    return { success: true };
  }
};