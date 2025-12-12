// app/user/NGNZWalletScreen.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import BottomTabNavigator from '../../components/BottomNavigator';
import NetworkSelectionModal from '../../components/Network';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useHistory } from '../../hooks/useHistory';
import { useBalance } from '../../hooks/useWallet';

import portfolioBg from '../../assets/images/portfolio-bgg.jpg';
import backIcon from '../../components/icons/backy.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';
import ngnzIcon from '../../components/icons/NGNZ.png';
import swapIcon from '../../components/icons/swap-icon.png';
import transferIcon from '../../components/icons/transfer-icon.png';

type TokenDetails = {
  transactionId?: string;
  currency?: string;
  network?: string;
  address?: string;
  hash?: string;
  fee?: number | string;
  narration?: string;
  createdAt?: string;
  category?: 'token';
};

type UtilityDetails = {
  orderId?: string;
  requestId?: string;
  productName?: string;
  quantity?: number | string;
  network?: string;
  customerInfo?: string;
  billType?: string;
  paymentCurrency?: string;
  category?: 'utility';
};

type APIDetail =
  | TokenDetails
  | UtilityDetails
  | (Record<string, any> & { category?: 'token' | 'utility' });

type APITransaction = {
  id: string;
  type: string;      // "Deposit" | "Withdrawal" | "Swap" | bill label
  status: string;    // "Successful" | "Failed" | "Pending"
  amount: string;    // "+₦10,000" | "-0.1 BTC"
  date: string;      // human-readable
  createdAt?: string;
  details?: APIDetail;
};

