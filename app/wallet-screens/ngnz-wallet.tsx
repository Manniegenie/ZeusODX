// app/user/NGNZWalletScreen.tsx - Updated to match SolanaWalletScreen styling
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import BottomTabNavigator from '../../components/BottomNavigator';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import NetworkSelectionModal from '../../components/Network';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useBalance } from '../../hooks/useWallet';
import { useHistory } from '../../hooks/useHistory';

import ngnzIcon from '../../components/icons/NGNZ.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';
import portfolioBg from '../../assets/images/portfolio-bgg.jpg';

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
    { id: 'deposit', title: 'Deposit', iconSrc: depositIcon },
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
      setShowNetworkModal(true);
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
        pathname: '/user/externaltransfer',
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
    if (network.id === 'ngnz') router.push('../deposits/ngnz');
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

  const formatTransactionType = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'SWAP': return 'Swap';
      default: return type || 'Unknown';
    }
  };

  const formatTransactionStatus = (status) => {
    switch (status) {
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return status || 'Unknown';
    }
  };

  const formatAmountForDisplay = (value, symbol) => {
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

  const extractAmountValue = (transaction) => {
    const amountString = transaction.formattedAmount || '0';
    const cleanAmount = amountString.replace(/[+\-₦,\s]/g, '').replace(/[A-Z]/g, '').trim();
    const numericValue = parseFloat(cleanAmount) || 0;
    return numericValue;
  };

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
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>←</Text>
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
              {quickActions.map((action) => (
                <TouchableOpacity key={action.id} style={styles.actionItem} onPress={() => handleQuickAction(action.id)}>
                  <Image source={action.iconSrc} style={styles.actionIconImage} />
                  <Text style={styles.actionLabel}>{action.title}</Text>
                </TouchableOpacity>
              ))}
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
                {transactions.slice(0, 5).map((transaction, index) => {
                  const amountValue = extractAmountValue(transaction);
                  const formattedAmount = formatAmountForDisplay(amountValue, transaction.currency);
                  const prefix = getTransactionPrefix(transaction.type, transaction.formattedAmount);

                  return (
                    <View key={transaction.id || index} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <Text style={styles.transactionType}>
                          {formatTransactionType(transaction.type)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {transaction.formattedDate || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={styles.transactionAmount}>
                          {prefix}{formattedAmount} {transaction.currency}
                        </Text>
                        <View style={[styles.statusContainer, { backgroundColor: getStatusBackgroundColor(transaction.status) }]}>
                          <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                            {formatTransactionStatus(transaction.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 20, color: Colors.text.primary },
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
  actionIconImage: { width: 44, height: 44 },
  actionLabel: { fontSize: 10, color: '#292d32', marginTop: 4 },
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