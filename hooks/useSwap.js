import { useState, useEffect, useMemo } from 'react';
import { swapService } from '../services/swapService';
import { useDashboard } from './useDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSwap() {
  // Swap state
  const [currentQuote, setCurrentQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  const [swapHistory] = useState([]); // Removed unused setter
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Get crypto market data and balances from dashboard (excluding NGNZ)
  const {
    btcPrice,
    ethPrice,
    solPrice,
    usdtPrice,
    usdcPrice,
    avaxPrice,
    bnbPrice,
    maticPrice,
    // Crypto Balances only
    btcBalance,
    ethBalance,
    solBalance,
    usdtBalance,
    usdcBalance,
    avaxBalance,
    bnbBalance,
    maticBalance,
  } = useDashboard();

  // Crypto token price mapping (excluding NGNZ)
  const tokenPrices = useMemo(() => {
    return {
      'btc': btcPrice || 0,
      'eth': ethPrice || 0,
      'sol': solPrice || 0,
      'usdt': usdtPrice || 0,
      'usdc': usdcPrice || 0,
      'avax': avaxPrice || 0,
      'bnb': bnbPrice || 0,
      'matic': maticPrice || 0,
    };
  }, [
    btcPrice, ethPrice, solPrice, usdtPrice, usdcPrice,
    avaxPrice, bnbPrice, maticPrice
  ]);

  // Crypto token balance mapping (excluding NGNZ)
  const tokenBalances = useMemo(() => {
    return {
      'btc': btcBalance?.balance || 0,
      'eth': ethBalance?.balance || 0,
      'sol': solBalance?.balance || 0,
      'usdt': usdtBalance?.balance || 0,
      'usdc': usdcBalance?.balance || 0,
      'avax': avaxBalance?.balance || 0,
      'bnb': bnbBalance?.balance || 0,
      'matic': maticBalance?.balance || 0,
    };
  }, [
    btcBalance, ethBalance, solBalance, usdtBalance, usdcBalance,
    avaxBalance, bnbBalance, maticBalance
  ]);

  // Supported crypto currencies for swapping
  const supportedCryptos = useMemo(() => [
    'BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'AVAX', 'BNB', 'MATIC'
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

  // Load data only after authentication is confirmed
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      // Authentication confirmed, crypto swap service ready
      console.log('✅ Crypto swap service ready for authenticated user');
    } else if (authChecked && !isAuthenticated) {
      // User not authenticated, skip data load
      console.log('❌ User not authenticated for crypto swaps');
    }
  }, [authChecked, isAuthenticated]);

  /**
   * Validate crypto swap currencies
   */
  const validateCryptoSwap = (from, to) => {
    // Check for NGNZ
    if (from?.toUpperCase() === 'NGNZ' || to?.toUpperCase() === 'NGNZ') {
      return {
        success: false,
        error: 'NGNZ swaps are not supported in crypto-to-crypto service. Use NGNZ swap service instead.'
      };
    }

    // Check if currencies are supported
    const fromUpper = from?.toUpperCase();
    const toUpper = to?.toUpperCase();

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
  };

  /**
   * Create a crypto-to-crypto quote
   */
  const createQuote = async (from, to, amount, side) => {
    try {
      setQuoteLoading(true);
      setQuoteError(null);
      setCurrentQuote(null);

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

      if (from === to) {
        const error = 'From and To tokens cannot be the same';
        setQuoteError(error);
        return { success: false, error };
      }

      // Validate crypto swap (no NGNZ)
      const validation = validateCryptoSwap(from, to);
      if (!validation.success) {
        setQuoteError(validation.error);
        return validation;
      }

      // Create the crypto quote
      const result = await swapService.createQuote(from, to, amount, side);
      
      if (result.success) {
        setCurrentQuote(result.data);
        console.log('✅ Crypto swap quote created successfully');
        return { success: true, data: result.data };
      } else {
        setQuoteError(result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      const errorMessage = error.message || 'Failed to create crypto swap quote';
      setQuoteError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setQuoteLoading(false);
    }
  };

  /**
   * Accept a crypto-to-crypto quote
   */
  const acceptQuote = async (quoteId) => {
    try {
      setAcceptLoading(true);
      setAcceptError(null);

      const result = await swapService.acceptQuote(quoteId);
      
      if (result.success) {
        // Clear current quote after acceptance
        setCurrentQuote(null);
        console.log('✅ Crypto swap executed successfully');
        return { success: true, data: result.data };
      } else {
        setAcceptError(result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      const errorMessage = error.message || 'Failed to accept crypto swap quote';
      setAcceptError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAcceptLoading(false);
    }
  };

  /**
   * Calculate crypto swap amount (client-side estimation)
   */
  const calculateSwapAmount = (fromAmount, fromToken, toToken) => {
    try {
      // Validate tokens are supported crypto
      const validation = validateCryptoSwap(fromToken, toToken);
      if (!validation.success) {
        return 0;
      }

      const fromPrice = tokenPrices[fromToken?.toLowerCase()];
      const toPrice = tokenPrices[toToken?.toLowerCase()];

      if (!fromPrice || !toPrice || !fromAmount || fromAmount <= 0) {
        return 0;
      }

      const usdValue = fromAmount * fromPrice;
      const toAmount = usdValue / toPrice;
      
      return toAmount;
    } catch (_error) {
      return 0;
    }
  };

  /**
   * Calculate USD value of an amount
   */
  const calculateUSDValue = (amount, tokenSymbol) => {
    try {
      if (!amount || amount <= 0) return 0;
      
      const price = getTokenPrice(tokenSymbol);
      return amount * price;
    } catch (_error) {
      return 0;
    }
  };

  /**
   * Get crypto token balance
   */
  const getTokenBalance = (tokenSymbol) => {
    // Check if it's a supported crypto
    if (!supportedCryptos.includes(tokenSymbol?.toUpperCase())) {
      return 0;
    }
    return tokenBalances[tokenSymbol?.toLowerCase()] || 0;
  };

  /**
   * Get crypto token price
   */
  const getTokenPrice = (tokenSymbol) => {
    // Check if it's a supported crypto
    if (!supportedCryptos.includes(tokenSymbol?.toUpperCase())) {
      return 0;
    }
    return tokenPrices[tokenSymbol?.toLowerCase()] || 0;
  };

  /**
   * Check if user has sufficient crypto balance
   */
  const hasSufficientBalance = (tokenSymbol, amount) => {
    const balance = getTokenBalance(tokenSymbol);
    return balance >= amount;
  };

  /**
   * Clear current quote
   */
  const clearQuote = () => {
    setCurrentQuote(null);
    setQuoteError(null);
    setAcceptError(null);
  };

  /**
   * Check if crypto swap is ready
   */
  const isSwapReady = (fromToken, toToken, amount) => {
    // Validate crypto swap
    const validation = validateCryptoSwap(fromToken, toToken);
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
   * Format crypto swap amount for display
   */
  const formatSwapAmount = (amount, decimals = 8) => {
    try {
      if (!amount || amount === 0) return '0';
      return parseFloat(amount).toFixed(decimals);
    } catch (_error) {
      return '0';
    }
  };

  /**
   * Format USD amount for display
   */
  const formatUSDAmount = (amount, decimals = 2) => {
    try {
      if (!amount || amount === 0) return '0.00';
      return parseFloat(amount).toFixed(decimals);
    } catch (_error) {
      return '0.00';
    }
  };

  /**
   * Get list of supported cryptocurrencies
   */
  const getSupportedCryptos = () => {
    return supportedCryptos;
  };

  /**
   * Check if a token is supported for crypto swaps
   */
  const isSupportedCrypto = (tokenSymbol) => {
    return supportedCryptos.includes(tokenSymbol?.toUpperCase());
  };

  /**
   * Get swap operation type (always crypto for this hook)
   */
  const getSwapType = () => {
    return 'CRYPTO_TO_CRYPTO';
  };

  return {
    // Quote state
    currentQuote,
    quoteLoading,
    quoteError,
    acceptLoading,
    acceptError,
    
    // Auth state
    isAuthenticated,
    authChecked,
    
    // Data (crypto only)
    swapHistory,
    tokenPrices,
    tokenBalances,
    supportedCryptos,
    
    // Actions
    createQuote,
    acceptQuote,
    clearQuote,
    
    // Utilities
    calculateSwapAmount,
    calculateUSDValue,
    getTokenBalance,
    getTokenPrice,
    hasSufficientBalance,
    isSwapReady,
    formatSwapAmount,
    formatUSDAmount,
    getSupportedCryptos,
    isSupportedCrypto,
    validateCryptoSwap,
    getSwapType,
  };
}