const NGNZWalletScreen = ({ onQuickActionPress, onSeeMorePress }) => {
  const router = useRouter();
  const { openNetworkModal } = useLocalSearchParams();

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);

  const {
    ngnzBalance,
    ngnzBalanceUSD,
    formattedNgnzBalance,
    formattedNgnzBalanceUSD,
    loading,
    error,
    refreshBalances
  } = useBalance();

  const {
    transactions,
    loading: transactionsLoading,
    hasTransactions,
    refreshTransactions
  } = useHistory('NGNZ', { defaultPageSize: 5 });

  useEffect(() => {
    if (openNetworkModal === 'true') {
      setShowNetworkModal(true);
    }
  }, [openNetworkModal]);

  const quickActions = [
    { id: 'deposit', title: 'Deposit', iconSrc: depositIcon, disabled: true },
    { id: 'transfer', title: 'Transfer', iconSrc: transferIcon },
    { id: 'buy-sell', title: 'Buy/Sell', iconSrc: swapIcon },
  ];

  const ngnzNetworks = [{ id: 'ngnz', name: 'NGNZ Network' }];

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshBalances(), refreshTransactions()]);
  }, [refreshBalances, refreshTransactions]);

  const handleGoBack = () => router.back();

  const handleQuickAction = (actionId) => {
    if (actionId === 'deposit') {
      // Deposit disabled for NGNZ
      return;
    } else if (actionId === 'transfer') {
      setShowTransferMethodModal(true);
    } else if (actionId === 'buy-sell') {
      router.push({ pathname: '../user/Swap', params: { defaultToken: 'NGNZ' } });
    } else {
      onQuickActionPress?.(actionId);
    }
  };

  const handleCloseNetworkModal = () => setShowNetworkModal(false);
  const handleCloseTransferMethodModal = () => setShowTransferMethodModal(false);

  const handleTransferMethodSelect = (method: TransferMethod) => {
    const token = {
      id: 'ngnz',
      name: 'Zeus Naira',
      symbol: 'NGNZ'
    };

    if (method.id === 'zeus') {
      router.push({
        pathname: '/user/usernametransfer',
        params: {
          tokenId: token.id,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          transferMethod: 'zeus'
        }
      });
    } else if (method.id === 'external') {
      router.push({
        pathname: '/user/FiatTransfer',
        params: {
          tokenId: token.id,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          transferMethod: 'external'
        }
      });
    }

    setShowTransferMethodModal(false);
  };

  const handleNetworkSelect = (network) => {
    setShowNetworkModal(false);
  };

  const handleViewAllTransactions = () => {
    router.push({
      pathname: '/user/transactionhistory',
      params: {
        currency: 'NGNZ',
        tokenName: 'Zeus Naira',
        tokenSymbol: 'NGNZ'
      }
    });
  };

  // ===== Helpers for receipt navigation (match TransactionHistoryScreen) =====
  const mapServiceTypeToUI = (t: string) => {
    switch (t) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'SWAP': return 'Swap';
      case 'BILL_PAYMENT': return 'Bill Payment';
      default: return t || 'Unknown';
    }
  };

  const mapServiceStatusToUI = (s: string) => {
    switch (s) {
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return s || 'Unknown';
    }
  };

  const getTransactionPrefix = (type, formattedAmount) => {
    if (type === 'DEPOSIT') return '+';
    if (type === 'WITHDRAWAL') return '-';
    if (type === 'SWAP') {
      if (formattedAmount && formattedAmount.startsWith('+-')) return '-';
      if (formattedAmount && formattedAmount.startsWith('+')) return '+';
      if (formattedAmount && formattedAmount.startsWith('-')) return '-';
      return '';
    }
    return '';
  };

  const getStatusColor = (status) => {
    if (status === 'SUCCESSFUL') return '#10B981';
    if (status === 'FAILED') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBackgroundColor = (status) => {
    if (status === 'SUCCESSFUL') return '#E8F5E8';
    if (status === 'FAILED') return '#FFE8E8';
    return '#FFF3E0';
  };

  const formatTransactionType = (type) => mapServiceTypeToUI(type);

  const formatTransactionStatus = (status) => mapServiceStatusToUI(status);

  const formatAmountForDisplay = (value, symbol) => {
    if (!symbol) return value.toString();
    switch (String(symbol).toUpperCase()) {
      case 'NGN':
      case 'NGNZ':
      case 'NGNB':
        return value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'BTC':  return Number(value.toFixed(8)).toString();
      case 'ETH':  return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC': return value.toFixed(2);
      default:
        if (value >= 1000) return value.toFixed(2);
        if (value >= 1) return Number(value.toFixed(4)).toString();
        if (value >= 0.01) return Number(value.toFixed(4)).toString();
        if (value >= 0.001) return Number(value.toFixed(6)).toString();
        return Number(value.toPrecision(3)).toString();
    }
  };

  const extractAmountValue = (tx: any) => {
    if (tx?.formattedAmount) {
      const clean = tx.formattedAmount.replace(/[+\-₦,\s]/g, '').replace(/[A-Z]/g, '').trim();
      const n = parseFloat(clean);
      if (!isNaN(n)) return n;
    }
    const candidates = [tx?.amount, tx?.amountNaira, tx?.amountNGNB, tx?.amountNGNZ];
    for (const c of candidates) {
      if (typeof c === 'number' && !isNaN(c)) return c;
      if (typeof c === 'string') {
        const n = parseFloat(c);
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  const displayBillType = (tx: any): string | undefined => {
    const d = tx?.details || {};
    const raw =
      tx?.billType ||
      tx?.utilityType ||
      d.billCategory ||
      d.billType ||
      d.productName ||
      tx?.category ||
      '';
    if (!raw) return undefined;
    const v = String(raw).toLowerCase();
    if (v.includes('airtime')) return 'Airtime';
    if (v.includes('data')) return 'Data';
    if (v.includes('cable') || v.includes('tv') || v.includes('dstv') || v.includes('gotv') || v.includes('startimes')) return 'Cable';
    if (v.includes('electric')) return 'Electricity';
    return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
  };

  // Build the object TransactionReceipt expects (same as in TransactionHistoryScreen)
  const toAPITransaction = useCallback((tx: any): APITransaction => {
    const serviceType = String(tx?.type || '');
    const serviceStatus = String(tx?.status || '');
    const amountNum = extractAmountValue(tx);
    const symbol = tx?.currency || tx?.symbol || tx?.asset || 'NGN';
    const prettyAmt = formatAmountForDisplay(amountNum, symbol);
    const sign = getTransactionPrefix(serviceType, tx?.formattedAmount);

    const isNaira = ['NGN','NGNB','NGNZ'].includes(String(symbol).toUpperCase());
    const amountStr = isNaira ? `${sign}₦${prettyAmt}` : `${sign}${prettyAmt} ${symbol}`;
    const dateText = tx?.formattedDate || (tx?.createdAt ? new Date(tx.createdAt).toLocaleString('en-NG') : '—');

    let details: APIDetail = {};
    let uiType = mapServiceTypeToUI(serviceType);

    if (serviceType === 'BILL_PAYMENT') {
      const d = tx?.details || {};
      uiType = displayBillType(tx) || 'Bill Payment';
      details = {
        category: 'utility',
        orderId: d.orderId || d.order_id || tx?.orderId,
        requestId: d.requestId || d.request_id || tx?.requestId,
        productName: d.productName || d.product || tx?.productName,
        quantity: d.quantity || d.units || tx?.quantity,
        network: d.network || d.provider || tx?.network || tx?.provider,
        customerInfo: d.customerInfo || d.customerPhone || d.phone || d.meterNo || d.account,
        billType: d.billType || d.type || displayBillType(tx),
        paymentCurrency: d.paymentCurrency || tx?.paymentCurrency || symbol,
      } as UtilityDetails;
    } else {
      const d = tx?.details || {};
      details = {
        category: 'token',
        transactionId: d.transactionId || tx?.transactionId || tx?.txId || tx?.externalId || tx?.reference || tx?.id || tx?._id,
        currency: symbol,
        network: d.network || tx?.network || tx?.chain || tx?.blockchain,
        address: d.address || tx?.address || tx?.walletAddress || tx?.to || tx?.toAddress || tx?.receivingAddress,
        hash: d.hash || tx?.hash || tx?.txHash || tx?.transactionHash,
        fee: d.fee || tx?.fee || tx?.networkFee || tx?.gasFee || tx?.txFee,
        narration: d.narration || tx?.narration || tx?.note || tx?.description || tx?.memo || tx?.reason,
      } as TokenDetails;
      if (serviceType === 'SWAP') uiType = 'Swap';
    }

    return {
      id: (tx?.id || tx?._id || tx?.transactionId || tx?.reference || tx?.externalId || '') + '',
      type: uiType,
      status: mapServiceStatusToUI(serviceStatus),
      amount: amountStr,
      date: dateText,
      createdAt: tx?.createdAt,
      details,
    };
  }, []);

  const displayNgnzBalance = formattedNgnzBalance || '0.00';
  const displayUsdBalance = formattedNgnzBalanceUSD || '$0.00';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading || transactionsLoading}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>
              <View style={styles.headerGroup}>
                <Image source={ngnzIcon} style={styles.iconImage} />
                <Text style={styles.headerTitle}>Zeus Naira</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Updated Balance Section with Portfolio Style */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <ImageBackground
                source={portfolioBg}
                style={styles.balanceBackground}
                imageStyle={styles.balanceBackgroundImage}
              >
                <View style={styles.balanceContent}>
                  {loading && !ngnzBalance ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : error ? (
                    <Text style={styles.errorText}>Unable to load balance</Text>
                  ) : (
                    <>
                      <Text style={styles.balanceLabel}></Text>
                      <Text style={styles.balanceAmount}>NGNZ {displayNgnzBalance}</Text>
                      <Text style={styles.balanceUsd}>{displayUsdBalance}</Text>
                    </>
                  )}
                </View>
              </ImageBackground>
            </View>
          </View>

          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action) => {
                const isDisabled = action.disabled;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.actionItem, isDisabled && styles.actionItemDisabled]}
                    onPress={() => handleQuickAction(action.id)}
                    disabled={isDisabled}
                    activeOpacity={isDisabled ? 1 : 0.7}
                  >
                    <Image
                      source={action.iconSrc}
                      style={[styles.actionIconImage, isDisabled && styles.actionIconImageDisabled]}
                    />
                    <Text style={[styles.actionLabel, isDisabled && styles.actionLabelDisabled]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.recentHistorySection}>
            <View style={styles.recentHistoryHeader}>
              <Text style={styles.recentHistoryTitle}>Recent History</Text>
              <TouchableOpacity onPress={handleViewAllTransactions}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {!hasTransactions && !transactionsLoading ? (
              <View style={styles.emptyState}>
                <Image source={emptyStateIcon} style={styles.emptyStateImage} />
                <Text style={styles.emptyText}>No transaction yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((tx, index) => {
                  const amountValue = extractAmountValue(tx);
                  const symbol = tx?.currency || tx?.symbol || tx?.asset || 'NGNZ';
                  const formattedAmount = formatAmountForDisplay(amountValue, symbol);
                  const prefix = getTransactionPrefix(tx.type, tx.formattedAmount);

                  return (
                    <TouchableOpacity
                      key={(tx.id ?? index) as React.Key}
                      style={styles.transactionItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        // EXACTLY like TransactionHistoryScreen
                        const apiTx = toAPITransaction(tx);
                        router.push({
                          pathname: '/history/TransactionReceipt',
                          params: {
                            tx: encodeURIComponent(JSON.stringify(apiTx)),
                            raw: encodeURIComponent(JSON.stringify(tx)),
                          },
                        });
                      }}
                    >
                      <View style={styles.transactionLeft}>
                        <Text style={styles.transactionType}>
                          {formatTransactionType(tx.type)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {tx.formattedDate || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={styles.transactionAmount}>
                          {prefix}{formattedAmount} {symbol}
                        </Text>
                        <View style={[styles.statusContainer, { backgroundColor: getStatusBackgroundColor(tx.status) }]}>
                          <Text style={[styles.transactionStatus, { color: getStatusColor(tx.status) }]}>
                            {formatTransactionStatus(tx.status)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="wallet" />

      <TransferMethodModal
        visible={showTransferMethodModal}
        onClose={handleCloseTransferMethodModal}
        onSelectMethod={handleTransferMethodSelect}
        title="Send NGNZ"
      />

      <NetworkSelectionModal
        visible={showNetworkModal}
        onClose={handleCloseNetworkModal}
        onNetworkSelect={handleNetworkSelect}
        availableNetworks={ngnzNetworks}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  headerGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' },
  iconImage: { width: 28, height: 28, resizeMode: 'cover' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  headerRight: { width: 40 },
  
  // Updated Balance Section Styles (Portfolio Style)
  balanceSection: { 
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  balanceCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  balanceBackground: { 
    height: 120, 
    justifyContent: 'center', 
    backgroundColor: '#4A3FAD' 
  },
  balanceBackgroundImage: { 
    borderRadius: 12 
  },
  balanceContent: { 
    padding: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%' 
  },
  balanceLabel: { 
    fontFamily: Typography.regular, 
    fontSize: 14, 
    color: Colors.surface, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  balanceAmount: { 
    fontFamily: Typography.medium, 
    fontSize: 24, 
    color: Colors.surface, 
    fontWeight: '500', 
    textAlign: 'center',
    marginBottom: 4
  },
  balanceUsd: { 
    fontFamily: Typography.regular,
    fontSize: 14, 
    color: Colors.surface,
    textAlign: 'center'
  },
  errorText: { 
    color: Colors.surface,
    fontSize: 14,
    textAlign: 'center'
  },
  
  quickActionsSection: { 
    paddingHorizontal: 16, 
    paddingVertical: 16 
  },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center' },
  actionItemDisabled: { opacity: 0.5 },
  actionIconImage: { width: 44, height: 44 },
  actionIconImageDisabled: { tintColor: '#A0A0A0' },
  actionLabel: { fontSize: 12, color: '#292d32', marginTop: 4 },
  actionLabelDisabled: { color: '#A0A0A0' },
  recentHistorySection: { 
    paddingHorizontal: Layout.spacing.lg, 
    paddingBottom: Layout.spacing.xl 
  },
  recentHistoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.lg },
  recentHistoryTitle: { 
    fontFamily: Typography.medium,
    fontSize: 14, 
    fontWeight: '600',
    color: Colors.text.primary
  },
  viewAllText: { 
    fontFamily: Typography.medium,
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#35297F' 
  },
  emptyState: { alignItems: 'center', marginTop: 16 },
  emptyStateImage: { width: 160, height: 156 },
  emptyText: { fontSize: 12, color: Colors.text.secondary },
  transactionsList: { 
    flex: 1
  },
  
  // Updated transaction item styles to match TokensSection formatting
  transactionItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: '#F0EFFF',
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    minHeight: 64,
  },
  transactionLeft: { 
    flex: 1,
    justifyContent: 'center'
  },
  transactionType: { 
    fontFamily: Typography.medium,
    fontSize: 14, 
    color: Colors.text.primary, 
    fontWeight: '600',
    marginBottom: 3 
  },
  transactionDate: { 
    fontFamily: Typography.regular,
    fontSize: 12, 
    color: Colors.text.secondary 
  },
  transactionRight: { 
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  transactionAmount: { 
    fontFamily: Typography.medium,
    fontSize: 13, 
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4
  },
  statusContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  transactionStatus: { 
    fontFamily: Typography.medium,
    fontSize: 12, 
    fontWeight: '600' 
  },
});

export default NGNZWalletScreen;