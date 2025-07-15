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
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useBalance } from '../../hooks/useWallet';

import solIcon from '../../components/icons/sol-icon.png';
import depositIcon from '../../components/icons/deposit-icon.png';
import transferIcon from '../../components/icons/transfer-icon.png';
import swapIcon from '../../components/icons/swap-icon.png';
import emptyStateIcon from '../../components/icons/empty-state.png';

const SolanaWalletScreen = ({ onQuickActionPress, onSeeMorePress }) => {
  const router = useRouter();
  const {
    solBalance,
    solBalanceUSD,
    formattedSolBalance,
    formattedSolBalanceUSD,
    loading,
    error,
    refreshBalances
  } = useBalance();

  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing SOL wallet...');
      await refreshBalances();
      console.log('✅ Refresh done');
    } catch (err) {
      console.error('❌ Refresh failed:', err);
    }
  }, [refreshBalances]);

  const handleGoBack = () => {
    router.back();
  };

  const quickActions = [
    { id: 'deposit', title: 'Deposit', iconSrc: depositIcon },
    { id: 'transfer', title: 'Transfer', iconSrc: transferIcon },
    { id: 'buy-sell', title: 'Buy/Sell', iconSrc: swapIcon },
  ];

  const displaySOL = formattedSolBalance || '0.000000';
  const displayUSD = formattedSolBalanceUSD || '$0.00';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView
          style={styles.scrollView}
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
                <Image source={solIcon} style={styles.iconImage} />
                <Text style={styles.headerTitle}>Solana</Text>
              </View>

              {/* Placeholder for balance */}
              <View style={styles.headerRight} />
            </View>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              {loading && !solBalance ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading balance...</Text>
                </View>
              ) : error ? (
                <View style={styles.centered}>
                  <Text style={styles.errorText}>Unable to load balance</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.balanceAmount}>SOL {displaySOL}</Text>
                  <Text style={styles.balanceUsd}>{displayUSD}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {quickActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => onQuickActionPress?.(action.id)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, loading && { opacity: 0.5 }]}>
                    <Image source={action.iconSrc} style={styles.actionIconImage} />
                  </View>
                  <Text style={[styles.actionLabel, loading && { opacity: 0.5 }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.recentHistorySection}>
            <View style={styles.recentHistoryHeader}>
              <Text style={styles.recentHistoryTitle}>Recent History</Text>
              <TouchableOpacity onPress={onSeeMorePress} activeOpacity={0.7}>
                <Text style={styles.seeMoreLink}>See more</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyState}>
              <Image source={emptyStateIcon} style={styles.emptyStateImage} />
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
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  headerSection: { padding: 16, paddingTop: 20 },
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
  iconImage: { width: 28, height: 28, borderRadius: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, fontFamily: Typography.medium },

  balanceSection: { padding: 16 },
  balanceCard: { alignItems: 'center', padding: 24, borderRadius: 8 },
  balanceAmount: { fontSize: 24, fontWeight: '500', color: Colors.primary },
  balanceUsd: { fontSize: 14, color: Colors.primary },

  centered: { alignItems: 'center' },
  loadingText: { marginTop: 8, color: Colors.text.secondary },
  errorText: { color: Colors.text.secondary, marginBottom: 8 },
  retryButton: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryText: { color: Colors.surface },

  quickActionsSection: { padding: 16 },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  actionItem: { alignItems: 'center' },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2
  },
  actionIconImage: { width: 44, height: 44, resizeMode: 'cover' },
  actionLabel: { fontSize: 10, color: '#292d32', fontFamily: Typography.regular },

  recentHistorySection: { padding: 16 },
  recentHistoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  recentHistoryTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  seeMoreLink: { color: Colors.primary, fontSize: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateImage: { width: 160, height: 156, resizeMode: 'contain', marginBottom: 12 },
  emptyText: { fontSize: 11, color: Colors.text.secondary }
});

export default SolanaWalletScreen;