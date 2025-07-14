import { apiClient } from './apiClient';
import { balanceService } from './walletService'; // Import balance service

export const ngnzService = {
  /**
   * Create an NGNZ swap quote (onramp or offramp)
   * POST /ngnz-swap/quote
   */
  async createQuote(from, to, amount, side) {
    try {
      console.log(`💱 Creating NGNZ swap quote: ${from} -> ${to}, Amount: ${amount}, Side: ${side}`);
      
      // Validate that one currency is NGNZ
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();
      
      if (fromUpper !== 'NGNZ' && toUpper !== 'NGNZ') {
        console.log('❌ Neither currency is NGNZ');
        return { success: false, error: 'One currency must be NGNZ for NGNZ swaps.' };
      }

      if (fromUpper === 'NGNZ' && toUpper === 'NGNZ') {
        console.log('❌ Both currencies are NGNZ');
        return { success: false, error: 'Cannot swap NGNZ to NGNZ.' };
      }
      
      const isOnramp = fromUpper === 'NGNZ' && toUpper !== 'NGNZ';
      
      console.log(`📋 NGNZ ${isOnramp ? 'Onramp' : 'Offramp'} operation detected`);
      
      const response = await apiClient.post('/ngnz-swap/quote', {
        from,
        to,
        amount,
        side
      });

      if (response.success && response.data) {
        console.log('✅ NGNZ swap quote created successfully:', response.data);
        return { 
          success: true, 
          data: response.data,
          flow: isOnramp ? 'ONRAMP' : 'OFFRAMP'
        };
      } else {
        console.log('❌ Failed to create NGNZ swap quote:', response.error);
        return { success: false, error: response.error || 'Failed to create NGNZ quote' };
      }

    } catch (error) {
      console.log('❌ NGNZ swap service error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Accept an NGNZ swap quote
   * POST /ngnz-swap/quote/:quoteId
   */
  async acceptQuote(quoteId) {
    try {
      console.log(`✅ Accepting NGNZ swap quote: ${quoteId}`);
      
      const response = await apiClient.post(`/ngnz-swap/quote/${quoteId}`);

      if (response.success && response.data) {
        console.log('✅ NGNZ swap quote accepted successfully:', response.data);
        
        // 🎯 CRITICAL: Clear balance cache after successful NGNZ swap
        try {
          console.log('🔄 Clearing balance cache after successful NGNZ swap...');
          await balanceService.clearAllCache();
          
          // Force refresh balances to get updated values
          console.log('🔄 Force refreshing balances...');
          const freshBalances = await balanceService.refreshBalances();
          
          if (freshBalances.success) {
            console.log('✅ Balances refreshed successfully after NGNZ swap');
            console.log('💰 Fresh balance data:', freshBalances.data);
          } else {
            console.log('⚠️ Failed to refresh balances after NGNZ swap:', freshBalances.error);
          }
          
        } catch (cacheError) {
          console.log('⚠️ Error clearing balance cache after NGNZ swap:', cacheError);
          // Don't fail the entire swap because of cache issues
        }
        
        return { 
          success: true, 
          data: response.data,
          balancesRefreshed: true,
          flow: response.data.flow || 'UNKNOWN'
        };
      } else {
        console.log('❌ Failed to accept NGNZ swap quote:', response.error);
        return { success: false, error: response.error || 'Failed to accept NGNZ quote' };
      }

    } catch (error) {
      console.log('❌ Accept NGNZ swap quote error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Execute a complete NGNZ swap (quote + accept) with automatic balance refresh
   */
  async executeSwap(from, to, amount, side) {
    try {
      console.log(`🚀 Executing complete NGNZ swap: ${from} -> ${to}, Amount: ${amount}`);
      
      // Step 1: Create NGNZ quote
      const quoteResult = await this.createQuote(from, to, amount, side);
      if (!quoteResult.success) {
        return quoteResult;
      }
      
      const quoteId = quoteResult.data.data?.id || quoteResult.data.id;
      if (!quoteId) {
        return { success: false, error: 'No quote ID received' };
      }
      
      console.log(`📋 NGNZ swap quote created with ID: ${quoteId}, Flow: ${quoteResult.flow}`);
      
      // Step 2: Accept quote (this will automatically clear cache)
      const acceptResult = await this.acceptQuote(quoteId);
      if (!acceptResult.success) {
        return acceptResult;
      }
      
      console.log(`🎉 NGNZ ${quoteResult.flow} executed successfully with balance refresh`);
      
      return {
        success: true,
        data: {
          quote: quoteResult.data,
          swap: acceptResult.data,
          balancesRefreshed: true,
          flow: quoteResult.flow
        }
      };
      
    } catch (error) {
      console.log('❌ Execute NGNZ swap error:', error);
      return { success: false, error: 'Failed to execute NGNZ swap' };
    }
  },

  /**
   * Get supported currencies for NGNZ swaps
   * GET /ngnz-swap/supported-currencies
   */
  async getSupportedCurrencies() {
    try {
      console.log('🪙 Fetching supported currencies for NGNZ swaps...');
      
      const response = await apiClient.get('/ngnz-swap/supported-currencies');

      if (response.success && response.data) {
        console.log('✅ NGNZ supported currencies retrieved:', response.data);
        return { success: true, data: response.data };
      } else {
        console.log('❌ Failed to get NGNZ supported currencies:', response.error);
        return { success: false, error: response.error || 'Failed to get supported currencies' };
      }

    } catch (error) {
      console.log('❌ Get NGNZ currencies error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get NGNZ balance
   */
  async getNGNZBalance() {
    try {
      console.log('💰 Fetching NGNZ balance...');
      
      // Use the balance service to get NGNZ balance
      const balances = await balanceService.getBalances();
      
      if (balances.success && balances.data?.ngnzBalance) {
        console.log('✅ NGNZ balance retrieved:', balances.data.ngnzBalance);
        return { success: true, data: balances.data.ngnzBalance };
      } else {
        console.log('❌ Failed to get NGNZ balance');
        return { success: false, error: 'Failed to get NGNZ balance' };
      }

    } catch (error) {
      console.log('❌ Get NGNZ balance error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Get current NGNZ exchange rate
   */
  async getNGNZExchangeRate() {
    try {
      console.log('📊 Fetching NGNZ exchange rate...');
      
      // You can implement this based on your dashboard service or a specific endpoint
      // For now, using a placeholder - replace with actual implementation
      const response = await apiClient.get('/dashboard/rates');
      
      if (response.success && response.data?.ngnzExchangeRate) {
        console.log('✅ NGNZ exchange rate retrieved:', response.data.ngnzExchangeRate);
        return { success: true, data: response.data.ngnzExchangeRate };
      } else {
        console.log('❌ Failed to get NGNZ exchange rate');
        return { success: false, error: 'Failed to get NGNZ exchange rate' };
      }

    } catch (error) {
      console.log('❌ Get NGNZ exchange rate error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Calculate onramp amount (NGNZ to crypto)
   */
  calculateOnrampAmount(ngnzAmount, cryptoPrice, ngnzRate) {
    try {
      if (!ngnzAmount || !cryptoPrice || !ngnzRate || ngnzAmount <= 0) {
        return 0;
      }
      
      // Convert NGNZ to USD first, then to crypto
      const usdValue = ngnzAmount / ngnzRate;
      const cryptoAmount = usdValue / cryptoPrice;
      
      return cryptoAmount;
    } catch (error) {
      console.log('❌ Calculate onramp amount error:', error);
      return 0;
    }
  },

  /**
   * Calculate offramp amount (crypto to NGNZ)
   */
  calculateOfframpAmount(cryptoAmount, cryptoPrice, ngnzRate) {
    try {
      if (!cryptoAmount || !cryptoPrice || !ngnzRate || cryptoAmount <= 0) {
        return 0;
      }
      
      // Convert crypto to USD first, then to NGNZ
      const usdValue = cryptoAmount * cryptoPrice;
      const ngnzAmount = usdValue * ngnzRate;
      
      return ngnzAmount;
    } catch (error) {
      console.log('❌ Calculate offramp amount error:', error);
      return 0;
    }
  },

  /**
   * Validate NGNZ swap
   */
  validateNGNZSwap(from, to) {
    const fromUpper = from?.toUpperCase();
    const toUpper = to?.toUpperCase();
    
    if (!fromUpper || !toUpper) {
      return {
        success: false,
        error: 'Both from and to currencies are required.'
      };
    }
    
    // One must be NGNZ, but not both
    if (fromUpper !== 'NGNZ' && toUpper !== 'NGNZ') {
      return {
        success: false,
        error: 'One currency must be NGNZ for NGNZ swaps.'
      };
    }
    
    if (fromUpper === 'NGNZ' && toUpper === 'NGNZ') {
      return {
        success: false,
        error: 'Cannot swap NGNZ to NGNZ.'
      };
    }
    
    const isOnramp = fromUpper === 'NGNZ';
    const isOfframp = toUpper === 'NGNZ';
    const cryptoCurrency = isOnramp ? toUpper : fromUpper;
    
    // Validate crypto currency
    const supportedCryptos = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'AVAX', 'BNB', 'MATIC'];
    if (!supportedCryptos.includes(cryptoCurrency)) {
      return {
        success: false,
        error: `${cryptoCurrency} is not supported for NGNZ swaps.`
      };
    }
    
    return {
      success: true,
      isOnramp,
      isOfframp,
      cryptoCurrency,
      flow: isOnramp ? 'ONRAMP' : 'OFFRAMP'
    };
  },

  /**
   * Manual balance refresh (for user-triggered refresh)
   */
  async refreshBalancesManually() {
    try {
      console.log('🔄 Manually refreshing NGNZ balances...');
      
      await balanceService.clearAllCache();
      const freshBalances = await balanceService.refreshBalances();
      
      if (freshBalances.success) {
        console.log('✅ Manual NGNZ balance refresh successful');
        return { success: true, data: freshBalances.data };
      } else {
        console.log('❌ Manual NGNZ balance refresh failed:', freshBalances.error);
        return { success: false, error: 'Failed to refresh balances' };
      }
      
    } catch (error) {
      console.log('❌ Manual NGNZ refresh error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
};