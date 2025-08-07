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
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import BottomTabNavigator from '../../components/BottomNavigator';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import NetworkSelectionModal from '../../components/Network';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useBalance } from '../../hooks/useWallet';

import ngnzIcon from '../../components/icons/NGNZ.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';

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
    await refreshBalances();
  }, [refreshBalances]);

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

  const displayNgnzBalance = formattedNgnzBalance || '0.00';
  const displayUsdBalance = formattedNgnzBalanceUSD || '$0.00';

  const handleNetworkSelect = (network) => {
    if (network.id === 'ngnz') router.push('../deposits/ngnz');
    setShowNetworkModal(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[Colors.primary]} />
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

          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              {loading && !ngnzBalance ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : error ? (
                <Text style={styles.errorText}>Unable to load balance</Text>
              ) : (
                <>
                  <Text style={styles.balanceAmount}>NGNZ {displayNgnzBalance}</Text>
                  <Text style={styles.balanceUsd}>{displayUsdBalance}</Text>
                </>
              )}
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
            <Text style={styles.recentHistoryTitle}>Recent History</Text>
            <View style={styles.emptyState}>
              <Image source={emptyStateIcon} style={styles.emptyStateImage} />
              <Text style={styles.emptyText}>No transaction yet</Text>
            </View>
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
  balanceSection: { padding: 16 },
  balanceCard: { height: 120, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ddd' },
  balanceAmount: { fontSize: 24, fontWeight: '500', color: Colors.primary },
  balanceUsd: { fontSize: 14, color: Colors.primary },
  quickActionsSection: { padding: 16 },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center' },
  actionIconImage: { width: 44, height: 44 },
  actionLabel: { fontSize: 10, color: '#292d32', marginTop: 4 },
  recentHistorySection: { padding: 16 },
  recentHistoryTitle: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 16 },
  emptyStateImage: { width: 160, height: 156 },
  emptyText: { fontSize: 12, color: Colors.text.secondary },
  errorText: { color: Colors.text.secondary },
});

export default NGNZWalletScreen;