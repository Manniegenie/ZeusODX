import { useState, useEffect, useMemo } from 'react';
import { ngnzService } from '../services/ngnzService';
import { useDashboard } from './useDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useNGNZ() {
  // NGNZ swap state
  const [currentQuote, setCurrentQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  const [swapFlow, setSwapFlow] = useState(null); // 'ONRAMP' or 'OFFRAMP'

  const [ngnzSwapHistory] = useState([]); // Removed unused setter
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Get NGNZ and crypto data from dashboard
  const {
    // NGNZ specific
    ngnzExchangeRate,
    ngnzBalance,
    // Crypto prices for calculations
    btcPrice,
    ethPrice,
    solPrice,
    usdtPrice,
    usdcPrice,
    trxPrice,
    bnbPrice,
    maticPrice,
    // Crypto balances for offramp
    btcBalance,
    ethBalance,
    solBalance,
    usdtBalance,
    usdcBalance,
    trxBalance,
    bnbBalance,
    maticBalance,
  } = useDashboard();

  // Crypto prices mapping for NGNZ calculations
  const cryptoPrices = useMemo(() => {
    return {
      'btc': btcPrice || 0,
      'eth': ethPrice || 0,
      'sol': solPrice || 0,
      'usdt': usdtPrice || 0,
      'usdc': usdcPrice || 0,
      'trx': trxPrice || 0,
      'bnb': bnbPrice || 0,
      'matic': maticPrice || 0,
    };
  }, [
    btcPrice, ethPrice, solPrice, usdtPrice, usdcPrice,
    trxPrice, bnbPrice, maticPrice
  ]);

  // Crypto balances for offramp operations
  const cryptoBalances = useMemo(() => {
    return {
      'btc': btcBalance?.balance || 0,
      'eth': ethBalance?.balance || 0,
      'sol': solBalance?.balance || 0,
      'usdt': usdtBalance?.balance || 0,
      'usdc': usdcBalance?.balance || 0,
      'trx': trxBalance?.balance || 0,
      'bnb': bnbBalance?.balance || 0,
      'matic': maticBalance?.balance || 0,
    };
  }, [
    btcBalance, ethBalance, solBalance, usdtBalance, usdcBalance,
    trxBalance, bnbBalance, maticBalance
  ]);

  // Supported cryptocurrencies for NGNZ swaps
  const supportedCryptos = useMemo(() => [
    'BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'TRX', 'BNB', 'MATIC'
  ], []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
        setAuthChecked(true);
      } catch (_error) {
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    };

    checkAuthentication();
  }, []);

  // Load supported currencies when authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      console.log('✅ NGNZ service ready for authenticated user');
      loadSupportedCurrencies();
    } else if (authChecked && !isAuthenticated) {
      console.log('❌ User not authenticated for NGNZ swaps');
    }
  }, [authChecked, isAuthenticated]);

  /**
   * Load supported currencies for NGNZ swaps
   */
  const loadSupportedCurrencies = async () => {
    try {
      const result = await ngnzService.getSupportedCurrencies();
      if (result.success) {
        setSupportedCurrencies(result.data);
      }
    } catch (_error) {
      console.log('❌ Failed to load supported currencies:', _error);
    }
  };

  /**
   * Validate NGNZ swap
   */
  const validateNGNZSwap = (from, to) => {
    return ngnzService.validateNGNZSwap(from, to);
  };

  /**
   * Create an NGNZ swap quote
   */
  const createQuote = async (from, to, amount, side) => {
    try {
      setQuoteLoading(true);
      setQuoteError(null);
      setCurrentQuote(null);
      setSwapFlow(null);

      // Basic validation
      if (!from || !to || !amount || !side) {
        const error = 'Missing required fields: from, to, amount, side';
        setQuoteError(error);
        return { success: false, error };
      }

      if (typeof amount !== 'number' || amount <= 0) {
        const error = 'Amount must be a positive number';
        setQuoteError(error);
        return { success: false, error };
      }

      if (side !== 'BUY' && side !== 'SELL') {
        const error = 'Side must be BUY or SELL';
        setQuoteError(error);
        return { success: false, error };
      }

      // Validate NGNZ swap
      const validation = validateNGNZSwap(from, to);
      if (!validation.success) {
        setQuoteError(validation.error);
        return validation;
      }

      setSwapFlow(validation.flow);

      // Create the NGNZ quote
      const result = await ngnzService.createQuote(from, to, amount, side);
      
      if (result.success) {
        setCurrentQuote(result.data);
        console.log(`✅ NGNZ ${validation.flow} quote created successfully`);
        return { success: true, data: result.data, flow: validation.flow };
      } else {
        setQuoteError(result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      const errorMessage = error.message || 'Failed to create NGNZ swap quote';
      setQuoteError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setQuoteLoading(false);
    }
  };

  /**
   * Accept an NGNZ swap quote
   */
  const acceptQuote = async (quoteId) => {
    try {
      setAcceptLoading(true);
      setAcceptError(null);

      const result = await ngnzService.acceptQuote(quoteId);
      
      if (result.success) {
        // Clear current quote after acceptance
        setCurrentQuote(null);
        setSwapFlow(null);
        console.log(`✅ NGNZ ${result.flow || 'swap'} executed successfully`);
        return { success: true, data: result.data };
      } else {
        setAcceptError(result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      const errorMessage = error.message || 'Failed to accept NGNZ swap quote';
      setAcceptError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAcceptLoading(false);
    }
  };

  /**
   * Calculate onramp amount (NGNZ to crypto)
   */
  const calculateOnrampAmount = (ngnzAmount, cryptoSymbol) => {
    try {
      if (!ngnzAmount || ngnzAmount <= 0) return 0;
      
      const cryptoPrice = cryptoPrices[cryptoSymbol?.toLowerCase()];
      const rate = ngnzExchangeRate || 0;
      
      return ngnzService.calculateOnrampAmount(ngnzAmount, cryptoPrice, rate);
    } catch (_error) {
      return 0;
    }
  };

  /**
   * Calculate offramp amount (crypto to NGNZ)
   */
  const calculateOfframpAmount = (cryptoAmount, cryptoSymbol) => {
    try {
      if (!cryptoAmount || cryptoAmount <= 0) return 0;
      
      const cryptoPrice = cryptoPrices[cryptoSymbol?.toLowerCase()];
      const rate = ngnzExchangeRate || 0;
      
      return ngnzService.calculateOfframpAmount(cryptoAmount, cryptoPrice, rate);
    } catch (_error) {
      return 0;
    }
  };

  /**
   * Get NGNZ balance
   */
  const getNGNZBalance = () => {
    return ngnzBalance?.balance || 0;
  };

  /**
   * Get crypto balance for offramp
   */
  const getCryptoBalance = (cryptoSymbol) => {
    return cryptoBalances[cryptoSymbol?.toLowerCase()] || 0;
  };

  /**
   * Get crypto price
   */
  const getCryptoPrice = (cryptoSymbol) => {
    return cryptoPrices[cryptoSymbol?.toLowerCase()] || 0;
  };

  /**
   * Get NGNZ exchange rate
   */
  const getNGNZRate = () => {
    return ngnzExchangeRate || 0;
  };

  /**
   * Check if user has sufficient balance for the operation
   */
  const hasSufficientBalance = (from, amount) => {
    const fromUpper = from?.toUpperCase();
    
    if (fromUpper === 'NGNZ') {
      // Onramp: Check NGNZ balance
      return getNGNZBalance() >= amount;
    } else {
      // Offramp: Check crypto balance
      return getCryptoBalance(from) >= amount;
    }
  };

  /**
   * Clear current quote
   */
  const clearQuote = () => {
    setCurrentQuote(null);
    setQuoteError(null);
    setAcceptError(null);
    setSwapFlow(null);
  };

  /**
   * Check if NGNZ swap is ready
   */
  const isSwapReady = (fromToken, toToken, amount) => {
    // Validate NGNZ swap
    const validation = validateNGNZSwap(fromToken, toToken);
    if (!validation.success) {
      return false;
    }

    return fromToken && 
           toToken && 
           amount > 0 && 
           hasSufficientBalance(fromToken, amount) &&
           !quoteLoading && 
           !acceptLoading;
  };

  /**
   * Format amount for display
   */
  const formatAmount = (amount, decimals = 8) => {
    try {
      if (!amount || amount === 0) return '0';
      
      // Use fewer decimals for NGNZ (currency)
      if (decimals === 'auto') {
        decimals = amount >= 1 ? 2 : 8;
      }
      
      return parseFloat(amount).toFixed(decimals);
    } catch (_error) {
      return '0';
    }
  };

  /**
   * Format NGNZ amount (currency format)
   */
  const formatNGNZAmount = (amount) => {
    return formatAmount(amount, 2);
  };

  /**
   * Get swap operation type
   */
  const getSwapType = (from, to) => {
    const validation = validateNGNZSwap(from, to);
    if (!validation.success) return null;
    
    return validation.flow; // 'ONRAMP' or 'OFFRAMP'
  };

  /**
   * Check if a crypto is supported for NGNZ swaps
   */
  const isSupportedCrypto = (cryptoSymbol) => {
    return supportedCryptos.includes(cryptoSymbol?.toUpperCase());
  };

  /**
   * Get minimum swap amounts (you can configure these)
   */
  const getMinimumSwapAmount = (currency) => {
    const minimums = {
      'NGNZ': 1000, // Minimum 1,000 NGNZ for onramp
      'BTC': 0.0001,
      'ETH': 0.001,
      'SOL': 0.1,
      'USDT': 10,
      'USDC': 10,
      'TRX': 10,
      'BNB': 0.01,
      'MATIC': 1
    };
    
    return minimums[currency?.toUpperCase()] || 0;
  };

  /**
   * Validate swap amount against minimums
   */
  const validateSwapAmount = (currency, amount) => {
    const minimum = getMinimumSwapAmount(currency);
    
    if (amount < minimum) {
      return {
        success: false,
        error: `Minimum swap amount for ${currency} is ${minimum}`
      };
    }
    
    return { success: true };
  };

  return {
    // Quote state
    currentQuote,
    quoteLoading,
    quoteError,
    acceptLoading,
    acceptError,
    swapFlow,
    
    // Auth state
    isAuthenticated,
    authChecked,
    
    // Data
    ngnzSwapHistory,
    supportedCurrencies,
    supportedCryptos,
    cryptoPrices,
    cryptoBalances,
    
    // NGNZ specific data
    ngnzBalance: getNGNZBalance(),
    ngnzExchangeRate: getNGNZRate(),
    
    // Actions
    createQuote,
    acceptQuote,
    clearQuote,
    
    // Calculations
    calculateOnrampAmount,
    calculateOfframpAmount,
    
    // Utilities
    getNGNZBalance,
    getCryptoBalance,
    getCryptoPrice,
    getNGNZRate,
    hasSufficientBalance,
    isSwapReady,
    formatAmount,
    formatNGNZAmount,
    getSwapType,
    isSupportedCrypto,
    getMinimumSwapAmount,
    validateSwapAmount,
    validateNGNZSwap,
  };
}