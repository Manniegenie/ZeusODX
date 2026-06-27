import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
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
import ExternalWithdrawalConfirm from '../../components/ExternalWithdrawalConfirm';
import Loading from '../../components/Loading';
import NetworkSelectionModal from '../../components/NetworkSelectionModal';
import PinEntryModal from '../../components/PinEntry';
import HintBulb from '../../components/HintBulb';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Typography } from '../../constants/Typography';
import { useNetworks } from '../../hooks/useNetwork';
import { useTokens } from '../../hooks/useTokens';
import { useBalance } from '../../hooks/useWallet';
import { useWithdrawal } from '../../hooks/useexternalWithdrawal';
import { withdrawalService } from '../../services/externalwithdrawalService';

import AppsFlyerService from '../../services/appsFlyerService';

// Icons - Updated to match BTC-BSC screen
// @ts-ignore
import arrowDownIcon from '../../components/icons/arrow-down.png';

const { width: screenWidth } = Dimensions.get('window');

// Detects likely network codes from a crypto address format
function detectNetworkCodesFromAddress(address: string): string[] {
  if (!address || address.length < 10) return [];
  const a = address.trim();
  // EVM: 0x + 40 hex chars (ETH, BSC, Polygon, Arbitrum, Base)
  if (/^0x[0-9a-fA-F]{40}$/.test(a)) return ['ETH', 'ERC20', 'BSC', 'BEP20', 'POLYGON', 'MATIC', 'ARB', 'BASE'];
  // Bitcoin: bech32 (bc1), P2PKH (1...), P2SH (3...)
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(a)) return ['BTC'];
  // Tron: T + 33 base58 chars
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return ['TRX', 'TRON', 'TRC20'];
  // TON: EQ or UQ + 46 base64url chars
  if (/^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(a)) return ['TON'];
  // Solana: base58, 32–44 chars (no 0x / T / bc1 prefix)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return ['SOL'];
  return [];
}

