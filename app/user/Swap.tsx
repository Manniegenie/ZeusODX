import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleProp,
  TextStyle,
  Alert,
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { useSwap } from '../../hooks/useSwap';
import { useNGNZ } from '../../hooks/useNGNZ';
import BottomTabNavigator from '../../components/BottomNavigator';
import ChooseTokenModal from '../../components/ChooseTokenModal';

// Asset imports
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const solIcon = require('../../components/icons/sol-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');
const ngnzIcon = require('../../components/icons/NGNZ.png');
const swapIcon = require('../../components/icons/swap-icon.png');

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

export default function SwapScreen({ 
  onBack, 
  onSelectToken, 
  onSwap 
}: SwapScreenProps) {
  const [activeTab, setActiveTab] = useState<SwapTab>('buy-sell');
  const [fromAmount, setFromAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [selectedFromToken, setSelectedFromToken] = useState<TokenOption | null>(null);
  const [selectedToToken, setSelectedToToken] = useState<TokenOption | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [quoteReceiveAmount, setQuoteReceiveAmount] = useState('');
  
  // Modal state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>('from');

  // Dashboard hook for prices and balances
  const { 
    btcBalance, 
    btcPrice,
    ethBalance,
    ethPrice,
    solBalance,
    solPrice,
    usdtBalance,
    usdtPrice,
    usdcBalance,
    usdcPrice,
    ngnzBalance,
    ngnzExchangeRate,
    avaxBalance,
    avaxPrice,
    bnbBalance,
    bnbPrice,
    maticBalance,
    maticPrice,
  } = useDashboard();

  // Crypto swap hook for crypto-to-crypto operations
  const {
    currentQuote: cryptoQuote,
    quoteLoading: cryptoQuoteLoading,
    quoteError: cryptoQuoteError,
    acceptLoading: cryptoAcceptLoading,
    createQuote: createCryptoQuote,
    acceptQuote: acceptCryptoQuote,
    clearQuote: clearCryptoQuote,
    getTokenBalance: getCryptoTokenBalance,
    getTokenPrice: getCryptoTokenPrice,
    hasSufficientBalance: hasCryptoSufficientBalance,
    calculateSwapAmount: calculateCryptoSwapAmount,
  } = useSwap();

  // NGNZ swap hook for NGNZ operations
  const {
    currentQuote: ngnzQuote,
    quoteLoading: ngnzQuoteLoading,
    quoteError: ngnzQuoteError,
    acceptLoading: ngnzAcceptLoading,
    swapFlow,
    createQuote: createNGNZQuote,
    acceptQuote: acceptNGNZQuote,
    clearQuote: clearNGNZQuote,
    getNGNZBalance,
    getCryptoBalance: getNGNZCryptoBalance,
    getCryptoPrice: getNGNZCryptoPrice,
    getNGNZRate,
    hasSufficientBalance: hasNGNZSufficientBalance,
    calculateOnrampAmount,
    calculateOfframpAmount,
  } = useNGNZ();

  /**
   * Determine if this is an NGNZ operation
   */
  const isNGNZOperation = () => {
    return selectedFromToken?.symbol === 'NGNZ' || selectedToToken?.symbol === 'NGNZ';
  };

  /**
   * Determine if this is an onramp operation (NGNZ → crypto)
   */
  const isOnrampOperation = () => {
    return selectedFromToken?.symbol === 'NGNZ' && selectedToToken?.symbol !== 'NGNZ';
  };

  /**
   * Determine if this is an offramp operation (crypto → NGNZ)
   */
  const isOfframpOperation = () => {
    return selectedFromToken?.symbol !== 'NGNZ' && selectedToToken?.symbol === 'NGNZ';
  };

  /**
   * Get the appropriate quote based on operation type
   */
  const getCurrentQuote = () => {
    return isNGNZOperation() ? ngnzQuote : cryptoQuote;
  };

  /**
   * Get loading states based on operation type
   */
  const getLoadingStates = () => {
    if (isNGNZOperation()) {
      return {
        quoteLoading: ngnzQuoteLoading,
        acceptLoading: ngnzAcceptLoading,
        quoteError: ngnzQuoteError,
      };
    } else {
      return {
        quoteLoading: cryptoQuoteLoading,
        acceptLoading: cryptoAcceptLoading,
        quoteError: cryptoQuoteError,
      };
    }
  };

  /**
   * Get token balance using appropriate hook
   */
  const getTokenBalance = (tokenSymbol: string) => {
    if (tokenSymbol === 'NGNZ') {
      return getNGNZBalance();
    } else if (isNGNZOperation()) {
      return getNGNZCryptoBalance(tokenSymbol);
    } else {
      return getCryptoTokenBalance(tokenSymbol);
    }
  };

  /**
   * Get token price using appropriate hook
   */
  const getTokenPrice = (tokenSymbol: string) => {
    if (tokenSymbol === 'NGNZ') {
      return getNGNZRate();
    } else if (isNGNZOperation()) {
      return getNGNZCryptoPrice(tokenSymbol);
    } else {
      return getCryptoTokenPrice(tokenSymbol);
    }
  };

  /**
   * Check sufficient balance using appropriate hook
   */
  const hasSufficientBalance = (tokenSymbol: string, amount: number) => {
    if (isNGNZOperation()) {
      return hasNGNZSufficientBalance(tokenSymbol, amount);
    } else {
      return hasCryptoSufficientBalance(tokenSymbol, amount);
    }
  };

  /**
   * Calculate swap amount using appropriate hook
   */
  const calculateSwapAmount = (fromAmount: number, fromToken: string, toToken: string) => {
    if (isNGNZOperation()) {
      if (isOnrampOperation()) {
        // NGNZ → crypto
        return calculateOnrampAmount(fromAmount, toToken);
      } else if (isOfframpOperation()) {
        // crypto → NGNZ
        return calculateOfframpAmount(fromAmount, fromToken);
      }
    } else {
      // crypto → crypto
      return calculateCryptoSwapAmount(fromAmount, fromToken, toToken);
    }
    return 0;
  };

  /**
   * Clear appropriate quote
   */
  const clearQuote = () => {
    if (isNGNZOperation()) {
      clearNGNZQuote();
    } else {
      clearCryptoQuote();
    }
  };

  // Token icon mapping
  const getTokenIcon = (tokenId: string) => {
    const iconMap: { [key: string]: any } = {
      'btc': btcIcon,
      'eth': ethIcon,
      'sol': solIcon,
      'usdt': usdtIcon,
      'usdc': usdcIcon,
      'ngnz': ngnzIcon,
    };
    return iconMap[tokenId] || btcIcon;
  };

  // Initialize with BTC as default from token
  useEffect(() => {
    if (!selectedFromToken && btcPrice > 0) {
      setSelectedFromToken({
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        icon: btcIcon,
        price: btcPrice,
        balance: btcBalance?.balance || 0,
      });
    }
  }, [btcPrice, btcBalance]);

  // Refresh token balances periodically
  useEffect(() => {
    const refreshTokenBalances = () => {
      if (selectedFromToken) {
        const newBalance = getTokenBalance(selectedFromToken.symbol);
        setSelectedFromToken(prev => prev ? { ...prev, balance: newBalance } : null);
      }
      if (selectedToToken) {
        const newBalance = getTokenBalance(selectedToToken.symbol);
        setSelectedToToken(prev => prev ? { ...prev, balance: newBalance } : null);
      }
    };

    const interval = setInterval(refreshTokenBalances, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedFromToken?.symbol, selectedToToken?.symbol]);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isCountdownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCountdownActive(false);
            clearQuote();
            setQuoteReceiveAmount('');
            setToAmount('0');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCountdownActive, countdown]);

  const formatUsdValue = (amount: string, token: TokenOption | null): string => {
    const numAmount = parseFloat(amount) || 0;
    const price = token?.price || 0;
    const usdValue = numAmount * price;
    return token?.symbol === 'NGNZ' ? `₦${usdValue.toFixed(2)}` : `$${usdValue.toFixed(2)}`;
  };

  const getMaxBalance = (token: TokenOption | null): string => {
    if (!token) return '0';
    // Use the balance from the token object instead of calling getTokenBalance again
    const balance = token.balance || 0;
    return `${balance.toFixed(8)} ${token.symbol}`;
  };

  const handleMax = () => {
    if (!selectedFromToken) return;
    
    // Get the most current balance using the appropriate hook
    const currentBalance = getTokenBalance(selectedFromToken.symbol);
    
    // Also update the selected token's balance for consistency
    setSelectedFromToken(prev => prev ? {
      ...prev,
      balance: currentBalance
    } : null);
    
    setFromAmount(currentBalance.toString());
  };

  const handleSwapTokens = () => {
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setSelectedFromToken(selectedToToken);
    setSelectedToToken(selectedFromToken);
    setIsSwapped(!isSwapped);
    
    // Clear any existing quote data since tokens changed
    setIsCountdownActive(false);
    setQuoteReceiveAmount('');
    clearQuote();
  };

  const handleCreateQuote = async () => {
    if (!selectedFromToken || !selectedToToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Invalid Input', 'Please select tokens and enter a valid amount');
      return;
    }

    // Check sufficient balance
    const hasBalance = hasSufficientBalance(selectedFromToken.symbol, parseFloat(fromAmount));
    if (!hasBalance) {
      Alert.alert(
        'Insufficient Balance', 
        `You don't have enough ${selectedFromToken.symbol}. Available: ${getMaxBalance(selectedFromToken)}`
      );
      return;
    }

    try {
      console.log('🔄 Creating quote...');
      console.log('📊 Operation type:', {
        isNGNZ: isNGNZOperation(),
        isOnramp: isOnrampOperation(),
        isOfframp: isOfframpOperation(),
        from: selectedFromToken.symbol,
        to: selectedToToken.symbol
      });

      let quoteResult;

      if (isNGNZOperation()) {
        // Use NGNZ service for NGNZ operations
        console.log('🔄 Using NGNZ service...');
        quoteResult = await createNGNZQuote(
          selectedFromToken.symbol,
          selectedToToken.symbol,
          parseFloat(fromAmount),
          'SELL'
        );
      } else {
        // Use crypto service for crypto-to-crypto
        console.log('🔄 Using crypto service...');
        quoteResult = await createCryptoQuote(
          selectedFromToken.symbol,
          selectedToToken.symbol,
          parseFloat(fromAmount),
          'SELL'
        );
      }

      if (!quoteResult.success) {
        Alert.alert('Quote Failed', quoteResult.error || 'Failed to create quote');
        return;
      }

      console.log('✅ Quote created successfully:', quoteResult.data);

      // Set the receive amount from the quote response
      let receiveAmount;
      if (quoteResult.data.data?.amountReceived) {
        receiveAmount = quoteResult.data.data.amountReceived.toString();
      } else if (quoteResult.data.amountReceived) {
        receiveAmount = quoteResult.data.amountReceived.toString();
      } else if (quoteResult.data.data?.data?.amountReceived) {
        receiveAmount = quoteResult.data.data.data.amountReceived.toString();
      }

      if (receiveAmount) {
        setQuoteReceiveAmount(receiveAmount);
        setToAmount(receiveAmount);
      }

      // Start countdown
      setCountdown(10);
      setIsCountdownActive(true);
      
      console.log('✅ Quote flow completed successfully');
      
    } catch (error) {
      console.error('❌ Error in quote creation flow:', error);
      Alert.alert('Error', 'An error occurred while creating the quote');
    }
  };

  const handleAcceptQuote = async () => {
    const currentQuote = getCurrentQuote();
    
    if (!currentQuote) {
      Alert.alert('No Quote', 'Please create a quote first');
      return;
    }

    // Extract quote ID from the nested structure
    const quoteId = currentQuote.data?.data?.id || currentQuote.data?.id || currentQuote.id;
    
    if (!quoteId) {
      Alert.alert('Invalid Quote', 'Quote ID not found. Please create a new quote.');
      return;
    }

    try {
      console.log('🔄 Accepting quote:', quoteId);
      console.log('📊 Using service:', isNGNZOperation() ? 'NGNZ' : 'Crypto');
      
      let result;

      if (isNGNZOperation()) {
        // Use NGNZ service
        result = await acceptNGNZQuote(quoteId);
      } else {
        // Use crypto service
        result = await acceptCryptoQuote(quoteId);
      }
      
      if (result.success) {
        const operationType = isNGNZOperation() 
          ? (isOnrampOperation() ? 'Onramp' : 'Offramp')
          : 'Crypto Swap';
          
        Alert.alert(
          'Swap Successful', 
          `Your ${operationType} has been executed successfully!`
        );
        
        // Reset form to initial state
        setFromAmount('0');
        setToAmount('0');
        setQuoteReceiveAmount('');
        setSelectedToToken(null);
        setIsCountdownActive(false);
        
        console.log('✅ Swap completed and form reset');
        onSwap?.();
      } else {
        Alert.alert('Swap Failed', result.error || 'Failed to execute swap');
      }
    } catch (error) {
      console.error('❌ Error accepting quote:', error);
      Alert.alert('Error', 'An error occurred while executing the swap');
    }
  };

  const handleSwapButton = () => {
    const currentQuote = getCurrentQuote();
    
    if (currentQuote && isCountdownActive) {
      // If we have a valid quote and countdown is active, accept the quote
      handleAcceptQuote();
    } else {
      // Otherwise, create a new quote
      handleCreateQuote();
    }
  };

  // Handle token selector press
  const handleTokenSelectorPress = (type: TokenSelectorType) => {
    setTokenSelectorType(type);
    setShowTokenModal(true);
    onSelectToken?.();
  };

  // Handle token selection from modal
  const handleTokenSelect = (token: TokenOption) => {
    // Update token with current balance and price
    const updatedToken = {
      ...token,
      balance: getTokenBalance(token.symbol),
      price: getTokenPrice(token.symbol),
    };

    if (tokenSelectorType === 'from') {
      setSelectedFromToken(updatedToken);
    } else {
      setSelectedToToken(updatedToken);
    }
    
    // Clear quote data when tokens change
    setIsCountdownActive(false);
    setQuoteReceiveAmount('');
    setToAmount('0');
    clearQuote();
    
    setShowTokenModal(false);
  };

  const renderTab = (tab: SwapTab, label: string) => (
    <TouchableOpacity
      style={[
        styles.tab,
        activeTab === tab ? styles.activeTab : styles.inactiveTab
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText,
        activeTab === tab ? styles.activeTabText : styles.inactiveTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Get current loading states
  const { quoteLoading, acceptLoading, quoteError } = getLoadingStates();

  // Dynamic style for countdown text
  const countdownStyle: StyleProp<TextStyle> = {
    ...styles.countdownText,
    color: countdown > 5 ? '#008000' : '#FF0000',
  };

  // Check if swap button should be disabled
  const isSwapDisabled = !selectedFromToken || !selectedToToken || 
    parseFloat(fromAmount) <= 0 || 
    !hasSufficientBalance(selectedFromToken?.symbol || '', parseFloat(fromAmount)) ||
    quoteLoading || acceptLoading;

  // Determine button text based on current state
  const getButtonText = () => {
    if (quoteLoading) return 'Creating Quote...';
    if (acceptLoading) return 'Executing Swap...';
    
    const currentQuote = getCurrentQuote();
    if (currentQuote && isCountdownActive) {
      return 'Swap';
    }
    
    return 'Create Quote';
  };



  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header Tabs */}
          <View style={styles.tabContainer}>
            {renderTab('buy-sell', 'Buy/Sell')}
          </View>



          {/* Error Display */}
          {quoteError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{quoteError}</Text>
            </View>
          )}

          {/* Sell Token Input (top unless swapped) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{isSwapped ? 'Buy' : 'Sell'}</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput
                  style={styles.amountInput}
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text.secondary}
                />
                <Text style={styles.usdValue}>
                  {formatUsdValue(fromAmount, selectedFromToken)}
                </Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity 
                  style={styles.tokenSelector}
                  onPress={() => handleTokenSelectorPress('from')}
                >
                  {selectedFromToken && (
                    <>
                      <Image 
                        source={getTokenIcon(selectedFromToken.id)} 
                        style={styles.tokenIcon} 
                      />
                      <Text style={styles.tokenText}>{selectedFromToken.symbol}</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText} numberOfLines={1}>
                    {getMaxBalance(selectedFromToken)}
                  </Text>
                  <TouchableOpacity onPress={handleMax}>
                    <Text style={styles.maxText}>Max</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Swap Icon */}
          <View style={styles.swapIconContainer}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
              <Image source={swapIcon} style={styles.swapIconImage} />
            </TouchableOpacity>
          </View>

          {/* Buy Token Input (bottom unless swapped) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{isSwapped ? 'Sell' : 'Buy'}</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput
                  style={styles.amountInput}
                  value={toAmount}
                  onChangeText={setToAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text.secondary}
                  editable={false}
                />
                <Text style={styles.usdValue}>
                  {formatUsdValue(toAmount, selectedToToken)}
                </Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity 
                  style={styles.tokenSelector} 
                  onPress={() => handleTokenSelectorPress('to')}
                >
                  {selectedToToken ? (
                    <>
                      <Image 
                        source={getTokenIcon(selectedToToken.id)} 
                        style={styles.tokenIcon} 
                      />
                      <Text style={styles.tokenText}>
                        {selectedToToken.symbol}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.tokenText}>Select token</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Countdown - only show when active */}
            {isCountdownActive && (
              <Text style={countdownStyle}>
                Quote expires in {countdown}s
              </Text>
            )}
          </View>

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity 
              style={[
                styles.swapActionButton,
                isSwapDisabled && styles.swapActionButtonDisabled
              ]} 
              onPress={handleSwapButton}
              disabled={isSwapDisabled}
            >
              <Text style={[
                styles.swapActionButtonText,
                isSwapDisabled && styles.swapActionButtonTextDisabled
              ]}>
                {getButtonText()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance Warning */}
          {selectedFromToken && parseFloat(fromAmount) > 0 && 
           !hasSufficientBalance(selectedFromToken.symbol, parseFloat(fromAmount)) && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Insufficient {selectedFromToken.symbol} balance. 
                Available: {getMaxBalance(selectedFromToken)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Navigator */}
      <BottomTabNavigator activeTab="swap" />

      {/* Choose Token Modal */}
      <ChooseTokenModal
        visible={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onTokenSelect={handleTokenSelect}
        selectedTokenId={
          tokenSelectorType === 'from' 
            ? selectedFromToken?.id 
            : selectedToToken?.id
        }
        title="Choose token"
        showBalances={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 120,
    paddingTop: Layout.spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: Layout.borderRadius.xl,
    padding: 2,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
    marginHorizontal: Layout.spacing.md,
    alignSelf: 'center',
    width: '50%',
    minWidth: 120,
  },
  tab: {
    flex: 1,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontFamily: Typography.medium,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.surface,
  },
  inactiveTabText: {
    color: Colors.text.secondary,
  },

  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  errorText: {
    color: '#F44336',
    fontFamily: Typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  warningText: {
    color: '#FF9800',
    fontFamily: Typography.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Layout.spacing.sm,
  },
  inputLabel: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
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
    width: '100%',
  },
  inputLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  inputRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '50%',
  },
  amountInput: {
    fontFamily: Typography.medium,
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: '600',
    padding: 0,
    margin: 0,
    flexShrink: 1,
  },
  usdValue: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  countdownText: {
    fontFamily: Typography.regular,
    fontSize: 12,
    marginTop: Layout.spacing.xs,
    opacity: 0.7,
    textAlign: 'left',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tokenIcon: {
    width: 18,
    height: 18,
    resizeMode: 'cover',
    marginRight: Layout.spacing.sm,
  },
  tokenText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  balanceText: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
    flexShrink: 1,
  },
  maxText: {
    fontFamily: Typography.medium,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: Layout.spacing.md,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  swapIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'cover',
    tintColor: Colors.surface,
  },
  swapContainer: {
    marginTop: Layout.spacing.lg,
  },
  swapActionButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  swapActionButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  swapActionButtonText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '600',
  },
  swapActionButtonTextDisabled: {
    color: Colors.text.secondary,
  },
});