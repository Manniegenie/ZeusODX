// app/wallet-screens/bnb-wallet.tsx

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
import NetworkSelectionModal from '../../components/Network';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useBalance } from '../../hooks/useWallet';

import bnbIcon from '../../components/icons/bnb-icon.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';

const BnbWalletScreen = ({ onQuickActionPress, onSeeMorePress }) => {
  const router = useRouter();
  const { openNetworkModal } = useLocalSearchParams();

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);

  const {
    bnbBalance,
    bnbBalanceUSD,
    formattedBnbBalance,
    formattedBnbBalanceUSD,
    loading,
    error,
    refreshBalances
  } = useBalance();

  useEffect(() => {
    if (openNetworkModal === 'true') {
      setShowNetworkModal(true);
    }
  }, [openNetworkModal]);

  const handleGoBack = () => router.back();

  const onRefresh = useCallback(async () => {
    await refreshBalances();
  }, [refreshBalances]);

  const handleNetworkSelect = (network) => {
    if (network.id === 'ethereum') {
      router.push('../deposits/bnb-eth');
    } else if (network.id === 'bsc') {
      router.push('../deposits/bnb-bsc');
    }
    setShowNetworkModal(false);
  };

  const handleQuickAction = (actionId) => {
    if (actionId === 'deposit') {
      setShowNetworkModal(true);
    } else if (actionId === 'transfer') {
      setShowTransferMethodModal(true);
    } else if (actionId === 'buy-sell') {
      router.push({ pathname: '../user/Swap', params: { defaultToken: 'BNB' } });
    } else {
      onQuickActionPress?.(actionId);
    }
  };

  const handleTransferMethodSelect = (method: TransferMethod) => {
    const tokenParams = {
      tokenId: 'bnb',
      tokenName: 'BNB',
      tokenSymbol: 'bnb',
      transferMethod: method.id
    };

    if (method.id === 'zeus') {
      router.push({ pathname: '/user/usernametransfer', params: tokenParams });
    } else if (method.id === 'external') {
      router.push({ pathname: '/user/externaltransfer', params: tokenParams });
    }

    setShowTransferMethodModal(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <View style={styles.headerGroup}>
                <View style={styles.iconWrapper}>
                  <Image source={bnbIcon} style={styles.iconImage} />
                </View>
                <Text style={styles.headerTitle}>BNB</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Balance */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              {loading && !bnbBalance ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : error ? (
                <Text style={styles.errorText}>Unable to load balance</Text>
              ) : (
                <>
                  <Text style={styles.balanceAmount}>BNB {formattedBnbBalance || '0.00000000'}</Text>
                  <Text style={styles.balanceUsd}>{formattedBnbBalanceUSD || '$0.00'}</Text>
                </>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {[
                { id: 'deposit', title: 'Deposit', iconSrc: depositIcon },
                { id: 'transfer', title: 'Transfer', iconSrc: transferIcon },
                { id: 'buy-sell', title: 'Buy/Sell', iconSrc: swapIcon },
              ].map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => handleQuickAction(action.id)}
                  disabled={loading}
                >
                  <Image source={action.iconSrc} style={styles.actionIconImage} />
                  <Text style={styles.actionLabel}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* History */}
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

      {/* Network Modal */}
      <NetworkSelectionModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onNetworkSelect={handleNetworkSelect}
        availableNetworks={[
          { id: 'ethereum', name: 'Ethereum Network (ERC20)' },
          { id: 'bsc', name: 'BSC (Binance Smart Chain)' }
        ]}
      />

      {/* Transfer Method Modal */}
      <TransferMethodModal
        visible={showTransferMethodModal}
        onClose={() => setShowTransferMethodModal(false)}
        onSelectMethod={handleTransferMethodSelect}
        title="Send BNB"
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  headerGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 },
  headerRight: { width: 40 },
  iconWrapper: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  iconImage: { width: 28, height: 28, resizeMode: 'cover' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  balanceSection: { paddingHorizontal: 16, paddingVertical: 12 },
  balanceCard: { height: 120, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  balanceAmount: { fontSize: 24, fontWeight: '500', color: Colors.primary },
  balanceUsd: { fontSize: 14, color: Colors.primary },
  quickActionsSection: { paddingHorizontal: 16, paddingVertical: 12 },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIconImage: { width: 44, height: 44, resizeMode: 'cover' },
  actionLabel: { fontSize: 10, color: '#292d32', marginTop: 4 },
  recentHistorySection: { padding: 16 },
  recentHistoryTitle: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 16 },
  emptyStateImage: { width: 160, height: 156 },
  emptyText: { fontSize: 12, color: Colors.text.secondary },
  errorText: { color: Colors.text.secondary },
});

export default BnbWalletScreen;
