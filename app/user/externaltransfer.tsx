import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useTokens } from '../../hooks/useTokens';
import { useBalance } from '../../hooks/useWallet';
import { useNetworks } from '../../hooks/useNetwork';
import { useWithdrawal } from '../../hooks/useexternalWithdrawal';
import PinEntryModal from '../../components/PinEntry';
import TwoFactorAuthModal from '../../components/2FA';
import ErrorDisplay from '../../components/ErrorDisplay';

// Icons - Updated to match BTC-BSC screen
import backIcon from '../../components/icons/backy.png';
import arrowDownIcon from '../../components/icons/arrow-down.png';

const { width: screenWidth } = Dimensions.get('window');

const getHorizontalPadding = (): number => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  else return 28;
};

const horizontalPadding = getHorizontalPadding();

// Type definitions (keep all existing type definitions)
interface TokenDetails {
  transactionId?: string;
  currency?: string;
  network?: string;
  address?: string;
  hash?: string;
  fee?: number | string;
  narration?: string;
  createdAt?: string;
  category?: 'token';
}

interface UtilityDetails {
  orderId?: string;
  requestId?: string;
  productName?: string;
  quantity?: number | string;
  network?: string;
  customerInfo?: string;
  billType?: string;
  paymentCurrency?: string;
  category?: 'utility';
}

type APIDetail =
  | TokenDetails
  | UtilityDetails
  | (Record<string, any> & { category?: 'token' | 'utility' });

interface APITransaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  date: string;
  createdAt?: string;
  details?: APIDetail;
}

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

interface NetworkOption {
  id: string;
  name: string;
  code: string;
  feeUsd?: number;
  isActive?: boolean;
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

const ExternalWalletTransferScreen: React.FC = () => {
  const router = useRouter();

  // Network modal state
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption | null>(null);

  // Form input states
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);

