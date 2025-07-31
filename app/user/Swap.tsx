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
  Alert
} from 'react-native';
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
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>('from');

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
  const getTokenIcon = (id: string) => ({ btc: btcIcon, eth: ethIcon, sol: solIcon, usdt: usdtIcon, usdc: usdcIcon, ngnz: ngnzIcon }[id] || btcIcon);

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

  const formatDisplayAmount = (amount: string | number): string => {
    const num = parseFloat(amount as string) || 0;
    return num >= 1 ? num.toFixed(2) : num.toFixed(4);
  };

  const formatUsdValue = (amount: string, token: TokenOption | null): string => {
    const val = parseFloat(amount) || 0;
    const price = token?.price || 0;
    const usdValue = val * price;
    return token?.symbol === 'NGNZ' ? `₦${usdValue.toFixed(2)}` : `$${usdValue.toFixed(2)}`;
  };

  const getMaxBalance = (token: TokenOption | null): string => {
    if (!token) return '0';
    const currentBalance = getTokenBalance(token.symbol);
    return `${currentBalance.toFixed(4)} ${token.symbol}`;
  };

  const handleMax = () => {
    if (!selectedFromToken) return;
    const balance = getTokenBalance(selectedFromToken.symbol);
    setSelectedFromToken(prev => prev ? { ...prev, balance } : null);
    setFromAmount(balance.toString());
  };

  const handleCreateQuote = async () => {
    if (!selectedFromToken || !selectedToToken || parseFloat(fromAmount) <= 0) {
      Alert.alert('Invalid Input', 'Please select tokens and enter a valid amount');
      return;
    }
    if (!hasSufficientBalance(selectedFromToken.symbol, parseFloat(fromAmount))) {
      Alert.alert('Insufficient Balance', `You don't have enough ${selectedFromToken.symbol}. Available: ${getMaxBalance(selectedFromToken)}`);
      return;
    }

    try {
      let quoteResult = isNGNZOperation()
        ? await createNGNZQuote(selectedFromToken.symbol, selectedToToken.symbol, parseFloat(fromAmount), 'SELL')
        : await createCryptoQuote(selectedFromToken.symbol, selectedToToken.symbol, parseFloat(fromAmount), 'SELL');

      if (!quoteResult.success) {
        Alert.alert('Quote Failed', quoteResult.error || 'Failed to create quote');
        return;
      }

      let receiveAmount = quoteResult.data?.data?.amountReceived || quoteResult.data?.amountReceived || quoteResult.data?.data?.data?.amountReceived;
      if (receiveAmount) setToAmount(receiveAmount.toString());

      setShowPreviewModal(true);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the quote');
    }
  };

  const handleAcceptQuote = async () => {
    const currentQuote = getCurrentQuote();
    if (!currentQuote) {
      Alert.alert('No Quote', 'Please create a quote first');
      return;
    }
    const quoteId = currentQuote.data?.data?.id || currentQuote.data?.id || currentQuote.id;
    if (!quoteId) {
      Alert.alert('Invalid Quote', 'Quote ID not found.');
      return;
    }

    try {
      const result = isNGNZOperation() ? await acceptNGNZQuote(quoteId) : await acceptCryptoQuote(quoteId);
      if (result.success) {
        await refreshDashboard();
        setShowPreviewModal(false);
        setShowSuccessScreen(true);
        onSwap?.();
      } else {
        Alert.alert('Swap Failed', result.error || 'Failed to execute swap');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while executing the swap');
    }
  };

  const handleSuccessScreenContinue = () => {
    setFromAmount('0'); setToAmount('0'); setSelectedToToken(null);
    setShowSuccessScreen(false);
  };

  const handleTokenSelectorPress = (type: TokenSelectorType) => { setTokenSelectorType(type); setShowTokenModal(true); onSelectToken?.(); };
  const handleTokenSelect = (token: TokenOption) => {
    const updated = { ...token, balance: getTokenBalance(token.symbol), price: getTokenPrice(token.symbol) };
    tokenSelectorType === 'from' ? setSelectedFromToken(updated) : setSelectedToToken(updated);
    setToAmount('0'); clearQuote(); setShowTokenModal(false);
  };

  const { quoteLoading, acceptLoading } = getLoadingStates();
  const isSwapDisabled = !selectedFromToken || !selectedToToken || parseFloat(fromAmount) <= 0 || quoteLoading || acceptLoading;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {/* Title Tabs */}
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
                  onFocus={() => { if (fromAmount === '0') setFromAmount(''); }}
                  onBlur={() => { if (!fromAmount) setFromAmount('0'); }}
                  onChangeText={setFromAmount} 
                  placeholder="0" 
                  keyboardType="decimal-pad" 
                  placeholderTextColor={Colors.text.secondary} 
                />
                <Text style={styles.usdValue}>{formatUsdValue(fromAmount, selectedFromToken)}</Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity style={styles.tokenSelector} onPress={() => handleTokenSelectorPress('from')}>
                  {selectedFromToken && (<><Image source={getTokenIcon(selectedFromToken.id)} style={styles.tokenIcon} /><Text style={styles.tokenText}>{selectedFromToken.symbol}</Text></>)}
                </TouchableOpacity>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText} numberOfLines={1}>{getMaxBalance(selectedFromToken)}</Text>
                  <TouchableOpacity onPress={handleMax}><Text style={styles.maxText}>Max</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Swap Icon */}
          <View style={styles.swapIconContainer}><Image source={swapIcon} style={styles.swapIconImage} /></View>

          {/* Buy Token */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Buy</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput 
                  style={styles.amountInput} 
                  value={formatDisplayAmount(toAmount)} 
                  editable={false} 
                  placeholder="0" 
                  keyboardType="decimal-pad" 
                  placeholderTextColor={Colors.text.secondary} 
                />
                <Text style={styles.usdValue}>{formatUsdValue(toAmount, selectedToToken)}</Text>
              </View>
              <View style={styles.inputRight}>
                <TouchableOpacity style={styles.tokenSelector} onPress={() => handleTokenSelectorPress('to')}>
                  {selectedToToken ? (<><Image source={getTokenIcon(selectedToToken.id)} style={styles.tokenIcon} /><Text style={styles.tokenText}>{selectedToToken.symbol}</Text></>) : (<Text style={styles.tokenText}>Select token</Text>)}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity style={[styles.swapActionButton, isSwapDisabled && styles.swapActionButtonDisabled]} onPress={handleCreateQuote} disabled={isSwapDisabled}>
              <Text style={[styles.swapActionButtonText, isSwapDisabled && styles.swapActionButtonTextDisabled]}>{quoteLoading ? 'Creating Quote...' : 'Create Quote'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="swap" />

      {/* Token Modal */}
      <ChooseTokenModal visible={showTokenModal} onClose={() => setShowTokenModal(false)} onTokenSelect={handleTokenSelect} selectedTokenId={tokenSelectorType === 'from' ? selectedFromToken?.id : selectedToToken?.id} title="Choose token" showBalances={true} />

      {/* Preview Modal */}
      <SwapPreviewModal visible={showPreviewModal} onClose={() => setShowPreviewModal(false)} onConfirm={handleAcceptQuote} fromAmount={formatDisplayAmount(fromAmount)} fromToken={selectedFromToken?.symbol || ''} toAmount={formatDisplayAmount(toAmount)} toToken={selectedToToken?.symbol || ''} rate={`1 ${selectedFromToken?.symbol} = ${(parseFloat(toAmount)/parseFloat(fromAmount)).toFixed(6)} ${selectedToToken?.symbol}`} />

      {/* Success Screen */}
      <SwapSuccessfulScreen visible={showSuccessScreen} fromAmount={formatDisplayAmount(fromAmount)} fromToken={selectedFromToken?.symbol || ''} toToken={selectedToToken?.symbol || ''} onContinue={handleSuccessScreenContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 120, paddingTop: Layout.spacing.xxl },
  tabContainer: { alignItems: 'center', marginBottom: Layout.spacing.lg },
  activeTabText: { fontFamily: Typography.medium, fontSize: 18, color: Colors.text.primary },
  inputContainer: { marginBottom: Layout.spacing.sm },
  inputLabel: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.primary, marginBottom: Layout.spacing.xs },
  inputCard: { backgroundColor: '#F8F9FA', borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 80, width: '100%' },
  inputLeft: { flex: 1, justifyContent: 'center', minWidth: 0 },
  inputRight: { alignItems: 'flex-end', justifyContent: 'center', maxWidth: '50%' },
  amountInput: { fontFamily: Typography.medium, fontSize: 24, color: Colors.text.primary, fontWeight: '600', padding: 0, margin: 0, flexShrink: 1 },
  usdValue: { fontFamily: Typography.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.sm, paddingVertical: Layout.spacing.xs, marginBottom: Layout.spacing.sm },
  tokenIcon: { width: 18, height: 18, resizeMode: 'cover', marginRight: Layout.spacing.sm },
  tokenText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.text.primary, fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.xs },
  balanceText: { fontFamily: Typography.regular, fontSize: 10, color: Colors.text.secondary },
  maxText: { fontFamily: Typography.medium, fontSize: 10, color: Colors.primary, fontWeight: '600' },
  swapIconContainer: { alignItems: 'center', marginVertical: Layout.spacing.md },
  swapIconImage: { width: 48, height: 48, resizeMode: 'contain' },
  swapContainer: { marginTop: Layout.spacing.lg },
  swapActionButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, alignItems: 'center' },
  swapActionButtonDisabled: { backgroundColor: '#E5E7EB' },
  swapActionButtonText: { fontFamily: Typography.medium, fontSize: 16, color: Colors.surface, fontWeight: '600' },
  swapActionButtonTextDisabled: { color: Colors.text.secondary },
});
