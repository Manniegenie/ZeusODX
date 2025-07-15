// app/components/WalletTokensSection.tsx

import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useTokens } from '../../hooks/useTokens';
import { useDashboard } from '../../hooks/useDashboard';

interface WalletToken {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  balance: number;
  usdValue: number;
  formattedBalance: string;
  formattedUsdValue: string;
  hasBalance: boolean;
}

interface WalletTokensSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAssetPress?: (asset: WalletToken) => void; // Make it optional since we handle routing internally
}

export default function WalletTokensSection({ 
  activeTab, 
  onTabChange, 
  onAssetPress 
}: WalletTokensSectionProps) {
  const router = useRouter();
  
  // Get token metadata from useTokens and balances from useDashboard
  const { 
    tokens: allTokens, 
    loading: tokensLoading, 
    error: tokensError 
  } = useTokens();

  const {
    // Token balances
    solBalance,
    usdcBalance,
    usdtBalance,
    avaxBalance,
    bnbBalance,
    maticBalance,
    ngnzBalance,
    loading: dashboardLoading,
    error: dashboardError
  } = useDashboard();

  // Combine loading and error states
  const loading = tokensLoading || dashboardLoading;
  const error = tokensError || dashboardError;

  // Filter tokens to only include wallet tokens and combine with balance data
  const walletTokens: WalletToken[] = useMemo(() => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'AVAX', 'BNB', 'MATIC', 'NGNZ'];
    const balanceMap = {
      SOL: solBalance?.balance || 0,
      USDC: usdcBalance?.balance || 0,
      USDT: usdtBalance?.balance || 0,
      AVAX: avaxBalance?.balance || 0,
      BNB: bnbBalance?.balance || 0,
      MATIC: maticBalance?.balance || 0,
      NGNZ: ngnzBalance?.balance || 0,
    };

    const tokens = allTokens
      .filter(token => targetSymbols.includes(token.symbol))
      .map(token => {
        const balance = balanceMap[token.symbol] || 0;
        const usdValue = balance * (token.currentPrice || 0);
        const hasBalance = balance > 0;
        
        // Format balance display
        let formattedBalance = '';
        if (token.symbol === 'NGNZ') {
          formattedBalance = `₦${balance.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        } else {
          formattedBalance = balance.toFixed(8);
        }
        
        return {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          icon: token.icon,
          balance,
          usdValue,
          hasBalance,
          formattedBalance,
          formattedUsdValue: `$${usdValue.toFixed(2)}`,
        };
      });

    // Sort tokens: those with balances first (by USD value desc), then others alphabetically
    return tokens.sort((a, b) => {
      if (a.hasBalance && !b.hasBalance) return -1;
      if (!a.hasBalance && b.hasBalance) return 1;
      if (a.hasBalance && b.hasBalance) return b.usdValue - a.usdValue;
      return a.name.localeCompare(b.name);
    });
  }, [
    allTokens,
    solBalance, usdcBalance, usdtBalance, 
    avaxBalance, bnbBalance, maticBalance, ngnzBalance
  ]);

  // Get favorite tokens (tokens with balances for wallet)
  const favoriteTokens = useMemo(() => {
    return walletTokens.filter(token => token.hasBalance);
  }, [walletTokens]);

  // Handle token press with manual routing to individual token screens
  const handleTokenPress = (token: WalletToken) => {
    // If custom handler provided, use it
    if (onAssetPress) {
      onAssetPress(token);
      return;
    }

    // Manual routes for each token
    switch (token.symbol) {
      case 'SOL':
        router.push('/wallet-screens/sol-wallet');
        break;
      case 'USDC':
        router.push('/wallet-screens/usdc-wallet');
        break;
      case 'USDT':
        router.push('/wallet-screens/usdt-wallet');
        break;
      case 'AVAX':
        router.push('/wallet-screens/avax-wallet');
        break;
      case 'BNB':
        router.push('/wallet-screens/bnb-wallet');
        break;
      case 'MATIC':
        router.push('/wallet-screens/matic-wallet');
        break;
      case 'NGNZ':
        router.push('/wallet-screens/ngnz-wallet');
        break;
      default:
        console.log(`⚠️ No specific route for ${token.symbol}, redirecting to coming soon`);
        router.push('/user/come-soon');
    }
  };

  const renderToken = ({ item }: { item: WalletToken }) => (
    <TouchableOpacity 
      style={styles.tokenItem} 
      onPress={() => handleTokenPress(item)}
    >
      <View style={styles.tokenLeft}>
        <View style={styles.tokenIcon}>
          <Image source={item.icon} style={styles.tokenIconImage} />
        </View>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenBalance}>
          {item.formattedBalance}
        </Text>
        <Text style={styles.tokenUsdValue}>
          {item.formattedUsdValue}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Get tokens based on active tab
  const displayTokens = useMemo(() => {
    if (activeTab === 'Favorites') {
      return favoriteTokens;
    }
    return walletTokens;
  }, [activeTab, walletTokens, favoriteTokens]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.tokensContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tokens...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.tokensContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load tokens</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tokensContainer}>
      {/* Token Tabs */}
      <View style={styles.tokenTabs}>
        <TouchableOpacity 
          style={[styles.tokenTab, activeTab === 'All tokens' && styles.activeTokenTab]}
          onPress={() => onTabChange('All tokens')}
        >
          <Text style={[styles.tokenTabText, activeTab === 'All tokens' && styles.activeTokenTabText]}>
            All tokens
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tokenTab, activeTab === 'Favorites' && styles.activeTokenTab]}
          onPress={() => onTabChange('Favorites')}
        >
          <Text style={[styles.tokenTabText, activeTab === 'Favorites' && styles.activeTokenTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Token List */}
      <FlatList
        data={displayTokens}
        renderItem={renderToken}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} 
        contentContainerStyle={styles.tokenListContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'Favorites' ? 'No tokens with balance' : 'No tokens available'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tokensContainer: {
    paddingHorizontal: Layout.spacing.lg,
    flex: 1,
  },
  tokenTabs: {
    flexDirection: 'row',
    gap: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  tokenTab: {
    paddingVertical: Layout.spacing.sm,
  },
  activeTokenTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tokenTabText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  activeTokenTabText: {
    color: Colors.primary,
    fontFamily: Typography.medium,
  },
  tokenListContent: {
    paddingBottom: Layout.spacing.xl,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: '#F0EFFF',
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    height: 72,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.lg,
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tokenIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tokenName: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 3,
  },
  tokenSymbol: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  tokenUsdValue: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  errorText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
});