  // Error display state
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // Authentication data
  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  // Get search params for token selection
  const searchParams = useLocalSearchParams();
  const tokenId = Array.isArray(searchParams.tokenId) ? searchParams.tokenId[0] : searchParams.tokenId;
  const tokenSymbol = Array.isArray(searchParams.tokenSymbol) ? searchParams.tokenSymbol[0] : searchParams.tokenSymbol;

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
    trxBalance,
    bnbBalance,
    maticBalance,
    btcBalance,
    formattedSolBalanceUSD,
    formattedUsdcBalanceUSD,
    formattedUsdtBalanceUSD,
    formattedEthBalanceUSD,
    formattedTrxBalanceUSD,
    formattedBnbBalanceUSD,
    formattedMaticBalanceUSD,
    formattedBtcBalanceUSD,
    loading: balanceLoading,
    error: balanceError
  } = useBalance();

  // Get networks hook
  const {
    availableNetworks,
    isFetchingNetworks,
    networksError,
    fetchNetworksForCurrency
  } = useNetworks();

  // Get withdrawal hook
  const {
    calculateFee,
    initiateWithdrawal,
    feeCalculation,
    isCalculatingFee,
    isInitiating,
    feeError,
    error: withdrawalError,
    clearErrors: clearWithdrawalErrors,
    getErrorAction,
    resetFeeCalculation
  } = useWithdrawal();

  // Create tokenMap (keep existing implementation)
  const tokenMap = useMemo((): { [key: string]: TokenOption } => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'TRX', 'BNB', 'MATIC', 'BTC'];
    
    const balanceMap = {
      SOL: solBalance || 0,
      USDC: usdcBalance || 0,
      USDT: usdtBalance || 0,
      ETH: ethBalance || 0,
      TRX: trxBalance || 0,
      BNB: bnbBalance || 0,
      MATIC: maticBalance || 0,
      BTC: btcBalance || 0,
    };

    const usdValueMap = {
      SOL: formattedSolBalanceUSD || '$0.00',
      USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00',
      ETH: formattedEthBalanceUSD || '$0.00',
      TRX: formattedTrxBalanceUSD || '$0.00',
      BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00',
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
        if (token.symbol === 'BTC') {
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
    trxBalance, bnbBalance, maticBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD, formattedBtcBalanceUSD
  ]);

  const selectedToken = useMemo(() => {
    const tokenIdentifier = tokenId || tokenSymbol?.toLowerCase() || 'sol';
    return tokenMap[tokenIdentifier] || tokenMap['sol'] || tokenMap['usdt'] || Object.values(tokenMap)[0];
  }, [tokenId, tokenSymbol, tokenMap]);

  // Fetch networks when token changes
  useEffect(() => {
    if (selectedToken?.symbol) {
      fetchNetworksForCurrency(selectedToken.symbol);
      setSelectedNetwork(null);
      resetFeeCalculation();
    }
  }, [selectedToken?.symbol, fetchNetworksForCurrency, resetFeeCalculation]);

  // Calculate fee when both network and amount are filled
  useEffect(() => {
    if (selectedNetwork && amount && parseFloat(amount) > 0 && selectedToken?.symbol) {
      console.log('🔄 Triggering fee calculation:', {
        amount,
        currency: selectedToken.symbol,
        network: selectedNetwork.code
      });
      
      calculateFee(parseFloat(amount), selectedToken.symbol, selectedNetwork.code);
    } else {
      resetFeeCalculation();
    }
  }, [selectedNetwork, amount, selectedToken?.symbol, calculateFee, resetFeeCalculation]);

  // Helper functions (keep all existing helper functions)
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
      case 'WITHDRAWAL_FAILED':
        return 'server';
      default:
        return 'general';
    }
  };

  const handleNetworkSelect = (network: NetworkOption) => {
    setSelectedNetwork(network);
    console.log('Selected network:', network);
  };

  const handleNetworkDropdownPress = () => {
    if (selectedToken?.symbol) {
      if (availableNetworks.length === 0) {
        fetchNetworksForCurrency(selectedToken.symbol);
      }
    }
    setShowNetworkModal(true);
  };

  const validateForm = (): boolean => {
    clearWithdrawalErrors();
    
    if (!walletAddress.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'Wallet Address Required',
        message: 'Please enter a wallet address to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    if (walletAddress.length < 10) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Wallet Address',
        message: 'Please enter a valid wallet address',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (!selectedNetwork) {
      showErrorMessage({
        type: 'validation',
        title: 'Network Required',
        message: 'Please select a network to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0 || isNaN(amountValue)) {
      showErrorMessage({
        type: 'validation',
        title: 'Amount Required',
        message: 'Please enter a valid amount to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    if (!feeCalculation) {
      showErrorMessage({
        type: 'validation',
        title: 'Fee Calculation Required',
        message: 'Please wait for fee calculation to complete',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    if (feeError) {
      showErrorMessage({
        type: 'server',
        title: 'Fee Calculation Error',
        message: feeError.message || 'Failed to calculate withdrawal fee',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) {
      setShowPinModal(true);
    }
  };

  const formatAmountForDisplay = (value: number, symbol?: string): string => {
    if (!symbol) return value.toString();
    
    switch (symbol) {
      case 'BTC':
        return Number(value.toFixed(8)).toString();
      case 'ETH':
        return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC':
        return value.toFixed(2);
      default:
        if (value >= 1000) {
          return value.toFixed(2);
        } else if (value >= 1) {
          return Number(value.toFixed(4)).toString();
        } else if (value >= 0.01) {
          return Number(value.toFixed(4)).toString();
        } else if (value >= 0.001) {
          return Number(value.toFixed(6)).toString();
        } else {
          const str = value.toPrecision(3);
          return Number(str).toString();
        }
    }
  };

  const handleMaxPress = (): void => {
    if (selectedToken?.balance) {
      const balance = selectedToken.balance;
      const formattedAmount = formatAmountForDisplay(balance, selectedToken.symbol);
      
      console.log('Setting max amount:', {
        rawBalance: balance,
        formattedDisplay: formattedAmount,
        symbol: selectedToken.symbol
      });
      
      setAmount(formattedAmount);
    }
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
      if (!selectedNetwork || !selectedToken) {
        throw new Error('Missing required data');
      }

      const withdrawalData = {
        destination: {
          address: walletAddress.trim(),
          network: selectedNetwork.code,
          memo: ''
        },
        amount: parseFloat(amount),
        currency: selectedToken.symbol,
        twoFactorCode: code,
        passwordpin: passwordPin,
        memo: '',
        narration: `External wallet transfer - ${selectedToken.symbol}`
      };

      console.log('🔄 Initiating withdrawal:', withdrawalData);

      const result = await initiateWithdrawal(withdrawalData);

      if (result.success) {
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setPasswordPin('');
        setTwoFactorCode('');
        
        const transactionData: APITransaction = {
          id: result.transactionId || result.id || Date.now().toString(),
          type: 'Withdrawal',
          status: 'Successful',
          amount: `-${amount} ${selectedToken.symbol}`,
          date: new Date().toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          createdAt: new Date().toISOString(),
          details: {
            category: 'token' as const,
            transactionId: result.transactionId || result.id,
            currency: selectedToken.symbol,
            network: selectedNetwork.name,
            address: walletAddress.trim(),
            hash: result.transactionHash || result.hash,
            fee: feeCalculation?.feeAmount || feeCalculation?.fee,
            narration: `External wallet transfer to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          } as TokenDetails
        };

        const rawTransactionData = {
          id: result.transactionId || result.id,
          transactionId: result.transactionId || result.id,
          type: 'WITHDRAWAL',
          status: 'SUCCESSFUL',
          currency: selectedToken.symbol,
          symbol: selectedToken.symbol,
          amount: parseFloat(amount),
          formattedAmount: `-${amount} ${selectedToken.symbol}`,
          network: selectedNetwork.code,
          networkName: selectedNetwork.name,
          address: walletAddress.trim(),
          walletAddress: walletAddress.trim(),
          to: walletAddress.trim(),
          hash: result.transactionHash || result.hash,
          transactionHash: result.transactionHash || result.hash,
          fee: feeCalculation?.feeAmount || feeCalculation?.fee,
          networkFee: feeCalculation?.feeAmount || feeCalculation?.fee,
          feeUsd: feeCalculation?.feeUsd,
          narration: withdrawalData.narration,
          createdAt: new Date().toISOString(),
          formattedDate: new Date().toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          details: {
            transactionId: result.transactionId || result.id,
            currency: selectedToken.symbol,
            network: selectedNetwork.code,
            address: walletAddress.trim(),
            hash: result.transactionHash || result.hash,
            fee: feeCalculation?.feeAmount || feeCalculation?.fee,
            narration: withdrawalData.narration
          }
        };

        router.push({
          pathname: '/history/WithdrawalReceipt',
          params: {
            tx: encodeURIComponent(JSON.stringify(transactionData)),
            raw: encodeURIComponent(JSON.stringify(rawTransactionData)),
          },
        });
        
      } else {
        setShowTwoFactorModal(false);
        
        const errorAction = getErrorAction?.(result.requiresAction);
        const errorType = getErrorType(result.error || 'GENERAL_ERROR');
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            errorAction: errorAction,
            onActionPress: () => {
              if (errorAction.route) {
                router.push(errorAction.route);
              } else {
                if (result.requiresAction === 'RETRY_PIN') {
                  setPasswordPin('');
                  setShowPinModal(true);
                } else if (result.requiresAction === 'RETRY_2FA') {
                  setTwoFactorCode('');
                  setShowTwoFactorModal(true);
                }
              }
            },
            autoHide: false,
            dismissible: true
          });
        } else {
          showErrorMessage({
            type: errorType,
            title: 'Withdrawal Failed',
            message: result.message || 'Something went wrong. Please try again.',
            autoHide: true,
            duration: 4000
          });
        }
      }
    } catch (error) {
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

  const loading = tokensLoading || balanceLoading;
  const error = tokensError || balanceError;

  const isFormValid: boolean = !!(
    walletAddress.trim() && 
    walletAddress.length >= 10 &&
    selectedNetwork && 
    amount && 
    parseFloat(amount) > 0 &&
    feeCalculation &&
    !feeError
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading token data...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load token data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const NetworkSelectionModal = () => {
    const handleNetworkPress = (network: NetworkOption) => {
      handleNetworkSelect(network);
      setShowNetworkModal(false);
    };

    const renderNetworkOption = ({ item }: { item: NetworkOption }) => {
      const isSelected = selectedNetwork?.id === item.id || selectedNetwork?.code === item.code;
      
      return (
        <TouchableOpacity 
          style={[
            styles.networkItem,
            isSelected && styles.selectedNetworkItem
          ]}
          onPress={() => handleNetworkPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.networkInfo}>
            <Text style={styles.networkName}>{item.name}</Text>
            {item.feeUsd && (
              <Text style={styles.networkFee}>Fee: ~${item.feeUsd.toFixed(2)}</Text>
            )}
          </View>
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    const renderEmptyState = () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {networksError?.message 
            ? `Failed to load networks${selectedToken?.symbol ? ` for ${selectedToken.symbol}` : ''}`
            : `No networks available${selectedToken?.symbol ? ` for ${selectedToken.symbol}` : ''}`
          }
        </Text>
        {networksError && (
          <TouchableOpacity style={styles.retryButton} onPress={() => setShowNetworkModal(false)}>
            <Text style={styles.retryButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );

    const renderLoadingState = () => (
      <View style={styles.networkLoadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.networkLoadingText}>Loading networks...</Text>
      </View>
    );

    const renderContent = () => {
      if (isFetchingNetworks) {
        return renderLoadingState();
      }

      if (networksError || availableNetworks.length === 0) {
        return renderEmptyState();
      }

      return (
        <FlatList
          data={availableNetworks}
          renderItem={renderNetworkOption}
          keyExtractor={(item) => item.id || item.code}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.networkList}
        />
      );
    };

    return (
      <Modal
        visible={showNetworkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNetworkModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select Network{selectedToken?.symbol ? ` for ${selectedToken.symbol}` : ''}
                  </Text>
                  <TouchableOpacity onPress={() => setShowNetworkModal(false)} style={styles.closeButtonContainer}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {renderContent()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

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

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section - Updated to match BTC-BSC */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              <View style={styles.headerGroup}>
                <Text style={styles.headerTitle}>Transfer to external wallet</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedToken?.symbol ? `${selectedToken.name} (${selectedToken.symbol})` : ''}
                </Text>
              </View>

              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitleText}>
              Transfer your funds securely and instantly to any external wallet.
            </Text>
          </View>

          {/* Wallet Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.addressInput}
                placeholder="Paste here"
                placeholderTextColor={Colors.text?.secondary}
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={true}
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Network Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network</Text>
            <TouchableOpacity
              style={styles.networkDropdownCard}
              onPress={handleNetworkDropdownPress}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.networkInput, 
                !selectedNetwork && styles.networkPlaceholder
              ]}>
                {selectedNetwork ? selectedNetwork.name : 'Select Network'}
              </Text>
              <Image source={arrowDownIcon} style={styles.inputArrow} />
            </TouchableOpacity>
          </View>

          {/* Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountInputCard}>
              <View style={styles.inputLeft}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text?.secondary}
                />
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
                  <TouchableOpacity onPress={handleMaxPress}>
                    <Text style={styles.maxText}>Max</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Transaction Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network fee:</Text>
                <Text style={styles.summaryValue}>
                  {isCalculatingFee ? (
                    'Calculating...'
                  ) : feeCalculation ? (
                    `${feeCalculation.feeFormatted} ${selectedToken?.symbol} (~$${feeCalculation.feeUsd.toFixed(2)})`
                  ) : (
                    '---'
                  )}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>The receiver will get:</Text>
                <Text style={styles.summaryValue}>
                  {feeCalculation ? (
                    `${feeCalculation.receiverAmountFormatted} ${selectedToken?.symbol}`
                  ) : (
                    `--- ${selectedToken?.symbol}`
                  )}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isFormValid || isInitiating || isCalculatingFee}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isInitiating ? 'Processing...' : isCalculatingFee ? 'Calculating...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        <NetworkSelectionModal />

        <PinEntryModal
          visible={showPinModal}
          onClose={handlePinModalClose}
          onSubmit={handlePinSubmit}
          loading={false}
          title="Enter Password PIN"
          subtitle="Please enter your 6-digit password PIN to continue with the withdrawal"
        />

        <TwoFactorAuthModal
          visible={showTwoFactorModal}
          onClose={handleTwoFactorModalClose}
          onSubmit={handleTwoFactorSubmit}
          loading={isInitiating}
          title="Two-Factor Authentication"
          subtitle="Please enter the 6-digit code from your authenticator app"
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F8F9FA' 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary || '#35297F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
  },

  // Header - Updated to match BTC-BSC
  headerSection: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

  // Subtitle styles
  subtitleSection: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 8,
    paddingBottom: 20,
  },
  subtitleText: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
  },

  // Section styles
  section: {
    paddingHorizontal: horizontalPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 12,
  },

  // Input card styles
  inputCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
  },

  // Network dropdown card
  networkDropdownCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 0,
  },

  // Amount input card
  amountInputCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 0,
  },

  // Address input styles
  addressInput: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 4,
    textAlignVertical: 'top',
  },

  // Network input styles
  networkInput: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 4,
    textAlignVertical: 'center',
    flex: 1,
  },
  networkPlaceholder: {
    color: Colors.text?.secondary || '#6B7280',
  },
  inputArrow: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  inputLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  amountInput: {
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
    paddingVertical: 4,
    margin: 0,
    flexShrink: 1,
  },
  tokenSelector: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '50%',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tokenIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    marginRight: 6,
  },
  tokenText: {
    fontFamily: Typography.medium || 'System',
    fontSize: 11,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  balanceText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 9,
    color: Colors.text?.secondary || '#6B7280',
  },
  maxText: {
    fontFamily: Typography.medium || 'System',
    fontSize: 9,
    color: Colors.primary || '#35297F',
    fontWeight: '600',
  },

  // Summary styles
  summarySection: {
    paddingHorizontal: horizontalPadding,
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    fontWeight: '400',
  },
  summaryValue: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Button styles
  buttonContainer: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 24,
    backgroundColor: Colors.background || '#F8F9FA',
  },
  continueButton: {
    backgroundColor: Colors.primary || '#35297F',
    borderRadius: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderTopLeftRadius: Layout?.borderRadius?.xl || 16,
    borderTopRightRadius: Layout?.borderRadius?.xl || 16,
    padding: Layout?.spacing?.lg || 16,
    width: '100%',
    maxHeight: '70%',
    minHeight: '45%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout?.spacing?.md || 12,
    paddingBottom: Layout?.spacing?.xs || 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: Typography.bold || 'System',
    fontSize: 14,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
    flex: 1,
  },
  closeButtonContainer: {
    padding: Layout?.spacing?.xs || 8,
  },
  closeButton: {
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '500',
  },
  networkList: {
    paddingBottom: Layout?.spacing?.sm || 8,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout?.spacing?.lg || 16,
    paddingHorizontal: Layout?.spacing?.lg || 16,
    backgroundColor: '#F0EFFF',
    marginBottom: Layout?.spacing?.sm || 8,
    borderRadius: Layout?.borderRadius?.md || 8,
  },
  selectedNetworkItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.primary || '#35297F',
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  networkFee: {
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '400',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary || '#35297F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.surface || '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  
  networkLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout?.spacing?.xl || 24,
  },
  networkLoadingText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    marginTop: Layout?.spacing?.md || 12,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout?.spacing?.xl || 24,
  },
  emptyText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    textAlign: 'center',
    marginBottom: Layout?.spacing?.md || 12,
  },
});

export default ExternalWalletTransferScreen;