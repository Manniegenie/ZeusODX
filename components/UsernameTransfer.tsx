// screens/TransferBottomSheet.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useTokens } from '../hooks/useTokens';
import { useBalance } from '../hooks/useWallet';
import { useUsernameTransfer } from '../hooks/useInternalTransfer';
import { useDashboard } from '../hooks/useDashboard';
import PinEntryModal from '../components/PinEntry';
import TwoFactorAuthModal from '../components/2FA';
import ErrorDisplay from '../components/ErrorDisplay';
import TransferSuccessModal from '../components/TransferSuccess';

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
  const router = useRouter();

  // Tokens
  const { tokens: allTokens, loading: tokensLoading, error: tokensError } = useTokens();

  // Balances
  const {
    solBalance, usdcBalance, usdtBalance, ethBalance, trxBalance, bnbBalance, maticBalance, ngnzBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD, formattedNgnzBalanceUSD, formattedBtcBalanceUSD,
    loading: balanceLoading, error: balanceError
  } = useBalance();

  // Dashboard data for NGNZ exchange rate
  const { ngnzExchangeRate } = useDashboard();

  // Username transfer hook
  const {
    isTransferring,
    transferResult,
    error: transferError,
    hasError,
    executeTransfer,
    resetTransfer,
    clearError,
    clearResult,
    validateTransferData,
    formatAmount: formatTransferAmount,
    formatUsername,
    requiresAction,
    errorCode
  } = useUsernameTransfer();

  const loading = tokensLoading || balanceLoading;
  const error = tokensError || balanceError;

  // Form
  const [amount, setAmount] = useState('0');
  const [rawAmount, setRawAmount] = useState(0);

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Error display
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // Auth
  const [passwordPin, setPasswordPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Token map
  const tokenMap = useMemo((): { [key: string]: TokenOption } => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'TRX', 'BNB', 'MATIC', 'NGNZ', 'BTC'];

    const balanceMap: Record<string, number> = {
      SOL: solBalance || 0, USDC: usdcBalance || 0, USDT: usdtBalance || 0, ETH: ethBalance || 0,
      TRX: trxBalance || 0, BNB: bnbBalance || 0, MATIC: maticBalance || 0, NGNZ: ngnzBalance || 0, BTC: btcBalance || 0,
    };

    const usdValueMap: Record<string, string> = {
      SOL: formattedSolBalanceUSD || '$0.00',
      USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00',
      ETH: formattedEthBalanceUSD || '$0.00',
      TRX: formattedTrxBalanceUSD || '$0.00',
      BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00',
      NGNZ: formattedNgnzBalanceUSD || '$0.00',
      BTC: formattedBtcBalanceUSD || '$0.00',
    };

    const acc: { [key: string]: TokenOption } = {};
    allTokens
      .filter(t => targetSymbols.includes(t.symbol))
      .forEach(t => {
        const bal = balanceMap[t.symbol] || 0;
        const usdVal = bal * (t.currentPrice || 0);

        let formattedBalance = '';
        if (t.symbol === 'NGNZ') {
          formattedBalance = bal.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else if (t.symbol === 'BTC') {
          formattedBalance = bal.toFixed(8);
        } else if (t.symbol === 'ETH') {
          formattedBalance = bal.toFixed(6);
        } else if (t.symbol === 'USDT' || t.symbol === 'USDC') {
          formattedBalance = bal.toFixed(2);
        } else {
          formattedBalance = bal.toFixed(4);
        }

        acc[t.symbol.toLowerCase()] = {
          id: t.id,
          name: t.name,
          symbol: t.symbol,
          icon: t.icon,
          balance: bal,
          usdValue: usdVal,
          hasBalance: bal > 0,
          formattedBalance,
          formattedUsdValue: usdValueMap[t.symbol],
          currentPrice: t.currentPrice || 0,
        };
      });

    return acc;
  }, [
    allTokens,
    solBalance, usdcBalance, usdtBalance, ethBalance,
    trxBalance, bnbBalance, maticBalance, ngnzBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD,
    formattedNgnzBalanceUSD, formattedBtcBalanceUSD
  ]);

  const selectedToken = useMemo(() => {
    const tokenId = (defaultToken?.id || 'usdt').toLowerCase();
    return tokenMap[tokenId] || tokenMap['usdt'] || tokenMap['btc'] || Object.values(tokenMap)[0];
  }, [defaultToken, tokenMap]);

  const translateY = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  const showErrorMessage = (errorData: ErrorDisplayData): void => {
    setErrorDisplayData(errorData);
    setShowErrorDisplay(true);
  };
  const hideErrorDisplay = useCallback(() => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  }, []);

  const getErrorType = useCallback((code: string): ErrorDisplayData['type'] => {
    switch (code) {
      case 'SETUP_2FA_REQUIRED':
      case 'SETUP_PIN_REQUIRED': return 'setup';
      case 'INVALID_2FA_CODE':
      case 'INVALID_PASSWORDPIN': return 'auth';
      case 'KYC_LIMIT_EXCEEDED': return 'limit';
      case 'INSUFFICIENT_BALANCE': return 'balance';
      case 'RECIPIENT_NOT_FOUND':
      case 'RECIPIENT_INACTIVE': return 'notFound';
      case 'VALIDATION_ERROR':
      case 'MINIMUM_AMOUNT_ERROR': return 'validation';
      case 'NETWORK_ERROR': return 'network';
      case 'TRANSFER_EXECUTION_FAILED':
      case 'TRANSFER_FAILED': return 'server';
      default: return 'general';
    }
  }, []);

  const actionMap: { [key: string]: ErrorAction } = {
    'SETUP_2FA': { title: '2FA Setup Required', message: 'Two-factor authentication is required for transfers. Please set it up to continue.', actionText: 'Setup 2FA', route: '/settings/security/2fa', priority: 'high' },
    'SETUP_PIN': { title: 'Password PIN Required', message: 'A password PIN is required for transfers. Please set it up to continue.', actionText: 'Setup PIN', route: '/settings/security/pin', priority: 'high' },
    'RETRY_2FA': { title: 'Invalid 2FA Code', message: 'The 2FA code you entered is incorrect. Please try again.', actionText: 'Retry', priority: 'medium' },
    'RETRY_PIN': { title: 'Invalid PIN', message: 'The password PIN you entered is incorrect. Please try again.', actionText: 'Retry', priority: 'medium' },
    'UPGRADE_KYC': { title: 'Upgrade Verification', message: 'This transfer exceeds your current account limits. Please upgrade your verification level.', actionText: 'Upgrade KYC', route: '/settings/verification', priority: 'high' },
    'ADD_FUNDS': { title: 'Insufficient Balance', message: 'You don\'t have enough balance for this transfer. Please add funds to your account.', actionText: 'Add Funds', route: '/wallet/deposit', priority: 'medium' },
    'CHECK_USERNAME': { title: 'User Not Found', message: 'The username you entered was not found. Please check and try again.', actionText: 'Try Again', priority: 'medium' },
    'CONTACT_RECIPIENT': { title: 'Recipient Inactive', message: 'The recipient account is inactive and cannot receive transfers.', actionText: 'OK', priority: 'low' },
  };

  const getErrorAction = useCallback((reqAction: string | null): ErrorAction | null => (reqAction ? actionMap[reqAction] || null : null), []);

  const resetForm = () => {
    setAmount('0');
    setRawAmount(0);
    setPasswordPin('');
    setTwoFactorCode('');
    setShowPinModal(false);
    setShowTwoFactorModal(false);
    resetTransfer();
    hideErrorDisplay();
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, translateY]);

  useEffect(() => {
    if (visible) {
      clearError();
      hideErrorDisplay();
    }
  }, [visible, clearError, hideErrorDisplay]);

  // Success -> show success modal with amount + @username
  useEffect(() => {
    if (transferResult) {
      setShowTwoFactorModal(false);
      // Small delay to ensure proper modal transition on Android
      setTimeout(() => {
        setShowSuccess(true);
      }, 100);
    }
  }, [transferResult]);

  // Errors
  useEffect(() => {
    if (hasError && transferError) {
      setShowTwoFactorModal(false);
      setShowPinModal(false);

      const errorAction = getErrorAction(requiresAction);
      const errorType = getErrorType(errorCode || 'GENERAL_ERROR');

      if (errorAction) {
        showErrorMessage({
          type: errorType,
          title: errorAction.title,
          message: errorAction.message,
          errorAction,
          onActionPress: () => {
            if (errorAction.route) {
              try {
                router.push(errorAction.route);
              } catch {
                handleClose();
              }
            } else {
              // Retry flows
              if (requiresAction === 'RETRY_PIN') {
                setPasswordPin('');
                setShowPinModal(true);
              } else if (requiresAction === 'RETRY_2FA') {
                setTwoFactorCode('');
                setShowTwoFactorModal(true);
              }
            }
            hideErrorDisplay();
          },
          autoHide: false,
          dismissible: true
        });
      } else {
        showErrorMessage({
          type: errorType,
          title: 'Transfer Failed',
          message: transferError.message || 'Something went wrong. Please try again.',
          autoHide: true,
          duration: 4000
        });
      }
    }
  }, [hasError, transferError, requiresAction, errorCode, getErrorAction, getErrorType, router, hideErrorDisplay]);

  // Pan to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > BOTTOM_SHEET_MIN_HEIGHT / 4) handleClose();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePercentage = (pct: number) => {
    const bal = selectedToken?.balance || 0;
    const val = (bal * pct) / 100;
    const formatted = formatAmountForDisplay(val, selectedToken?.symbol);
    setRawAmount(val);
    setAmount(formatted);
  };

  const formatAmountForDisplay = (value: number, symbol?: string): string => {
    if (!symbol) return value.toString();
    switch (symbol) {
      case 'NGNZ':
        return value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'BTC':
        return Number(value.toFixed(8)).toString();
      case 'ETH':
        return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC':
        return value.toFixed(2);
      default:
        if (value >= 1000) return value.toFixed(2);
        if (value >= 1) return Number(value.toFixed(4)).toString();
        if (value >= 0.01) return Number(value.toFixed(4)).toString();
        if (value >= 0.001) return Number(value.toFixed(6)).toString();
        return Number(value.toPrecision(3)).toString();
    }
  };

  const handleMaxAmount = () => {
    const bal = selectedToken?.balance || 0;
    const formatted = formatAmountForDisplay(bal, selectedToken?.symbol);
    setRawAmount(bal);
    setAmount(formatted);
  };

  const handleReview = useCallback(() => {
    if (!selectedToken) {
      showErrorMessage({ type: 'validation', title: 'Token Required', message: 'No token selected for transfer', autoHide: true, duration: 3000 });
      return;
    }
    if (!selectedUser) {
      showErrorMessage({ type: 'validation', title: 'Recipient Required', message: 'No recipient selected for transfer', autoHide: true, duration: 3000 });
      return;
    }
    const numericAmount = rawAmount > 0 ? rawAmount : parseFloat(unformat(amount));
    if (!numericAmount || numericAmount <= 0) {
      showErrorMessage({ type: 'validation', title: 'Invalid Amount', message: 'Please enter an amount greater than 0', autoHide: true, duration: 3000 });
      return;
    }
    if (numericAmount > (selectedToken.balance || 0)) {
      showErrorMessage({ type: 'balance', title: 'Insufficient Balance', message: 'You do not have enough balance for this transfer', autoHide: true, duration: 3000 });
      return;
    }

    const tx = {
      recipientUsername: selectedUser.username,
      amount: numericAmount,
      currency: selectedToken.symbol,
      twoFactorCode: '000000',
      passwordpin: '000000',
      memo: ''
    };
    const validation = validateTransferData(tx);
    if (!validation.isValid) {
      showErrorMessage({ type: 'validation', title: 'Validation Error', message: validation.errors.join('; '), autoHide: true, duration: 3000 });
      return;
    }
    setShowPinModal(true);
  }, [selectedToken, selectedUser, rawAmount, amount, validateTransferData]);

  const handlePinSubmit = (pin: string) => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };
  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPasswordPin('');
  };

  const handleTwoFactorSubmit = async (code: string) => {
    setTwoFactorCode(code);
    try {
      if (!selectedUser || !selectedToken) throw new Error('Missing required data');
      const numericAmount = rawAmount > 0 ? rawAmount : parseFloat(unformat(amount));
      const tx = {
        recipientUsername: selectedUser.username,
        amount: numericAmount,
        currency: selectedToken.symbol,
        twoFactorCode: code,
        passwordpin: passwordPin,
        memo: ''
      };
      await executeTransfer(tx);
    } catch (e) {
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

  const handleTwoFactorModalClose = () => {
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
    setShowPinModal(true);
  };

  const unformat = (v: string) => v.replace(/,/g, '');

  const formatUsdValue = (amt: string, token: TokenOption | null): string => {
    const val = rawAmount > 0 ? rawAmount : (parseFloat(unformat(amt)) || 0);
    
    if (!val || isNaN(val) || val <= 0) {
      return '$0.00';
    }
    
    if (token?.symbol === 'NGNZ') {
      const exchangeRate = ngnzExchangeRate;
      if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
        return '$0.00';
      }
      const usdValue = val / exchangeRate;
      return '$' + usdValue.toFixed(2);
    }
    
    const price = token?.currentPrice || 0;
    if (!price || isNaN(price) || price <= 0) {
      return '$0.00';
    }
    
    const usdValue = val * price;
    return '$' + usdValue.toFixed(2);
  };

  if (!selectedUser) return null;

  // Loading
  if (loading) {
    return (
      <Modal 
        visible={visible} 
        transparent 
        statusBarTranslucent 
        animationType="none"
        presentationStyle="overFullScreen"
        hardwareAccelerated={true}
        onRequestClose={handleClose}
      >
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

  // Error
  if (error) {
    return (
      <Modal 
        visible={visible} 
        transparent 
        statusBarTranslucent 
        animationType="none"
        presentationStyle="overFullScreen"
        hardwareAccelerated={true}
        onRequestClose={handleClose}
      >
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
      {/* Inline banners */}
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

      {/* PIN Modal */}
      <PinEntryModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onSubmit={handlePinSubmit}
        loading={false}
        title="Enter Password PIN"
        subtitle="Please enter your 6-digit password PIN to continue"
      />

      {/* 2FA Modal */}
      <TwoFactorAuthModal
        visible={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        onSubmit={handleTwoFactorSubmit}
        loading={isTransferring}
        title="Two-Factor Authentication"
        subtitle="Please enter the 6-digit code from your authenticator app"
      />

      {/* Success Modal */}
      {showSuccess && transferResult && (
        <Modal
          visible={showSuccess}
          transparent
          statusBarTranslucent
          animationType="fade"
          presentationStyle="overFullScreen"
          hardwareAccelerated={true}
          onRequestClose={() => {
            setShowSuccess(false);
            clearResult();
            handleClose();
          }}
        >
          <TransferSuccessModal
            visible={showSuccess}
            onContinue={() => {
              setShowSuccess(false);
              clearResult();
              handleClose();
            }}
            amount={transferResult.amount}
            currency={transferResult.currency}
            recipientUsername={transferResult.recipient?.username || selectedUser?.username || ''}
            transactionRef={transferResult.reference || transferResult.transactionRef}
            transferDate={transferResult.createdAt || transferResult.date}
            transferType="Username Transfer"
          />
        </Modal>
      )}

      {/* Main Modal */}
      {!showPinModal && !showTwoFactorModal && !showSuccess && (
        <Modal 
          visible={visible} 
          transparent 
          statusBarTranslucent 
          animationType="none"
          presentationStyle="overFullScreen"
          hardwareAccelerated={true}
          onRequestClose={handleClose}
        >
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
                        onFocus={() => { if (amount === '0') setAmount(''); }}
                        onBlur={() => {
                          if (!amount) { setAmount('0'); setRawAmount(0); }
                          else {
                            const n = parseFloat(amount);
                            if (!isNaN(n)) {
                              setAmount(formatAmountForDisplay(n, selectedToken?.symbol));
                              setRawAmount(n);
                            }
                          }
                        }}
                        onChangeText={(t) => { const clean = t.replace(/[^0-9.]/g, ''); setAmount(clean); setRawAmount(0); }}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.text.secondary}
                        editable={!isTransferring}
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
                        <TouchableOpacity onPress={handleMaxAmount} disabled={isTransferring}>
                          <Text style={styles.maxText}>Max</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Percentages */}
                <View style={styles.percentageSection}>
                  {[25, 50, 75, 100].map((p) => (
                    <TouchableOpacity key={p} style={styles.percentageButton} onPress={() => handlePercentage(p)} activeOpacity={0.7} disabled={isTransferring}>
                      <Text style={styles.percentageText}>{p}%</Text>
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

                {/* Transfer */}
                <View style={styles.reviewSection}>
                  <TouchableOpacity
                    style={[styles.reviewButton, isTransferring && styles.reviewButtonDisabled]}
                    onPress={handleReview}
                    activeOpacity={0.8}
                    disabled={isTransferring}
                  >
                    <Text style={styles.reviewButtonText}>{isTransferring ? 'Processing...' : 'Transfer'}</Text>
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
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end',
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    zIndex: 1001,
    elevation: 1001,
  },
  bottomSheet: { 
    backgroundColor: Colors.background, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    minHeight: BOTTOM_SHEET_MIN_HEIGHT, 
    maxHeight: BOTTOM_SHEET_MAX_HEIGHT, 
    paddingTop: 8,
    zIndex: 1002,
    elevation: 1002,
  },
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
  userName: { color: Colors.text.primary, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, textAlign: 'center', marginBottom: 2 },
  userUsername: { color: Colors.text.secondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16, textAlign: 'center' },
  reviewSection: { paddingHorizontal: Layout.spacing.xl, paddingTop: Layout.spacing.xxl, paddingBottom: Layout.spacing.xl },
  reviewButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, alignItems: 'center' },
  reviewButtonDisabled: { backgroundColor: Colors.text.secondary, opacity: 0.6 },
  reviewButtonText: { fontFamily: Typography.medium, fontSize: 16, color: Colors.surface, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Layout.spacing.xl },
  loadingText: { fontFamily: Typography.regular, fontSize: 14, color: Colors.text.secondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Layout.spacing.xl },
  errorText: { fontFamily: Typography.regular, fontSize: 14, color: Colors.text.secondary, marginBottom: Layout.spacing.md },
  retryButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md, paddingVertical: Layout.spacing.sm, paddingHorizontal: Layout.spacing.lg },
  retryButtonText: { fontFamily: Typography.medium, fontSize: 14, color: Colors.surface, fontWeight: '600' },
});


export default TransferBottomSheet;