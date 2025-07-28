import React, { useCallback, useState } from 'react';
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
import { useRouter } from 'expo-router';

import BottomTabNavigator from '../../components/BottomNavigator';
import DashboardModals from '../user/DashboardModals';
import NetworkSelectionModal from '../../components/Network';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useBalance } from '../../hooks/useWallet';

import maticIcon from '../../components/icons/matic-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';

const MaticWalletScreen = ({ onQuickActionPress, onSeeMorePress }) => {
  const router = useRouter();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  
  const {
    maticBalance,
    maticBalanceUSD,
    formattedMaticBalance,
    formattedMaticBalanceUSD,
    loading,
    error,
    refreshBalances
  } = useBalance();

  // MATIC networks - only Ethereum network
  const maticNetworks = [
    {
      id: 'ethereum',
      name: 'Ethereum Network',
    }
  ];

  const onRefresh = useCallback(async () => {
    await refreshBalances();
  }, [refreshBalances]);

  const handleGoBack = () => {
    router.back();
  };

  const quickActions = [
    { id: 'deposit', title: 'Deposit', iconSrc: depositIcon },
    { id: 'transfer', title: 'Transfer', iconSrc: transferIcon },
    { id: 'buy-sell', title: 'Buy/Sell', iconSrc: swapIcon },
  ];

  const displayMatic = formattedMaticBalance || '0.000000';
  const displayUSD = formattedMaticBalanceUSD || '$0.00';

  const handleQuickAction = (actionId) => {
    if (actionId === 'transfer') {
      setShowTransferModal(true);
    } else if (actionId === 'deposit') {
      // Show network selection modal for MATIC deposit
      setShowNetworkModal(true);
    } else if (actionId === 'buy-sell') {
      // Navigate to buy/sell screen placeholder
      router.push('../user/Swap');
    } else {
      onQuickActionPress?.(actionId);
    }
  };

  const handleSeeMore = () => {
    onSeeMorePress?.();
  };

  // Modal handlers
  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
  };

  const handleCloseWalletModal = () => {
    setShowWalletModal(false);
  };

  const handleCloseNetworkModal = () => {
    setShowNetworkModal(false);
  };

  const handleTransferMethodPress = (method) => {
    setShowTransferModal(false);
    // Handle the selected transfer method
    if (method.id === 'zeus') {
      // Navigate to Zeus username transfer screen for MATIC
      router.push('/transfer/zeus?token=matic');
    } else if (method.id === 'external') {
      // Show wallet selection modal
      setShowWalletModal(true);
    }
  };

  const handleWalletOptionPress = (wallet) => {
    setShowWalletModal(false);
    // Handle the selected wallet for MATIC transfers
    router.push(`/transfer/external?wallet=${wallet.id}&token=matic`);
  };

  const handleActionButtonPress = (action) => {
    console.log('MATIC Action button pressed:', action);
  };

  const handleNetworkSelect = (network) => {
    // Route to the Ethereum deposit screen for MATIC
    if (network.id === 'ethereum') {
      router.push('../deposits/matic-eth');
    }
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
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              title="Pull to refresh"
              titleColor={Colors.text.secondary}
              progressBackgroundColor={Colors.surface}
            />
          }
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              {/* Title Group */}
              <View style={styles.headerGroup}>
                <View style={styles.maticIcon}>
                  <Image source={maticIcon} style={styles.maticIconImage} />
                </View>
                <Text style={styles.headerTitle}>Matic</Text>
              </View>

              {/* Placeholder for balance */}
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Balance */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              {loading && !maticBalance ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading balance...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Unable to load balance</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.balanceAmount}>MATIC {displayMatic}</Text>
                  <Text style={styles.balanceUsd}>{displayUSD}</Text>
                </>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => handleQuickAction(action.id)}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <View style={[styles.actionIcon, loading && styles.actionIconDisabled]}>
                    <Image source={action.iconSrc} style={styles.actionIconImage} />
                  </View>
                  <Text style={[styles.actionLabel, loading && styles.actionLabelDisabled]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent History */}
          <View style={styles.recentHistorySection}>
            <View style={styles.recentHistoryHeader}>
              <Text style={styles.recentHistoryTitle}>Recent History</Text>
              <TouchableOpacity onPress={handleSeeMore} activeOpacity={0.7}>
                <Text style={styles.seeMoreLink}>See more</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Image source={emptyStateIcon} style={styles.emptyStateImage} />
              </View>
              <Text style={styles.emptyText}>No transaction yet</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="wallet" />

      {/* Transfer Modal */}
      <DashboardModals
        showTransferModal={showTransferModal}
        showWalletModal={showWalletModal}
        onCloseTransferModal={handleCloseTransferModal}
        onCloseWalletModal={handleCloseWalletModal}
        onTransferMethodPress={handleTransferMethodPress}
        onWalletOptionPress={handleWalletOptionPress}
        onActionButtonPress={handleActionButtonPress}
      />

      {/* Network Selection Modal */}
      <NetworkSelectionModal
        visible={showNetworkModal}
        onClose={handleCloseNetworkModal}
        onNetworkSelect={handleNetworkSelect}
        availableNetworks={maticNetworks}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
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
  backButtonText: {
    fontSize: 20,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  maticIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  maticIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'cover',
  },
  headerTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  balanceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  balanceCard: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  balanceAmount: {
    color: Colors.primary,
    fontFamily: Typography.medium,
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  balanceUsd: {
    color: Colors.primary,
    fontFamily: Typography.regular,
    fontSize: 13.8,
    fontWeight: '400',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  retryText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 12,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionsTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 13.8,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  actionIconDisabled: {
    opacity: 0.5,
  },
  actionIconImage: {
    width: 44,
    height: 44,
    resizeMode: 'cover',
  },
  actionLabel: {
    color: '#292d32',
    fontFamily: Typography.regular,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  actionLabelDisabled: {
    opacity: 0.5,
  },
  recentHistorySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentHistoryTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 13.8,
    fontWeight: '600',
  },
  seeMoreLink: {
    color: Colors.primary,
    fontFamily: Typography.regular,
    fontSize: 12,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyIllustration: {
    width: 169,
    height: 156,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateImage: {
    width: 160,
    height: 156,
    resizeMode: 'contain',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default MaticWalletScreen;