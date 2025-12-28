import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import TwoFactorAuthModal from '../../components/2FA';
import ErrorDisplay from '../../components/ErrorDisplay';
import Loading from '../../components/Loading';
import NetworkSelectionModal from '../../components/NetworkSelectionModal';
import PinEntryModal from '../../components/PinEntry';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useNetworks } from '../../hooks/useNetwork';
import { useTokens } from '../../hooks/useTokens';
import { useBalance } from '../../hooks/useWallet';
import { useWithdrawal } from '../../hooks/useexternalWithdrawal';
import { withdrawalService } from '../../services/externalwithdrawalService';

// Icons - Updated to match BTC-BSC screen
// @ts-ignore
import arrowDownIcon from '../../components/icons/arrow-down.png';

const { width: screenWidth } = Dimensions.get('window');

const getHorizontalPadding = (): number => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  else return 28;
};

const horizontalPadding = getHorizontalPadding();

// Type definitions 
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
    solBalance, usdcBalance, usdtBalance, ethBalance,
    trxBalance, bnbBalance, maticBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD, formattedBtcBalanceUSD,
    loading: balanceLoading, error: balanceError
  } = useBalance();

  const {
    availableNetworks, isFetchingNetworks, networksError, fetchNetworksForCurrency
  } = useNetworks();

  const {
    calculateFee, initiateWithdrawal, feeCalculation,
    isCalculatingFee, isInitiating, feeError,
    clearErrors: clearWithdrawalErrors, getErrorAction, resetFeeCalculation
  } = useWithdrawal();

  // Helper to prevent scientific notation and truncation for user trust
  const toPreciseString = (num: number): string => {
    return num.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 18 
    });
  };

  const tokenMap = useMemo((): { [key: string]: TokenOption } => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'TRX', 'BNB', 'MATIC', 'BTC'] as const;
    
    const balanceMap: Record<typeof targetSymbols[number], number> = {
      SOL: solBalance || 0, USDC: usdcBalance || 0, USDT: usdtBalance || 0, ETH: ethBalance || 0,
      TRX: trxBalance || 0, BNB: bnbBalance || 0, MATIC: maticBalance || 0, BTC: btcBalance || 0,
    };

    const usdValueMap: Record<typeof targetSymbols[number], string> = {
      SOL: formattedSolBalanceUSD || '$0.00', USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00', ETH: formattedEthBalanceUSD || '$0.00',
      TRX: formattedTrxBalanceUSD || '$0.00', BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00', BTC: formattedBtcBalanceUSD || '$0.00',
    };

    const tokenMapResult: { [key: string]: TokenOption } = {};

    allTokens
      .filter(token => targetSymbols.includes(token.symbol as typeof targetSymbols[number]))
      .forEach(token => {
        const symbol = token.symbol as typeof targetSymbols[number];
        const balance = balanceMap[symbol] || 0;
        
        tokenMapResult[symbol.toLowerCase()] = {
          id: token.id,
          name: token.name,
          symbol,
          icon: token.icon,
          balance,
          usdValue: balance * (token.currentPrice || 0),
          hasBalance: balance > 0,
          formattedBalance: toPreciseString(balance), // High precision for user trust
          formattedUsdValue: usdValueMap[symbol],
          currentPrice: token.currentPrice || 0,
        };
      });

    return tokenMapResult;
  }, [allTokens, solBalance, usdcBalance, usdtBalance, ethBalance, trxBalance, bnbBalance, maticBalance, btcBalance]);

  const selectedToken = useMemo(() => {
    const tokenIdentifier = tokenId || tokenSymbol?.toLowerCase() || 'sol';
    return tokenMap[tokenIdentifier] || tokenMap['sol'] || tokenMap['usdt'] || Object.values(tokenMap)[0];
  }, [tokenId, tokenSymbol, tokenMap]);

  useEffect(() => {
    if (selectedToken?.symbol) {
      fetchNetworksForCurrency(selectedToken.symbol);
      setSelectedNetwork(null);
      resetFeeCalculation();
    }
  }, [selectedToken?.symbol]);

  useEffect(() => {
    if (selectedNetwork && amount && parseFloat(amount) > 0 && selectedToken?.symbol) {
      calculateFee(parseFloat(amount), selectedToken.symbol, selectedNetwork.code);
    } else {
      resetFeeCalculation();
    }
  }, [selectedNetwork, amount, selectedToken?.symbol]);

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
      case 'SETUP_2FA_REQUIRED': case 'SETUP_PIN_REQUIRED': return 'setup';
      case 'INVALID_2FA_CODE': case 'INVALID_PASSWORDPIN': return 'auth';
      case 'KYC_LIMIT_EXCEEDED': return 'limit';
      case 'INSUFFICIENT_BALANCE': return 'balance';
      case 'VALIDATION_ERROR': return 'validation';
      case 'NETWORK_ERROR': return 'network';
      case 'SERVICE_ERROR': case 'WITHDRAWAL_FAILED': return 'server';
      default: return 'general';
    }
  };

  const handleNetworkSelect = (network: NetworkOption) => {
    setSelectedNetwork(network);
  };

  const handleNetworkDropdownPress = () => {
    if (selectedToken?.symbol && availableNetworks.length === 0) {
      fetchNetworksForCurrency(selectedToken.symbol);
    }
    setShowNetworkModal(true);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setWalletAddress(text.trim());
  };

  const validateForm = (): boolean => {
    clearWithdrawalErrors();
    if (!walletAddress.trim()) {
      showErrorMessage({ type: 'validation', title: 'Wallet Address Required', message: 'Please enter a wallet address', autoHide: true, duration: 3000 });
      return false;
    }
    if (walletAddress.length < 10) {
      showErrorMessage({ type: 'validation', title: 'Invalid Wallet Address', message: 'Please enter a valid wallet address', autoHide: true, duration: 3000 });
      return false;
    }
    if (!selectedNetwork) {
      showErrorMessage({ type: 'validation', title: 'Network Required', message: 'Please select a network', autoHide: true, duration: 3000 });
      return false;
    }
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0 || isNaN(amountValue)) {
      showErrorMessage({ type: 'validation', title: 'Amount Required', message: 'Please enter a valid amount', autoHide: true, duration: 3000 });
      return false;
    }
    if (selectedToken?.symbol) {
      const min = withdrawalService.getMinimumWithdrawalAmount(selectedToken.symbol);
      if (amountValue < min) {
        showErrorMessage({ type: 'validation', title: 'Amount Too Low', message: `Minimum withdrawal is ${min} ${selectedToken.symbol}`, autoHide: true, duration: 4000 });
        return false;
      }
    }
    if (!feeCalculation || feeError) return false;
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) setShowPinModal(true);
  };

  const handleMaxPress = (): void => {
    if (selectedToken?.balance) {
      // Set the input to the exact balance string to avoid dust
      setAmount(toPreciseString(selectedToken.balance));
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
    setShowTwoFactorModal(false);
    
    try {
      if (!selectedNetwork || !selectedToken) throw new Error('Missing data');

      const withdrawalData = {
        destination: { address: walletAddress.trim(), network: selectedNetwork.code, memo: '' },
        amount: parseFloat(amount),
        currency: selectedToken.symbol,
        twoFactorCode: code,
        passwordpin: passwordPin,
        memo: '',
        narration: `External wallet transfer - ${selectedToken.symbol}`
      };

      const result = await initiateWithdrawal(withdrawalData);

      if (result.success) {
        const transactionData: APITransaction = {
          id: result.transactionId || result.id || Date.now().toString(),
          type: 'Withdrawal', status: 'Successful', amount: `-${amount} ${selectedToken.symbol}`,
          date: new Date().toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          details: {
            category: 'token' as const, transactionId: result.transactionId || result.id,
            currency: selectedToken.symbol, network: selectedNetwork.name,
            address: walletAddress.trim(), hash: result.transactionHash || result.hash,
            fee: (feeCalculation as any)?.feeAmount || (feeCalculation as any)?.fee,
            narration: withdrawalData.narration
          } as TokenDetails
        };

        router.push({
          pathname: '/history/WithdrawalReceipt',
          params: {
            tx: encodeURIComponent(JSON.stringify(transactionData)),
            raw: encodeURIComponent(JSON.stringify({ ...result, amount: parseFloat(amount) })),
          },
        });
      } else {
          const errorAction = getErrorAction?.(result.requiresAction) as ErrorAction | undefined;
          showErrorMessage({
            type: getErrorType(result.error || 'GENERAL_ERROR'),
            title: errorAction?.title || 'Withdrawal Failed',
            message: errorAction?.message || (result as any)?.message || 'Something went wrong.',
            errorAction: errorAction,
            onActionPress: () => {
              if (errorAction?.route) router.push(errorAction.route as any);
              else if (result.requiresAction === 'RETRY_PIN') setShowPinModal(true);
            },
            autoHide: false, dismissible: true
          });
      }
    } catch (error) {
      showErrorMessage({ type: 'server', title: 'Unexpected Error', message: 'An unexpected error occurred.', autoHide: true });
    }
  };

  const isFormValid: boolean = !!(walletAddress.trim().length >= 10 && selectedNetwork && parseFloat(amount) > 0 && feeCalculation && !feeError);

  if (tokensLoading || balanceLoading) return <Loading />;

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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Transfer to external wallet"
            subtitle={selectedToken?.symbol ? `${selectedToken.name} (${selectedToken.symbol})` : ''}
            onBack={() => router.back()}
          />

          <View style={styles.subtitleSection}>
            <Text style={styles.subtitleText}>Transfer your funds securely and instantly to any external wallet.</Text>
          </View>

          {/* Wallet Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <View style={styles.inputCard}>
              <View style={styles.addressInputRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter wallet address"
                  placeholderTextColor={Colors.text?.secondary}
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Network Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network</Text>
            <TouchableOpacity style={styles.networkDropdownCard} onPress={handleNetworkDropdownPress} activeOpacity={0.7}>
              <Text style={[styles.networkInput, !selectedNetwork && styles.networkPlaceholder]}>
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
                  <Text style={styles.balanceText}>{selectedToken?.formattedBalance} {selectedToken?.symbol}</Text>
                  <TouchableOpacity onPress={handleMaxPress}>
                    <Text style={styles.maxText}>Max</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network fee:</Text>
                <Text style={styles.summaryValue}>
                  {isCalculatingFee ? 'Calculating...' : feeCalculation ? 
                  `${(feeCalculation as any).feeFormatted} ${selectedToken?.symbol} (~$${(feeCalculation as any).feeUsd.toFixed(2)})` : '---'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>The receiver will get:</Text>
                <Text style={styles.summaryValue}>
                  {feeCalculation ? `${(feeCalculation as any).receiverAmountFormatted} ${selectedToken?.symbol}` : `--- ${selectedToken?.symbol}`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <SafeAreaView style={styles.buttonSafeArea}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={!isFormValid || isInitiating || isCalculatingFee}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isInitiating ? 'Processing...' : isCalculatingFee ? 'Calculating...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <NetworkSelectionModal
          visible={showNetworkModal}
          onClose={() => setShowNetworkModal(false)}
          onSelectNetwork={handleNetworkSelect}
          selectedNetwork={selectedNetwork}
          networks={availableNetworks}
          isLoading={isFetchingNetworks}
          error={networksError}
          tokenSymbol={selectedToken?.symbol}
        />

        <PinEntryModal
          visible={showPinModal}
          onClose={handlePinModalClose}
          onSubmit={handlePinSubmit}
          loading={false}
          title="Enter Password PIN"
        />

        <TwoFactorAuthModal
          visible={showTwoFactorModal}
          onClose={() => {setShowTwoFactorModal(false); setShowPinModal(true);}}
          onSubmit={handleTwoFactorSubmit}
          loading={isInitiating}
          title="Two-Factor Authentication"
        />

        {isInitiating && <Loading />}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  errorText: { fontSize: 14, color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.primary || '#35297F', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '600' },
  subtitleSection: { paddingHorizontal: horizontalPadding, paddingTop: 8, paddingBottom: 20 },
  subtitleText: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400' },
  section: { paddingHorizontal: horizontalPadding, marginBottom: 24 },
  sectionTitle: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400', marginBottom: 12 },
  inputCard: { backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12 },
  addressInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressInput: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 14, flex: 1, paddingVertical: 4 },
  pasteButton: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  pasteButtonText: { fontSize: 11, color: Colors.primary || '#35297F', fontWeight: '600', fontFamily: Typography.medium || 'System' },
  networkDropdownCard: { backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountInputCard: { backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkInput: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 14, flex: 1 },
  networkPlaceholder: { color: Colors.text?.secondary || '#6B7280' },
  inputArrow: { width: 16, height: 16, resizeMode: 'contain' },
  inputLeft: { flex: 1, justifyContent: 'center' },
  amountInput: { fontFamily: Typography.medium || 'System', fontSize: 14, color: Colors.text?.primary || '#111827', fontWeight: '600', paddingVertical: 4 },
  tokenSelector: { alignItems: 'flex-end', justifyContent: 'center', maxWidth: '50%' },
  tokenContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tokenIcon: { width: 16, height: 16, marginRight: 6 },
  tokenText: { fontFamily: Typography.medium || 'System', fontSize: 11, color: Colors.text?.primary || '#111827', fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 },
  balanceText: { fontFamily: Typography.regular || 'System', fontSize: 9, color: Colors.text?.secondary || '#6B7280' },
  maxText: { fontFamily: Typography.medium || 'System', fontSize: 9, color: Colors.primary || '#35297F', fontWeight: '600' },
  summarySection: { paddingHorizontal: horizontalPadding, marginBottom: 24 },
  summaryCard: { borderRadius: 8, borderWidth: 0.5, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: Colors.text?.secondary || '#6B7280', fontSize: 11 },
  summaryValue: { color: Colors.text?.primary || '#111827', fontFamily: Typography.medium || 'System', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'right' },
  buttonSafeArea: { backgroundColor: Colors.background || '#F8F9FA' },
  buttonContainer: { paddingHorizontal: horizontalPadding, paddingTop: 16, paddingBottom: 16 },
  continueButton: { backgroundColor: Colors.primary || '#35297F', borderRadius: 8, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#9CA3AF' },
  continueButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
});

export default ExternalWalletTransferScreen;