// Strip crypto URI schemes: "bitcoin:addr", "ethereum:0xaddr?amount=..." → just the address
function parseAddressFromQR(raw: string): string {
  if (!raw) return '';
  const schemes = ['bitcoin:', 'ethereum:', 'solana:', 'tron:', 'ton:', 'litecoin:'];
  for (const scheme of schemes) {
    if (raw.toLowerCase().startsWith(scheme)) {
      return raw.slice(scheme.length).split('?')[0].trim();
    }
  }
  return raw.trim();
}

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  // Camera / QR scanner
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const scanLockRef = useRef(false);

  // Network modal state
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption | null>(null);

  // Form input states
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Error display state
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // Authentication data
  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  // Idempotency key - generated once per withdrawal attempt
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

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
    trxBalance, bnbBalance, maticBalance, btcBalance, tonBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD, formattedBtcBalanceUSD, formattedTonBalanceUSD,
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
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'TRX', 'BNB', 'MATIC', 'BTC', 'TON'] as const;

    const balanceMap: Record<typeof targetSymbols[number], number> = {
      SOL: solBalance || 0, USDC: usdcBalance || 0, USDT: usdtBalance || 0, ETH: ethBalance || 0,
      TRX: trxBalance || 0, BNB: bnbBalance || 0, MATIC: maticBalance || 0, BTC: btcBalance || 0,
      TON: tonBalance || 0,
    };

    const usdValueMap: Record<typeof targetSymbols[number], string> = {
      SOL: formattedSolBalanceUSD || '$0.00', USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00', ETH: formattedEthBalanceUSD || '$0.00',
      TRX: formattedTrxBalanceUSD || '$0.00', BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00', BTC: formattedBtcBalanceUSD || '$0.00',
      TON: formattedTonBalanceUSD || '$0.00',
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

  const feeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current);

    if (selectedNetwork && amount && parseFloat(amount) > 0 && selectedToken?.symbol) {
      // Reset immediately so stale amount/fee values never linger while typing
      resetFeeCalculation();

      feeDebounceRef.current = setTimeout(async () => {
        const requestId = ++feeRequestIdRef.current;
        const result = await calculateFee(parseFloat(amount), selectedToken.symbol, selectedNetwork.code);
        // Discard if a newer request has already started
        if (requestId !== feeRequestIdRef.current) return;
        if (!result?.success) resetFeeCalculation();
      }, 500); // wait 500ms after user stops typing
    } else {
      resetFeeCalculation();
    }

    return () => {
      if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current);
    };
  }, [selectedNetwork, amount, selectedToken?.symbol]);

  // Auto-detect network from wallet address
  useEffect(() => {
    if (!walletAddress || availableNetworks.length === 0) return;
    const possibleCodes = detectNetworkCodesFromAddress(walletAddress);
    if (possibleCodes.length === 0) return;
    const match = availableNetworks.find(n =>
      possibleCodes.some(code =>
        n.code?.toUpperCase() === code || n.code?.toUpperCase().includes(code) || code.includes(n.code?.toUpperCase())
      )
    );
    if (match && match.id !== selectedNetwork?.id) {
      setSelectedNetwork(match);
    }
  }, [walletAddress, availableNetworks]);

  const handleOpenScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showErrorMessage({ type: 'validation', title: 'Camera Permission', message: 'Camera access is required to scan QR codes.', autoHide: true, duration: 3000 });
        return;
      }
    }
    scanLockRef.current = false;
    setShowScanner(true);
  };

  const handleQRScanned = ({ data }: { data: string }) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    const address = parseAddressFromQR(data);
    setWalletAddress(address);
    setShowScanner(false);
  };

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
    if (!feeCalculation || feeError) return false;
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) {
      // Generate idempotency key once per withdrawal attempt
      const newKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      setIdempotencyKey(newKey);
      setShowConfirmModal(true);
    }
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

  const handleConfirmPress = (): void => {
    setShowConfirmModal(false);
    setShowPinModal(true);
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
        narration: `External wallet transfer - ${selectedToken.symbol}`,
        idempotencyKey // Pass the stored idempotency key
      };

      const result = await initiateWithdrawal(withdrawalData);

      if (result.success) {
        setIdempotencyKey('');

        AppsFlyerService.logEvent('Withdrawal', {
          af_revenue: parseFloat(String(amount)) || 0,
          af_currency: selectedToken.symbol,
          af_content_type: 'crypto_withdrawal',
          af_order_id: String(result.transactionId || result.id || Date.now()),
        }).catch(() => {});

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
        <StatusBar backgroundColor={colors.background} barStyle={colors.statusBar} />

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
            rightComponent={
              <HintBulb
                title="External transfer tip"
                hint="Enter the recipient's wallet address and select the same network they use. Double-check the address and network to avoid loss of funds. Network fees are deducted from the amount."
              />
            }
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
                  placeholder="Enter or scan wallet address"
                  placeholderTextColor={colors.textSecondary}
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  numberOfLines={1}
                />
                <View style={styles.addressActions}>
                  <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                    <Text style={styles.pasteButtonText}>Paste</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenScanner} style={styles.scanButton}>
                    <Ionicons name="camera-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              {walletAddress.length > 0 && detectNetworkCodesFromAddress(walletAddress).length > 0 && (
                <View style={styles.detectedBadge}>
                  <Text style={styles.detectedBadgeText}>
                    {selectedNetwork
                      ? `✓ ${selectedNetwork.name} auto-selected`
                      : `Detected: ${detectNetworkCodesFromAddress(walletAddress).slice(0,3).join(' / ')}`}
                  </Text>
                </View>
              )}
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
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.tokenSelector}>
                <View style={styles.tokenContainer}>
                  <Image source={selectedToken?.icon} style={styles.tokenIcon} />
                  <Text style={styles.tokenText}>{selectedToken?.symbol}</Text>
                </View>
                <Text style={styles.balanceText}>{selectedToken?.formattedBalance}</Text>
                <TouchableOpacity onPress={handleMaxPress}>
                  <Text style={styles.maxText}>Max</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Min. withdrawal:</Text>
                <Text style={styles.summaryValue}>
                  {selectedToken?.symbol
                    ? `${withdrawalService.getMinimumWithdrawalAmount(selectedToken.symbol)} ${selectedToken.symbol}`
                    : '---'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network fee:</Text>
                <Text style={styles.summaryValue}>
                  {isCalculatingFee
                    ? 'Calculating...'
                    : feeCalculation
                      ? `${(feeCalculation as any).feeFormatted} ${selectedToken?.symbol} (~$${Number((feeCalculation as any).feeUsd ?? 0).toFixed(2)})`
                      : '---'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>The receiver will get:</Text>
                <Text style={styles.summaryValue}>
                  {isCalculatingFee
                    ? 'Calculating...'
                    : feeCalculation
                      ? `${(feeCalculation as any).receiverAmountFormatted ?? '---'} ${selectedToken?.symbol}`
                      : `--- ${selectedToken?.symbol}`}
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

        <ExternalWithdrawalConfirm
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmPress}
          transactionData={{
            destination: {
              address: walletAddress.trim(),
              network: selectedNetwork?.code || '',
              memo: ''
            },
            amount: parseFloat(amount || '0'),
            currency: selectedToken?.symbol || '',
            fee: (feeCalculation as any)?.fee || 0,
            receiverAmount: (feeCalculation as any)?.receiverAmount,
            networkName: selectedNetwork?.name
          }}
        />

        {isInitiating && <Loading />}

        {/* QR Scanner Modal */}
        <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
          <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={handleQRScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            {/* Overlay frame */}
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerHint}>Align QR code within the frame</Text>
            </View>
            <TouchableOpacity style={styles.scannerClose} onPress={() => setShowScanner(false)}>
              <Text style={styles.scannerCloseText}>✕  Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontFamily: Typography.regular || 'System' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  errorText: { fontSize: 14, color: colors.textSecondary, fontFamily: Typography.regular || 'System', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '600' },
  subtitleSection: { paddingHorizontal: horizontalPadding, paddingVertical: 12 },
  subtitleText: { color: colors.textSecondary, fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400' },
  section: { paddingHorizontal: horizontalPadding, marginBottom: 24 },
  sectionTitle: { color: colors.textSecondary, fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400', marginBottom: 12 },
  inputCard: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  addressInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressInput: { color: colors.text, fontFamily: Typography.regular || 'System', fontSize: 14, flex: 1, paddingVertical: 0 },
  addressActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  pasteButton: { backgroundColor: colors.separator, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  pasteButtonText: { fontSize: 11, color: colors.primary, fontWeight: '600', fontFamily: Typography.medium || 'System' },
  scanButton: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  detectedBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.iconBg, borderRadius: 6, alignSelf: 'flex-start' },
  detectedBadgeText: { fontSize: 11, color: colors.primary, fontFamily: Typography.medium || 'System', fontWeight: '600' },
  // Scanner modal
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 240, height: 240, borderWidth: 2, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  scannerHint: { color: '#fff', fontSize: 13, marginTop: 20, textAlign: 'center', fontFamily: Typography.regular || 'System' },
  scannerClose: { position: 'absolute', top: 56, right: 20, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  scannerCloseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  networkDropdownCard: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountInputCard: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkInput: { color: colors.text, fontFamily: Typography.regular || 'System', fontSize: 14, flex: 1 },
  networkPlaceholder: { color: colors.textSecondary },
  inputArrow: { width: 16, height: 16, resizeMode: 'contain', tintColor: colors.text },
  inputLeft: { flex: 1, justifyContent: 'center' },
  amountInput: { fontFamily: Typography.medium || 'System', fontSize: 14, color: colors.text, fontWeight: '600', paddingVertical: 0 },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.separator, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tokenIcon: { width: 18, height: 18, marginRight: 6 },
  tokenText: { fontFamily: Typography.medium || 'System', fontSize: 12, color: colors.text, fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceText: { fontFamily: Typography.regular || 'System', fontSize: 10, color: colors.textSecondary },
  maxText: { fontFamily: Typography.medium || 'System', fontSize: 10, color: colors.primary, fontWeight: '600' },
  summarySection: { paddingHorizontal: horizontalPadding, marginBottom: 24 },
  summaryCard: { borderRadius: 8, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: colors.textSecondary, fontSize: 11 },
  summaryValue: { color: colors.text, fontFamily: Typography.medium || 'System', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'right' },
  buttonSafeArea: { backgroundColor: colors.background },
  buttonContainer: { paddingHorizontal: horizontalPadding, paddingTop: 16, paddingBottom: 50 },
  continueButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#9CA3AF' },
  continueButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
});

export default ExternalWalletTransferScreen;