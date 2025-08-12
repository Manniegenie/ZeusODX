import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router'; // Add this import for navigation
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useTokens } from '../hooks/useTokens';
import { useBalance } from '../hooks/useWallet';
import { useInternalTransfer } from '../hooks/useInternalTransfer';
import PinEntryModal from '../components/PinEntry';
import TwoFactorAuthModal from '../components/2FA';
import ErrorDisplay from '../components/ErrorDisplay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.6;

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  balance: number;
  usdValue: number;
  formattedBalance: string;
  formattedUsdValue: string;
  hasBalance: boolean;
  currentPrice?: number;
}

interface SelectedUser {
  id: string;
  username: string;
  fullName: string;
}

interface TransferBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedUser: SelectedUser | null;
  defaultToken?: { id: string; name: string; symbol: string };
}

interface ErrorAction {
  title: string;
  message: string;
  actionText: string;
  route?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ErrorDisplayData {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  errorAction?: ErrorAction;
  onActionPress?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

const TransferBottomSheet: React.FC<TransferBottomSheetProps> = ({
  visible,
  onClose,
  selectedUser,
  defaultToken,
}) => {
  const router = useRouter(); // Add router for navigation

  // Get token metadata from useTokens
  const { 
    tokens: allTokens, 
    loading: tokensLoading, 
    error: tokensError 
  } = useTokens();

  // Get balances from useBalance hook
  const {
    solBalance,
    usdcBalance,
    usdtBalance,
    ethBalance,
    avaxBalance,
    bnbBalance,
    maticBalance,
    ngnzBalance,
    btcBalance,
    formattedSolBalanceUSD,
    formattedUsdcBalanceUSD,
    formattedUsdtBalanceUSD,
    formattedEthBalanceUSD,
    formattedAvaxBalanceUSD,
    formattedBnbBalanceUSD,
    formattedMaticBalanceUSD,
    formattedNgnzBalanceUSD,
    formattedBtcBalanceUSD,
    loading: balanceLoading,
    error: balanceError
  } = useBalance();

  // Use internal transfer hook
  const {
    isInitiating,
    isLoading,
    error: transferError,
    hasError,
    initiateTransfer,
    formatAmount,
    validateTransfer,
    clearErrors,
    getErrorAction
  } = useInternalTransfer();

  // Combine loading and error states
  const loading = tokensLoading || balanceLoading;
  const error = tokensError || balanceError;

  // Form state
  const [amount, setAmount] = useState('0');
  const [rawAmount, setRawAmount] = useState(0); // Store full precision for calculations
  
  // Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  
  // Error display state
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);
  
  // Authentication data
  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  // Create tokenMap with the same pattern as WalletTokensSection
  const tokenMap = useMemo((): { [key: string]: TokenOption } => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'AVAX', 'BNB', 'MATIC', 'NGNZ', 'BTC'];
    
    const balanceMap = {
      SOL: solBalance || 0,
      USDC: usdcBalance || 0,
      USDT: usdtBalance || 0,
      ETH: ethBalance || 0,
      AVAX: avaxBalance || 0,
      BNB: bnbBalance || 0,
      MATIC: maticBalance || 0,
      NGNZ: ngnzBalance || 0,
      BTC: btcBalance || 0,
    };

    const usdValueMap = {
      SOL: formattedSolBalanceUSD || '$0.00',
      USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00',
      ETH: formattedEthBalanceUSD || '$0.00',
      AVAX: formattedAvaxBalanceUSD || '$0.00',
      BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00',
      NGNZ: formattedNgnzBalanceUSD || '$0.00',
      BTC: formattedBtcBalanceUSD || '$0.00',
    };

    const tokenMapResult: { [key: string]: TokenOption } = {};

    allTokens
      .filter(token => targetSymbols.includes(token.symbol))
      .forEach(token => {
        const balance = balanceMap[token.symbol] || 0;
        const usdValue = balance * (token.currentPrice || 0);
        const hasBalance = balance > 0;
        
        let formattedBalance = '';
        if (token.symbol === 'NGNZ') {
          formattedBalance = balance.toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
        } else if (token.symbol === 'BTC') {
          formattedBalance = balance.toFixed(8);
        } else if (token.symbol === 'ETH') {
          formattedBalance = balance.toFixed(6);
        } else if (token.symbol === 'USDT' || token.symbol === 'USDC') {
          formattedBalance = balance.toFixed(2);
        } else {
          formattedBalance = balance.toFixed(4);
        }
        
        tokenMapResult[token.symbol.toLowerCase()] = {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          icon: token.icon,
          balance,
          usdValue,
          hasBalance,
          formattedBalance,
          formattedUsdValue: usdValueMap[token.symbol],
          currentPrice: token.currentPrice || 0,
        };
      });

    return tokenMapResult;
  }, [
    allTokens,
    solBalance, usdcBalance, usdtBalance, ethBalance,
    avaxBalance, bnbBalance, maticBalance, ngnzBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedAvaxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD,
    formattedNgnzBalanceUSD, formattedBtcBalanceUSD
  ]);

  const selectedToken = useMemo(() => {
    const tokenId = defaultToken?.id || 'usdt';
    return tokenMap[tokenId] || tokenMap['usdt'] || tokenMap['btc'] || Object.values(tokenMap)[0];
  }, [defaultToken, tokenMap]);

  const translateY = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  // Error handling functions (same as airtime component)
  const showErrorMessage = (errorData: ErrorDisplayData): void => {
    setErrorDisplayData(errorData);
    setShowErrorDisplay(true);
  };

  const hideErrorDisplay = (): void => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  const getErrorType = (errorCode: string): ErrorDisplayData['type'] => {
    switch (errorCode) {
      case 'SETUP_2FA_REQUIRED':
      case 'SETUP_PIN_REQUIRED':
        return 'setup';
      case 'INVALID_2FA_CODE':
      case 'INVALID_PASSWORDPIN':
        return 'auth';
      case 'KYC_LIMIT_EXCEEDED':
        return 'limit';
      case 'INSUFFICIENT_BALANCE':
        return 'balance';
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'NETWORK_ERROR':
        return 'network';
      case 'SERVICE_ERROR':
      case 'TRANSFER_FAILED':
        return 'server';
      default:
        return 'general';
    }
  };

  const resetForm = () => {
    setAmount('0');
    setRawAmount(0);
    setPasswordPin('');
    setTwoFactorCode('');
    setShowPinModal(false);
    setShowTwoFactorModal(false);
    clearErrors();
    hideErrorDisplay();
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  useEffect(() => {
    if (visible) {
      clearErrors();
      hideErrorDisplay();
    }
  }, [visible, clearErrors]);

  // Pan to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > BOTTOM_SHEET_MIN_HEIGHT / 4) handleClose();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePercentage = (percentage: number) => {
    const balance = selectedToken?.balance || 0;
    const percentageAmount = (balance * percentage) / 100;
    const formattedAmount = formatAmountForDisplay(percentageAmount, selectedToken?.symbol);
    
    console.log('Setting percentage amount:', {
      percentage,
      rawBalance: balance,
      calculatedAmount: percentageAmount,
      formattedDisplay: formattedAmount,
      symbol: selectedToken?.symbol
    });
    
    setRawAmount(percentageAmount);
    setAmount(formattedAmount);
  };

  // Helper function to format amounts for display based on token type
  const formatAmountForDisplay = (value: number, symbol?: string): string => {
    if (!symbol) return value.toString();
    
    switch (symbol) {
      case 'NGNZ':
        return value.toLocaleString('en-NG', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      case 'BTC':
        // For BTC, show up to 8 decimals but remove trailing zeros
        return Number(value.toFixed(8)).toString();
      case 'ETH':
        // For ETH, show up to 6 decimals but remove trailing zeros
        return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC':
        return value.toFixed(2);
      default:
        // Smart formatting for other tokens
        if (value >= 1000) {
          return value.toFixed(2);
        } else if (value >= 1) {
          return Number(value.toFixed(4)).toString();
        } else if (value >= 0.01) {
          return Number(value.toFixed(4)).toString();
        } else if (value >= 0.001) {
          return Number(value.toFixed(6)).toString();
        } else {
          // For very small amounts, find the first 3 significant digits
          const str = value.toPrecision(3);
          return Number(str).toString();
        }
    }
  };

  const handleMaxAmount = () => {
    const balance = selectedToken?.balance || 0;
    const formattedAmount = formatAmountForDisplay(balance, selectedToken?.symbol);
    
    console.log('Setting max amount:', {
      rawBalance: balance,
      formattedDisplay: formattedAmount,
      symbol: selectedToken?.symbol
    });
    
    setRawAmount(balance);
    setAmount(formattedAmount);
  };

  const handleReview = () => {
    if (!selectedToken) {
      showErrorMessage({
        type: 'validation',
        title: 'Token Required',
        message: 'No token selected for transfer',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    if (!selectedUser) {
      showErrorMessage({
        type: 'validation',
        title: 'Recipient Required',
        message: 'No recipient selected for transfer',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    // Use rawAmount for validation (full precision) or parse the current amount
    const numericAmount = rawAmount > 0 ? rawAmount : parseFloat(unformat(amount));
    if (!numericAmount || numericAmount <= 0) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Amount',
        message: 'Please enter an amount greater than 0',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    if (numericAmount > (selectedToken.balance || 0)) {
      showErrorMessage({
        type: 'balance',
        title: 'Insufficient Balance',
        message: 'You do not have enough balance for this transfer',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    const minimumAmounts = {
      BTC: 0.00001,
      ETH: 0.001,
      SOL: 0.01,
      USDT: 1,
      USDC: 1,
      BNB: 0.001,
      MATIC: 1,
      AVAX: 0.01,
      NGNZ: 100,
    };

    const minAmount = minimumAmounts[selectedToken.symbol] || 0;
    if (numericAmount < minAmount) {
      showErrorMessage({
        type: 'validation',
        title: 'Amount Too Low',
        message: `Minimum transfer amount for ${selectedToken.symbol} is ${minAmount}`,
        autoHide: true,
        duration: 3000
      });
      return;
    }

    const transferData = {
      recipientUsername: selectedUser.username,
      amount: numericAmount.toString(),
      currency: selectedToken.symbol,
      twoFactorCode: '000000',
      passwordpin: '000000',
      memo: ''
    };

    const validation = validateTransfer(transferData);
    if (!validation.success) {
      showErrorMessage({
        type: 'validation',
        title: 'Validation Error',
        message: validation.message,
        autoHide: true,
        duration: 3000
      });
      return;
    }

    setShowPinModal(true);
  };

  const handlePinSubmit = (pin: string): void => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };

  const handlePinModalClose = (): void => {
    setShowPinModal(false);
    setPasswordPin('');
  };

  const handleTwoFactorSubmit = async (code: string): Promise<void> => {
    setTwoFactorCode(code);
    
    try {
      if (!selectedUser || !selectedToken) {
        throw new Error('Missing required data');
      }

      const numericAmount = rawAmount > 0 ? rawAmount : parseFloat(unformat(amount));
      
      const transferData = {
        recipientUsername: selectedUser.username,
        amount: numericAmount.toString(),
        currency: selectedToken.symbol,
        twoFactorCode: code,
        passwordpin: passwordPin,
        memo: ''
      };

      console.log('Processing internal transfer:', {
        ...transferData,
        passwordpin: '[REDACTED]'
      });

      const result = await initiateTransfer(transferData);

      console.log('Transfer result:', {
        success: result?.success,
        error: result?.error,
        requiresAction: result?.requiresAction,
        message: result?.message
      });

      if (result?.success) {
        setShowTwoFactorModal(false);
        
        Alert.alert(
          'Transfer Successful',
          `Successfully transferred ${formatAmount(result.data.amount, result.data.currency)} ${result.data.currency} to @${result.data.recipient.username}`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
              }
            }
          ]
        );
      } else {
        setShowTwoFactorModal(false);
        
        console.log('Transfer failed, checking for error action...');
        const errorAction = getErrorAction?.(result?.requiresAction);
        const errorType = getErrorType(result?.error || 'GENERAL_ERROR');
        
        console.log('Error action found:', errorAction);
        console.log('Error type:', errorType);
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            errorAction: errorAction,
            onActionPress: () => {
              console.log('Error action pressed, route:', errorAction.route);
              if (errorAction.route) {
                // Navigate to setup screen
                try {
                  router.push(errorAction.route);
                } catch (navError) {
                  console.log('Navigation error:', navError);
                  // Fallback: close modal and show simple alert
                  handleClose();
                  Alert.alert(
                    errorAction.title,
                    `${errorAction.message}\n\nPlease go to Settings > Security to complete setup.`,
                    [{ text: 'OK' }]
                  );
                }
              } else {
                // Handle retry actions
                if (result?.requiresAction === 'RETRY_PIN') {
                  setPasswordPin('');
                  setShowPinModal(true);
                } else if (result?.requiresAction === 'RETRY_2FA') {
                  setTwoFactorCode('');
                  setShowTwoFactorModal(true);
                }
              }
            },
            autoHide: false,
            dismissible: true
          });
        } else {
          console.log('No error action found, showing generic error');
          // Use original message if available, otherwise fall back to result message
          const displayMessage = result?.originalMessage || result?.message || 'Something went wrong. Please try again.';
          showErrorMessage({
            type: errorType,
            title: 'Transfer Failed',
            message: displayMessage,
            autoHide: true,
            duration: 4000
          });
        }
      }
      
    } catch (error) {
      console.error('Transfer error:', error);
      setShowTwoFactorModal(false);
      showErrorMessage({
        type: 'server',
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        autoHide: true,
        duration: 4000
      });
    }
  };

  const handleTwoFactorModalClose = (): void => {
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
    setShowPinModal(true);
  };

  // Helper functions
  const unformat = (value: string): string => value.replace(/,/g, '');

  const formatUsdValue = (amount: string, token: TokenOption | null): string => {
    // Use rawAmount if available (from max/percentage), otherwise parse the display amount
    const val = rawAmount > 0 ? rawAmount : (parseFloat(unformat(amount)) || 0);
    const price = token?.currentPrice || 0;
    const usdValue = val * price;
    
    if (token?.symbol === 'NGNZ') {
      return `₦${usdValue.toFixed(2)}`;
    }
    return `$${usdValue.toFixed(2)}`;
  };

  const handleAmountChange = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanText);
    setRawAmount(0); // Reset raw amount when manually typing
  };

  const handleAmountFocus = () => {
    if (amount === '0') setAmount('');
  };

  const handleAmountBlur = () => {
    if (!amount) {
      setAmount('0');
      setRawAmount(0);
    } else {
      // When user finishes typing, format the display value
      const numericValue = parseFloat(amount);
      if (!isNaN(numericValue)) {
        const formatted = formatAmountForDisplay(numericValue, selectedToken?.symbol);
        setAmount(formatted);
        setRawAmount(numericValue);
      }
    }
  };

  if (!selectedUser) return null;

  // Show loading state
  if (loading) {
    return (
      <Modal visible={visible} transparent statusBarTranslucent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            <View style={styles.dragHandle} />
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading token data...</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // Show error state
  if (error) {
    return (
      <Modal visible={visible} transparent statusBarTranslucent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            <View style={styles.dragHandle} />
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load token data</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
                <Text style={styles.retryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      {/* Error Display */}
      {showErrorDisplay && errorDisplayData && (
        <ErrorDisplay
          type={errorDisplayData.type}
          title={errorDisplayData.title}
          message={errorDisplayData.message}
          errorAction={errorDisplayData.errorAction}
          onActionPress={errorDisplayData.onActionPress}
          autoHide={errorDisplayData.autoHide !== false}
          duration={errorDisplayData.duration || 4000}
          dismissible={errorDisplayData.dismissible !== false}
          onDismiss={hideErrorDisplay}
        />
      )}

      {/* PIN Entry Modal */}
      {showPinModal && (
        <PinEntryModal
          visible={showPinModal}
          onClose={handlePinModalClose}
          onSubmit={handlePinSubmit}
          loading={false}
          title="Enter Password PIN"
          subtitle="Please enter your 6-digit password PIN to continue"
        />
      )}

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorModal && (
        <TwoFactorAuthModal
          visible={showTwoFactorModal}
          onClose={handleTwoFactorModalClose}
          onSubmit={handleTwoFactorSubmit}
          loading={isInitiating || isLoading}
          title="Two-Factor Authentication"
          subtitle="Please enter the 6-digit code from your authenticator app"
        />
      )}

      {/* Main Transfer Modal */}
      {!showPinModal && !showTwoFactorModal && (
        <Modal visible={visible} transparent statusBarTranslucent onRequestClose={handleClose}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={styles.headerSection}>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Transfer</Text>
                  <View style={styles.headerSpacer} />
                </View>

                {/* Amount & Token */}
                <View style={styles.inputSection}>
                  <View style={styles.inputCard}>
                    <View style={styles.inputLeft}>
                      <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onFocus={handleAmountFocus}
                        onBlur={handleAmountBlur}
                        onChangeText={handleAmountChange}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.text.secondary}
                        editable={!isInitiating && !isLoading}
                      />
                      <Text style={styles.usdValue}>{formatUsdValue(amount, selectedToken)}</Text>
                    </View>
                    <View style={styles.tokenSelector}>
                      <View style={styles.tokenContainer}>
                        <Image source={selectedToken?.icon} style={styles.tokenIcon} />
                        <Text style={styles.tokenText}>{selectedToken?.symbol}</Text>
                      </View>
                      <View style={styles.balanceInfo}>
                        <Text style={styles.balanceText}>
                          {selectedToken?.formattedBalance} {selectedToken?.symbol}
                        </Text>
                        <TouchableOpacity 
                          onPress={handleMaxAmount}
                          disabled={isInitiating || isLoading}
                        >
                          <Text style={styles.maxText}>Max</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Percentages */}
                <View style={styles.percentageSection}>
                  {[25, 50, 75, 100].map((percentage) => (
                    <TouchableOpacity 
                      key={percentage} 
                      style={styles.percentageButton} 
                      onPress={() => handlePercentage(percentage)} 
                      activeOpacity={0.7}
                      disabled={isInitiating || isLoading}
                    >
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selected User */}
                <View style={styles.userSection}>
                  <View style={styles.userItem}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userInitials}>
                          {selectedUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{selectedUser.fullName}</Text>
                        <Text style={styles.userUsername}>@{selectedUser.username}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Transfer button */}
                <View style={styles.reviewSection}>
                  <TouchableOpacity 
                    style={[
                      styles.reviewButton,
                      (isInitiating || isLoading) && styles.reviewButtonDisabled
                    ]} 
                    onPress={handleReview} 
                    activeOpacity={0.8}
                    disabled={isInitiating || isLoading}
                  >
                    <Text style={styles.reviewButtonText}>
                      {isInitiating || isLoading ? 'Processing...' : 'Transfer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bottomSheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: BOTTOM_SHEET_MIN_HEIGHT, maxHeight: BOTTOM_SHEET_MAX_HEIGHT, paddingTop: 8 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  scrollView: { flex: 1 },
  headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Layout.spacing.md, paddingTop: Layout.spacing.sm, paddingBottom: Layout.spacing.lg },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: Layout.borderRadius.lg },
  closeButtonText: { fontSize: 16, color: Colors.text.primary, fontWeight: '500' },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  inputSection: { paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.md },
  inputCard: { backgroundColor: '#F8F9FA', borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 80 },
  inputLeft: { flex: 1, justifyContent: 'center', minWidth: 0 },
  amountInput: { fontFamily: Typography.medium, fontSize: 24, color: Colors.text.primary, fontWeight: '600', padding: 0, margin: 0, flexShrink: 1 },
  usdValue: { fontFamily: Typography.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },
  tokenSelector: { alignItems: 'flex-end', justifyContent: 'center', maxWidth: '50%' },
  tokenContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.sm, paddingVertical: Layout.spacing.xs },
  tokenIcon: { width: 18, height: 18, resizeMode: 'cover', marginRight: Layout.spacing.sm },
  tokenText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.text.primary, fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  balanceText: { fontFamily: Typography.regular, fontSize: 10, color: Colors.text.secondary },
  maxText: { fontFamily: Typography.medium, fontSize: 10, color: Colors.primary, fontWeight: '600' },
  percentageSection: { flexDirection: 'row', paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.xl, gap: Layout.spacing.sm },
  percentageButton: { flex: 1, backgroundColor: Colors.surface, borderRadius: Layout.borderRadius.md, paddingVertical: Layout.spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  percentageText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  userSection: { paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.xxl, alignItems: 'center', justifyContent: 'center', width: '100%' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.sm, justifyContent: 'center', alignSelf: 'center', gap: Layout.spacing.sm },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 17, height: 17, borderRadius: 30.59, backgroundColor: '#8075FF', alignItems: 'center', justifyContent: 'center' },
  userInitials: { color: '#FFFFFF', fontFamily: 'Bricolage Grotesque', fontSize: 8, fontWeight: '600' },
  textContainer: { alignItems: 'center', justifyContent: 'center' },
  userInfo: { width: 152, height: 34, alignItems: 'center', justifyContent: 'center' },
  userName: { color: Colors.text.primary, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, letterSpacing: 0, textAlign: 'center', marginBottom: 2 },
  userUsername: { color: Colors.text.secondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16, letterSpacing: 0, textAlign: 'center' },
  reviewSection: { paddingHorizontal: Layout.spacing.xl, paddingTop: Layout.spacing.xxl, paddingBottom: Layout.spacing.xl },
  reviewButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, alignItems: 'center' },
  reviewButtonDisabled: { backgroundColor: Colors.text.secondary, opacity: 0.6 },
  reviewButtonText: { fontFamily: Typography.medium, fontSize: 16, color: Colors.surface, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  errorText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
  },
  retryButtonText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.surface,
    fontWeight: '600',
  },
});

export default TransferBottomSheet;