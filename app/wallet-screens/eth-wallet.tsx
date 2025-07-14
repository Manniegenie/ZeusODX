import React, { useCallback } from 'react';
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
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useBalance } from '../../hooks/useWallet';

import ethIcon from '../../components/icons/eth-icon.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';

interface QuickAction {
  id: string;
  title: string;
  iconSrc: any;
}

interface EthereumWalletScreenProps {
  onQuickActionPress?: (actionId: string) => void;
  onSeeMorePress?: () => void;
}

const EthereumWalletScreen: React.FC<EthereumWalletScreenProps> = ({
  onQuickActionPress,
  onSeeMorePress
}) => {
  const { 
    ethBalance,
    ethBalanceUSD,
    formattedEthBalance,
    formattedEthBalanceUSD,
    loading,
    error,
    refreshBalances
  } = useBalance();

  const quickActions: QuickAction[] = [
    { id: 'deposit', title: 'Deposit', iconSrc: depositIcon },
    { id: 'transfer', title: 'Transfer', iconSrc: transferIcon },
    { id: 'buy-sell', title: 'Buy/Sell', iconSrc: swapIcon },
  ];

  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing ETH wallet data...');
      await refreshBalances();
      console.log('✅ ETH wallet refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing ETH wallet:', error);
    }
  }, [refreshBalances]);

  const handleQuickAction = (actionId: string): void => {
    console.log(`ETH Quick action pressed: ${actionId}`);
    onQuickActionPress?.(actionId);
  };

  const handleSeeMore = (): void => {
    console.log('ETH See more pressed');
    onSeeMorePress?.();
  };

  const displayEthBalance = formattedEthBalance || '0.000000';
  const displayUsdBalance = formattedEthBalanceUSD || '$0.00';

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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerGroup}>
              <View style={styles.ethereumIcon}>
                <Image source={ethIcon} style={styles.ethereumIconImage} />
              </View>
              <Text style={styles.headerTitle}>Ethereum</Text>
            </View>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              {loading && !ethBalance ? (
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
                  <Text style={styles.balanceAmount}>ETH {displayEthBalance}</Text>
                  <Text style={styles.balanceUsd}>{displayUsdBalance}</Text>
                </>
              )}
            </View>
          </View>

          {/* Quick Actions Section */}
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

          {/* Recent History Section */}
          <View style={styles.recentHistorySection}>
            <View style={styles.recentHistoryHeader}>
              <Text style={styles.recentHistoryTitle}>Recent History</Text>
              <TouchableOpacity onPress={handleSeeMore} activeOpacity={0.7}>
                <Text style={styles.seeMoreLink}>See more</Text>
              </TouchableOpacity>
            </View>

            {/* Empty State */}
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
    paddingTop: 12, // Reduced from 20
    paddingBottom: 6, // Reduced from 10
  },
  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ethereumIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ethereumIconImage: {
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
    paddingVertical: 12, // Reduced from 20
  },
  balanceCard: {
    height: 120, // Reduced from 151
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
    paddingVertical: 12, // Reduced from 20
  },
  quickActionsTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 13.8,
    fontWeight: '600',
    marginBottom: 8, // Reduced from 16
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4, // Reduced from 10
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
    marginBottom: 4, // Reduced from 8
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
    paddingVertical: 12, // Reduced from 20
  },
  recentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 20
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
    paddingVertical: 24, // Reduced from 40
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

export default EthereumWalletScreen;