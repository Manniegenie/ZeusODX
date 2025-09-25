// app/user/Swap.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  ScrollView,
  TextInput
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { useSwap } from '../../hooks/useSwap';
import { useNGNZ } from '../../hooks/useNGNZ';
import BottomTabNavigator from '../../components/BottomNavigator';
import ChooseTokenModal from '../../components/ChooseTokenModal';
import SwapSuccessfulScreen from '../../components/SwapSuccess';
import SwapPreviewModal from '../../components/SwapPreview';
import ErrorDisplay from '../../components/ErrorDisplay';

// Asset imports
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const solIcon = require('../../components/icons/sol-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');
const ngnzIcon = require('../../components/icons/NGNZ.png');
const avaxIcon = require('../../components/icons/avax-icon.png');
const bnbIcon = require('../../components/icons/bnb-icon.png');
const swapIcon = require('../../components/icons/swap-icon.png');
const maticIcon = require('../../components/icons/matic-icon.png');

interface SwapScreenProps {
  onBack?: () => void;
  onSelectToken?: () => void;
  onSwap?: () => void;
}

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  price?: number;
  balance?: number;
}

type SwapTab = 'buy-sell';
type TokenSelectorType = 'from' | 'to';
type MessageType = 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance' | 'success';

// Token categorization for swap validation
const STABLECOINS = new Set(['USDT', 'USDC']);
const CRYPTOCURRENCIES = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX']);

export default function SwapScreen({ 
  onBack, 
  onSelectToken, 
  onSwap 
}: SwapScreenProps) {
  const { defaultToken } = useLocalSearchParams(); // Capture passed token (e.g., BTC, ETH, BNB, AVAX...)

  const [activeTab, setActiveTab] = useState<SwapTab>('buy-sell');

  // Visible string that user sees (with commas / truncated decimals)
  const [fromAmount, setFromAmount] = useState('0');
  // Raw numeric amount used for backend ops (full precision)
  const [fromAmountRaw, setFromAmountRaw] = useState<number | null>(null);

  const [toAmount, setToAmount] = useState('0');
  const [toAmountRaw, setToAmountRaw] = useState<number | null>(null);

  const [selectedFromToken, setSelectedFromToken] = useState<TokenOption | null>(null);
  const [selectedToToken, setSelectedToToken] = useState<TokenOption | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>('from');

  // Message state for ErrorDisplay
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>('general');
  const [showMessage, setShowMessage] = useState(false);
  const [messageTitle, setMessageTitle] = useState<string | undefined>(undefined);

  const { 
    btcBalance, btcPrice,
    ethBalance, ethPrice,
    solBalance, solPrice,
    usdtBalance, usdtPrice,
    usdcBalance, usdcPrice,
    ngnzBalance, ngnzExchangeRate,
    refreshDashboard,
  } = useDashboard();

  const {
    currentQuote: cryptoQuote,
    quoteLoading: cryptoQuoteLoading,
    acceptLoading: cryptoAcceptLoading,
    createQuote: createCryptoQuote,
    acceptQuote: acceptCryptoQuote,
    clearQuote: clearCryptoQuote,
    getTokenBalance: getCryptoTokenBalance,
    getTokenPrice: getCryptoTokenPrice,
    hasSufficientBalance: hasCryptoSufficientBalance,
  } = useSwap();

  const {
    currentQuote: ngnzQuote,
    quoteLoading: ngnzQuoteLoading,
    acceptLoading: ngnzAcceptLoading,
    createQuote: createNGNZQuote,
    acceptQuote: acceptNGNZQuote,
    clearQuote: clearNGNZQuote,
    getNGNZBalance,
    getCryptoBalance: getNGNZCryptoBalance,
    getCryptoPrice: getNGNZCryptoPrice,
    getNGNZRate,
    hasSufficientBalance: hasNGNZSufficientBalance,
  } = useNGNZ();

  // Message handling functions
  const clearMessage = () => {
    setMessage(null);
    setShowMessage(false);
    setMessageTitle(undefined);
  };

  const showError = (message: string, type: MessageType = 'general', title?: string) => {
    setMessage(message);
    setMessageType(type);
    setMessageTitle(title);
    setShowMessage(true);
  };

  const showSuccess = (message: string, title?: string) => {
    setMessage(message);
    setMessageType('success');
    setMessageTitle(title);
    setShowMessage(true);
  };

  // Swap pair validation
  const validateSwapPair = (fromToken: string, toToken: string): { success: boolean; message?: string } => {
    if (!fromToken || !toToken) {
      return { success: false, message: 'Please select both tokens' };
    }

    if (fromToken === toToken) {
      return { success: false, message: 'Cannot swap the same token' };
    }

    // NGNZ operations use different system - allow any NGNZ pair
    if (fromToken === 'NGNZ' || toToken === 'NGNZ') {
      return { success: true };
    }

    const fromIsStablecoin = STABLECOINS.has(fromToken);
    const toIsStablecoin = STABLECOINS.has(toToken);
    const fromIsCrypto = CRYPTOCURRENCIES.has(fromToken);
    const toIsCrypto = CRYPTOCURRENCIES.has(toToken);

    // Only allow crypto to stablecoin or stablecoin to crypto
    if ((fromIsCrypto && toIsStablecoin) || (fromIsStablecoin && toIsCrypto)) {
      return { success: true };
    }

    // Block crypto to crypto swaps
    if (fromIsCrypto && toIsCrypto) {
      return {
        success: false,
        message: 'Direct crypto-to-crypto swaps are not supported. Please swap through a stablecoin (USDT or USDC) first.'
      };
    }

    // Block stablecoin to stablecoin swaps
    if (fromIsStablecoin && toIsStablecoin) {
      return {
        success: false,
        message: 'Stablecoin-to-stablecoin swaps are not supported.'
      };
    }

    return {
      success: false,
      message: 'Invalid swap pair. Only crypto-to-stablecoin and stablecoin-to-crypto swaps are allowed.'
    };
  };

  // Get valid destination tokens based on selected "from" token
  const getValidToTokens = (fromToken: string | null): string[] => {
    if (!fromToken) return [];

    // NGNZ can swap with both crypto and stablecoins
    if (fromToken === 'NGNZ') {
      return [...Array.from(CRYPTOCURRENCIES), ...Array.from(STABLECOINS)];
    }

    // Crypto can swap with NGNZ or stablecoins
    if (CRYPTOCURRENCIES.has(fromToken)) {
      return ['NGNZ', ...Array.from(STABLECOINS)];
    }

    // Stablecoins can swap with NGNZ or crypto
    if (STABLECOINS.has(fromToken)) {
      return ['NGNZ', ...Array.from(CRYPTOCURRENCIES)];
    }

    return [];
  };

  const isNGNZOperation = () => selectedFromToken?.symbol === 'NGNZ' || selectedToToken?.symbol === 'NGNZ';
  const getCurrentQuote = () => (isNGNZOperation() ? ngnzQuote : cryptoQuote);
  const getLoadingStates = () => isNGNZOperation() 
    ? { quoteLoading: ngnzQuoteLoading, acceptLoading: ngnzAcceptLoading } 
    : { quoteLoading: cryptoQuoteLoading, acceptLoading: cryptoAcceptLoading };

  const getTokenBalance = (symbol: string) => {
    if (symbol === 'NGNZ') return getNGNZBalance();
    if (isNGNZOperation()) return getNGNZCryptoBalance(symbol);
    return getCryptoTokenBalance(symbol);
  };
  
  const getTokenPrice = (symbol: string) => {
    if (symbol === 'NGNZ') return getNGNZRate();
    if (isNGNZOperation()) return getNGNZCryptoPrice(symbol);
    return getCryptoTokenPrice(symbol);
  };
  
  const hasSufficientBalance = (symbol: string, amount: number) => isNGNZOperation()
    ? hasNGNZSufficientBalance(symbol, amount)
    : hasCryptoSufficientBalance(symbol, amount);

  const clearQuote = () => (isNGNZOperation() ? clearNGNZQuote() : clearCryptoQuote());
  
  const getTokenIcon = (id: string) => ({
    btc: btcIcon,
    eth: ethIcon,
    sol: solIcon,
    usdt: usdtIcon,
    usdc: usdcIcon,
    ngnz: ngnzIcon,
    avax: avaxIcon,
    bnb: bnbIcon,
    matic: maticIcon
  }[id] || btcIcon);

  // Set default token based on navigation param
  useEffect(() => {
    if (!selectedFromToken) {
      const tokenMap: { [key: string]: TokenOption } = {
        BTC: { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: btcIcon, price: btcPrice, balance: btcBalance?.balance || 0 },
        ETH: { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: ethIcon, price: ethPrice, balance: ethBalance?.balance || 0 },
        SOL: { id: 'sol', name: 'Solana', symbol: 'SOL', icon: solIcon, price: solPrice, balance: solBalance?.balance || 0 },
        USDT: { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: usdtIcon, price: usdtPrice, balance: usdtBalance?.balance || 0 },
        USDC: { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: usdcIcon, price: usdcPrice, balance: usdcBalance?.balance || 0 },
        NGNZ: { id: 'ngnz', name: 'Nigerian Naira', symbol: 'NGNZ', icon: ngnzIcon, price: ngnzExchangeRate, balance: ngnzBalance || 0 },
        AVAX: { id: 'avax', name: 'Avalanche', symbol: 'AVAX', icon: avaxIcon, price: 0, balance: 0 },
        BNB: { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', icon: bnbIcon, price: 0, balance: 0 },
        MATIC: { id: 'matic', name: 'Polygon', symbol: 'MATIC', icon: maticIcon, price: 0, balance: 0 },
      };
      
      if (defaultToken && tokenMap[defaultToken]) {
        setSelectedFromToken(tokenMap[defaultToken]);
      } else if (btcPrice > 0) {
        setSelectedFromToken(tokenMap['BTC']);
      }
    }
  }, [defaultToken, btcPrice, ethPrice, solPrice, usdtPrice, usdcPrice, ngnzExchangeRate, btcBalance, ethBalance, solBalance, usdtBalance, usdcBalance, ngnzBalance]);

  // Clear "to" token when "from" token changes to ensure valid pairs
  useEffect(() => {
    if (selectedFromToken && selectedToToken) {
      const validation = validateSwapPair(selectedFromToken.symbol, selectedToToken.symbol);
      if (!validation.success) {
        setSelectedToToken(null);
        setToAmount('0');
        setToAmountRaw(null);
        clearQuote();
      }
    }
  }, [selectedFromToken]);

  // Helpers to format numbers with commas
  const formatWithCommas = (value: string): string => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    if (isNaN(Number(numericValue))) return value;
    const [integer, decimal] = numericValue.split('.');
    const formattedInt = Number(integer).toLocaleString('en-US');
    return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
  };
  
  const unformat = (value: string): string => value.replace(/,/g, '');

  // Updated formatDisplayAmount function to show precise decimals without rounding
  const formatDisplayAmount = (amount: string | number): string => {
    const num = parseFloat(String(amount));
    
    // Return '0' if amount is invalid or zero
    if (!num || num === 0 || isNaN(num)) return '0';
    
    // For whole numbers, show as integer (e.g., 5 shows as "5")
    if (Number.isInteger(num)) {
      return num.toString();
    }
    
    const numStr = num.toString();
    const [integerPart, decimalPart] = numStr.split('.');
    
    if (!decimalPart) return numStr;
    
    // For numbers less than 1, show more significant digits
    if (Math.abs(num) < 1) {
      // Find first non-zero digit position
      let firstNonZeroIndex = -1;
      for (let i = 0; i < decimalPart.length; i++) {
        if (decimalPart[i] !== '0') {
          firstNonZeroIndex = i;
          break;
        }
      }
      
      if (firstNonZeroIndex !== -1) {
        // For very small numbers (< 0.0001), show first significant digit
        if (Math.abs(num) < 0.0001) {
          const truncatedDecimals = decimalPart.substring(0, firstNonZeroIndex + 1);
          return `${integerPart}.${truncatedDecimals}`;
        }
        // For small numbers (< 1 but >= 0.0001), show more digits for readability
        // e.g., 0.003935... -> 0.003935, 0.123456 -> 0.123456
        const endIndex = Math.min(firstNonZeroIndex + 6, decimalPart.length);
        const truncatedDecimals = decimalPart.substring(0, endIndex);
        return `${integerPart}.${truncatedDecimals}`;
      }
    }
    
    // For numbers >= 1, truncate to first decimal place without rounding
    // (e.g., 1.789 -> 1.7, 12.456 -> 12.4)
    const truncatedDecimals = decimalPart.substring(0, 1);
    return `${integerPart}.${truncatedDecimals}`;
  };

  // Format the exact max amount for display (trim trailing zeros but keep up to 8 decimals)
  const formatMaxAmount = (value: number): string => {
    if (!value || isNaN(value) || value === 0) return '0';
    // Use up to 8 decimals for tokens; strip trailing zeros
    const s = value.toFixed(8).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    return s;
  };

  const formatUsdValue = (amount: string, token: TokenOption | null): string => {
    const val = parseFloat(unformat(amount)) || 0;
    
    // Return $0.00 if amount is invalid or zero
    if (!val || isNaN(val) || val <= 0) {
      return '$0.00';
    }
    
    if (token?.symbol === 'NGNZ') {
      // Use NGNZ exchange rate to convert to USD
      const exchangeRate = ngnzExchangeRate;
      
      // Handle cases where exchange rate is not available yet
      if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
        return '$0.00';
      }
      
      // For NGNZ: divide by exchange rate to get USD value
      const usdValue = val / exchangeRate;
      return '$' + usdValue.toFixed(4); // Show 4 decimal places for USD value
    }
    
    // For all other tokens, use their current price
    const price = token?.price || 0;
    
    // Handle cases where price is not available yet
    if (!price || isNaN(price) || price <= 0) {
      return '$0.00';
    }
    
    const usdValue = val * price;
    return '$' + usdValue.toFixed(4); // Show 4 decimal places for USD value
  };

  const getMaxBalance = (token: TokenOption | null): string => {
    if (!token) return '0';
    const currentBalance = getTokenBalance(token.symbol);
    // Show friendly display but not necessarily full precision
    const display = formatMaxAmount(currentBalance);
    return `${display} ${token.symbol}`;
  };

  // NEW: handle when user presses MAX => keep raw precise number in fromAmountRaw but show a friendly formatted string
  const handleMax = () => {
    if (!selectedFromToken) return;
    const balance = getTokenBalance(selectedFromToken.symbol) || 0;

    // Set raw value to exact balance (used for quoting & submission)
    setFromAmountRaw(balance);

    // Format friendly display string (with commas + trimmed decimals)
    const displayStr = formatMaxAmount(balance);
    setFromAmount(formatWithCommas(displayStr));

    // clear quote & preview so a fresh quote will be created using the full balance
    clearQuote();
    setToAmount('0');
    setToAmountRaw(null);

    // Also update selectedFromToken.balance to latest
    setSelectedFromToken(prev => prev ? { ...prev, balance } : prev);
    clearMessage();
  };

  // When user types into input, update both visible string and raw numeric value
  const handleFromAmountChange = (text: string) => {
    // Keep commas in visible input
    const formatted = formatWithCommas(text);
    setFromAmount(formatted);

    // Update raw numeric value (parse without commas)
    const numeric = parseFloat(unformat(formatted));
    if (!isNaN(numeric)) {
      setFromAmountRaw(numeric);
    } else {
      setFromAmountRaw(null);
    }

    // when user types, clear quote / preview
    clearQuote();
    setToAmount('0');
    setToAmountRaw(null);
    clearMessage();
  };

  const handleCreateQuote = async () => {
    // Prefer the raw precise amount if present (max uses this); otherwise parse visible string
    const rawAmount = (typeof fromAmountRaw === 'number' && !isNaN(fromAmountRaw))
      ? fromAmountRaw
      : parseFloat(unformat(fromAmount)) || 0;
    
    // Validate tokens first
    if (!selectedFromToken || !selectedToToken) {
      showError('Please select both tokens to proceed', 'validation', 'Select Tokens');
      return;
    }

    // Validate swap pair
    const pairValidation = validateSwapPair(selectedFromToken.symbol, selectedToToken.symbol);
    if (!pairValidation.success) {
      showError(pairValidation.message || 'Invalid token pair', 'validation', 'Invalid Swap Pair');
      return;
    }

    // If amount is missing or zero, show specific message
    if (rawAmount <= 0) {
      showError('Please enter an amount to swap', 'validation', 'Enter Amount');
      return;
    }
    
    // Only check balance if a positive amount is provided
    if (!hasSufficientBalance(selectedFromToken.symbol, rawAmount)) {
      showError(
        `You don't have enough ${selectedFromToken.symbol}. Available: ${getMaxBalance(selectedFromToken)}`, 
        'balance', 
        'Insufficient Balance'
      );
      return;
    }

    try {
      let quoteResult = isNGNZOperation()
        ? await createNGNZQuote(selectedFromToken.symbol, selectedToToken.symbol, rawAmount, 'SELL')
        : await createCryptoQuote(selectedFromToken.symbol, selectedToToken.symbol, rawAmount, 'SELL');

      console.log('Quote Result:', JSON.stringify(quoteResult, null, 2)); // Debug log

      if (!quoteResult.success) {
        const errorMessage = quoteResult.error || 'Failed to create quote';
        
        // Determine error type based on error message
        let type: MessageType = 'server';
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          type = 'network';
        } else if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
          type = 'balance';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
          type = 'validation';
        }
        
        showError(errorMessage, type, 'Quote Failed');
        return;
      }

      // Extract amountReceived - try multiple possible paths
      let receiveAmount = quoteResult.data?.data?.amountReceived
        || quoteResult.data?.amountReceived
        || quoteResult.data?.data?.data?.amountReceived
        || quoteResult.amountReceived
        || quoteResult.data?.amount_received
        || quoteResult.data?.data?.amount_received;

      console.log('Extracted receiveAmount:', receiveAmount); // Debug log

      if (receiveAmount && receiveAmount > 0) {
        // store raw and formatted
        setToAmountRaw(Number(receiveAmount));
        const formattedAmount = formatWithCommas(formatDisplayAmount(receiveAmount));
        setToAmount(formattedAmount);
        console.log('Set toAmount to:', formattedAmount); // Debug log
      } else {
        console.log('No valid receiveAmount found, setting to 0'); // Debug log
        setToAmount('0');
        setToAmountRaw(null);
      }

      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error in handleCreateQuote:', error); // Debug log
      showError('An error occurred while creating the quote', 'server', 'Error');
    }
  };

  const handleAcceptQuote = async () => {
    const currentQuote = getCurrentQuote();
    if (!currentQuote) {
      showError('Please create a quote first', 'validation', 'No Quote');
      return;
    }
    
    const quoteId = currentQuote.data?.data?.id || currentQuote.data?.id || currentQuote.id;
    if (!quoteId) {
      showError('Quote ID not found.', 'validation', 'Invalid Quote');
      return;
    }

    try {
      const result = isNGNZOperation() ? await acceptNGNZQuote(quoteId) : await acceptCryptoQuote(quoteId);
      if (result.success) {
        setShowPreviewModal(false);
        setShowSuccessScreen(true);
        refreshDashboard(); // Remove await - let it happen in background
        onSwap?.();
        
        // Show success message
        const displayFrom = formatDisplayAmount(((fromAmountRaw ?? parseFloat(unformat(fromAmount))) || 0));
        const displayTo = formatDisplayAmount(((toAmountRaw ?? parseFloat(unformat(toAmount))) || 0));
        showSuccess(
          `Successfully swapped ${displayFrom} ${selectedFromToken?.symbol} to ${displayTo} ${selectedToToken?.symbol}`,
          'Swap Successful!'
        );
      } else {
        const errorMessage = result.error || 'Failed to execute swap';
        
        // Determine error type
        let type: MessageType = 'server';
        if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
          type = 'balance';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          type = 'network';
        }
        
        showError(errorMessage, type, 'Swap Failed');
      }
    } catch (error) {
      showError('An error occurred while executing the swap', 'server', 'Error');
    }
  };

  const handleSuccessScreenContinue = () => {
    setFromAmount('0'); 
    setFromAmountRaw(null);
    setToAmount('0'); 
    setToAmountRaw(null);
    setSelectedToToken(null);
    setShowSuccessScreen(false);
    clearMessage(); // Clear any lingering messages
  };

  const handleTokenSelectorPress = (type: TokenSelectorType) => { 
    setTokenSelectorType(type); 
    setShowTokenModal(true); 
    onSelectToken?.(); 
  };
  
  const handleTokenSelect = (token: TokenOption) => {
    const updated = { ...token, balance: getTokenBalance(token.symbol), price: getTokenPrice(token.symbol) };
    
    if (tokenSelectorType === 'from') {
      setSelectedFromToken(updated);
      // Clear to token if current selection would be invalid
      if (selectedToToken) {
        const validation = validateSwapPair(updated.symbol, selectedToToken.symbol);
        if (!validation.success) {
          setSelectedToToken(null);
        }
      }
    } else {
      setSelectedToToken(updated);
    }
    
    setToAmount('0'); 
    setToAmountRaw(null);
    clearQuote(); 
    setShowTokenModal(false);
    clearMessage(); // Clear any error messages when selecting new tokens
  };

  const { quoteLoading, acceptLoading } = getLoadingStates();
  const isSwapDisabled = !selectedFromToken || !selectedToToken || (((fromAmountRaw ?? parseFloat(unformat(fromAmount))) || 0) <= 0) || quoteLoading || acceptLoading;

  // The quote we pass down to the preview modal
  const currentQuote = getCurrentQuote();
  const currentQuoteLoading = getLoadingStates().quoteLoading;

  return (
    <View style={styles.container}>
      {/* Message Display */}
      {message && showMessage && (
        <ErrorDisplay
          type={messageType}
          title={messageTitle}
          message={message}
          onDismiss={clearMessage}
          autoHide={true}
          duration={messageType === 'success' ? 3000 : 4000}
        />
      )}
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.tabContainer}>
            <Text style={styles.activeTabText}>Buy/Sell</Text>
          </View>

          {/* Sell Token */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Sell</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput 
                  style={styles.amountInput} 
                  value={fromAmount}
                  onFocus={() => { 
                    if (fromAmount === '0') {
                      setFromAmount('');
                      setFromAmountRaw(null);
                    }
                    clearMessage(); // Clear messages when user starts typing
                  }}
                  onBlur={() => { if (!fromAmount) setFromAmount('0'); }}
                  onChangeText={handleFromAmountChange}
                  placeholder="0" 
                  keyboardType="decimal-pad" 
                  placeholderTextColor={Colors.text.secondary} 
                />
                <Text style={styles.usdValue}>{formatUsdValue(fromAmount, selectedFromToken)}</Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity style={styles.tokenSelector} onPress={() => handleTokenSelectorPress('from')}>
                  {selectedFromToken && (
                    <>
                      <Image source={getTokenIcon(selectedFromToken.id)} style={styles.tokenIcon} />
                      <Text style={styles.tokenText}>{selectedFromToken.symbol}</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText} numberOfLines={1}>{getMaxBalance(selectedFromToken)}</Text>
                  <TouchableOpacity onPress={handleMax}>
                    <Text style={styles.maxText}>Max</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Swap Icon */}
          <View style={styles.swapIconContainer}>
            <Image source={swapIcon} style={styles.swapIconImage} />
          </View>

          {/* Buy Token */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Buy</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput 
                  style={styles.amountInput} 
                  value={toAmount === '0' ? '0' : formatWithCommas(formatDisplayAmount(toAmount))} 
                  editable={false} 
                  placeholder="0" 
                  keyboardType="decimal-pad" 
                  placeholderTextColor={Colors.text.secondary} 
                />
                <Text style={styles.usdValue}>{formatUsdValue(toAmount, selectedToToken)}</Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity style={styles.tokenSelector} onPress={() => handleTokenSelectorPress('to')}>
                  {selectedToToken ? (
                    <>
                      <Image source={getTokenIcon(selectedToToken.id)} style={styles.tokenIcon} />
                      <Text style={styles.tokenText}>{selectedToToken.symbol}</Text>
                    </>
                  ) : (
                    <Text style={styles.tokenText}>Select token</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity 
              style={[styles.swapActionButton, isSwapDisabled && styles.swapActionButtonDisabled]} 
              onPress={handleCreateQuote} 
              disabled={isSwapDisabled}
            >
              <Text style={[styles.swapActionButtonText, isSwapDisabled && styles.swapActionButtonTextDisabled]}>
                {quoteLoading ? 'Creating Quote...' : 'Create Quote'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="swap" />

      {/* Token Modal - Pass valid tokens based on current selection */}
      <ChooseTokenModal 
        visible={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
        onTokenSelect={handleTokenSelect} 
        selectedTokenId={tokenSelectorType === 'from' ? selectedFromToken?.id : selectedToToken?.id} 
        title="Choose token" 
        showBalances={true}
        validTokens={tokenSelectorType === 'to' ? getValidToTokens(selectedFromToken?.symbol || null) : undefined}
      />

      {/* Preview Modal: Pass the exact amounts as they appear in the input fields */}
      <SwapPreviewModal 
        visible={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
        onConfirm={handleAcceptQuote}
        quote={currentQuote}
        loading={currentQuoteLoading}
        // Pass the exact amounts as displayed in the input fields without any formatting
        fromAmount={fromAmount} 
        fromToken={selectedFromToken?.symbol || ''} 
        toAmount={toAmount === '0' ? '0' : toAmount} 
        toToken={selectedToToken?.symbol || ''} 
        rate={`1 ${selectedFromToken?.symbol} = ${formatDisplayAmount( (((toAmountRaw ?? parseFloat(unformat(toAmount))) || 0) / ((fromAmountRaw ?? parseFloat(unformat(fromAmount))) || 1)) )} ${selectedToToken?.symbol}`} 
      />

      {/* Success Screen - Now renders as popup modal */}
      <SwapSuccessfulScreen 
        visible={showSuccessScreen} 
        fromAmount={formatDisplayAmount((fromAmountRaw ?? parseFloat(unformat(fromAmount))) || 0)} 
        fromToken={selectedFromToken?.symbol || ''} 
        toToken={selectedToToken?.symbol || ''} 
        onContinue={handleSuccessScreenContinue} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },
  scrollViewContent: { 
    paddingHorizontal: Layout.spacing.lg, 
    paddingBottom: 120, 
    paddingTop: Layout.spacing.xxl 
  },
  tabContainer: { 
    alignItems: 'center', 
    marginBottom: Layout.spacing.lg 
  },
  activeTabText: { 
    fontFamily: Typography.medium, 
    fontSize: 18, 
    color: Colors.text.primary 
  },
  inputContainer: { 
    marginBottom: Layout.spacing.sm 
  },
  inputLabel: { 
    fontFamily: Typography.medium, 
    fontSize: 16, 
    color: Colors.text.primary, 
    marginBottom: Layout.spacing.xs 
  },
  inputCard: { 
    backgroundColor: '#F8F9FA', 
    borderRadius: Layout.borderRadius.lg, 
    padding: Layout.spacing.md, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    minHeight: 80, 
    width: '100%' 
  },
  inputLeft: { 
    flex: 1, 
    justifyContent: 'center', 
    minWidth: 0 
  },
  inputRight: { 
    alignItems: 'flex-end', 
    justifyContent: 'center', 
    maxWidth: '50%' 
  },
  amountInput: { 
    fontFamily: Typography.medium, 
    fontSize: 24, 
    color: Colors.text.primary, 
    fontWeight: '600', 
    padding: 0, 
    margin: 0, 
    flexShrink: 1 
  },
  usdValue: { 
    fontFamily: Typography.regular, 
    fontSize: 13, 
    color: Colors.text.secondary, 
    marginTop: 3 
  },
  tokenSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E5E7EB', 
    borderRadius: Layout.borderRadius.md, 
    paddingHorizontal: Layout.spacing.sm, 
    paddingVertical: Layout.spacing.xs, 
    marginBottom: Layout.spacing.sm 
  },
  tokenIcon: { 
    width: 18, 
    height: 18, 
    resizeMode: 'cover', 
    marginRight: Layout.spacing.sm 
  },
  tokenText: { 
    fontFamily: Typography.medium, 
    fontSize: 12, 
    color: Colors.text.primary, 
    fontWeight: '600' 
  },
  balanceInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Layout.spacing.xs 
  },
  balanceText: { 
    fontFamily: Typography.regular, 
    fontSize: 10, 
    color: Colors.text.secondary 
  },
  maxText: { 
    fontFamily: Typography.medium, 
    fontSize: 10, 
    color: Colors.primary, 
    fontWeight: '600' 
  },
  swapIconContainer: { 
    alignItems: 'center', 
    marginVertical: Layout.spacing.md 
  },
  swapIconImage: { 
    width: 48, 
    height: 48, 
    resizeMode: 'contain' 
  },
  swapContainer: { 
    marginTop: Layout.spacing.lg 
  },
  swapActionButton: { 
    backgroundColor: Colors.primary, 
    borderRadius: Layout.borderRadius.lg, 
    paddingVertical: Layout.spacing.md, 
    alignItems: 'center' 
  },
  swapActionButtonDisabled: { 
    backgroundColor: '#E5E7EB' 
  },
  swapActionButtonText: { 
    fontFamily: Typography.medium, 
    fontSize: 16, 
    color: Colors.surface, 
    fontWeight: '600' 
  },
  swapActionButtonTextDisabled: { 
    color: Colors.text.secondary 
  },
});