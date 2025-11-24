// app/components/WalletTokensSection.tsx

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useTokens } from '../../hooks/useTokens';
import { useBalance } from '../../hooks/useWallet';

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
  
  // Get token metadata from useTokens
  const { 
    tokens: allTokens, 
    loading: tokensLoading, 
    error: tokensError 
  } = useTokens();

  // Get balances from useBalance hook
  const {
    // Raw token balances
    solBalance,
    usdcBalance,
    usdtBalance,
    ethBalance,
    trxBalance,
    bnbBalance,
    maticBalance,
    ngnzBalance,
    btcBalance,
    // Formatted USD values
    formattedSolBalanceUSD,
    formattedUsdcBalanceUSD,
    formattedUsdtBalanceUSD,
    formattedEthBalanceUSD,
    formattedTrxBalanceUSD,
    formattedBnbBalanceUSD,
    formattedMaticBalanceUSD,
    formattedNgnzBalanceUSD,
    formattedBtcBalanceUSD,
    // State
    loading: balanceLoading,
    error: balanceError
  } = useBalance();

  // Combine loading and error states
  const loading = tokensLoading || balanceLoading;
  const error = tokensError || balanceError;

  // Filter tokens to only include wallet tokens and combine with balance data
  const walletTokens: WalletToken[] = useMemo(() => {
    const targetSymbols = ['SOL', 'USDC', 'USDT', 'ETH', 'TRX', 'BNB', 'MATIC', 'NGNZ', 'BTC'];
    
    // Map of raw balances
    const balanceMap = {
      SOL: solBalance || 0,
      USDC: usdcBalance || 0,
      USDT: usdtBalance || 0,
      ETH: ethBalance || 0,
      TRX: trxBalance || 0,
      BNB: bnbBalance || 0,
      MATIC: maticBalance || 0,
      NGNZ: ngnzBalance || 0,
      BTC: btcBalance || 0,
    };

    // Map of formatted USD values
    const usdValueMap = {
      SOL: formattedSolBalanceUSD || '$0.00',
      USDC: formattedUsdcBalanceUSD || '$0.00',
      USDT: formattedUsdtBalanceUSD || '$0.00',
      ETH: formattedEthBalanceUSD || '$0.00',
      TRX: formattedTrxBalanceUSD || '$0.00',
      BNB: formattedBnbBalanceUSD || '$0.00',
      MATIC: formattedMaticBalanceUSD || '$0.00',
      NGNZ: formattedNgnzBalanceUSD || '$0.00',
      BTC: formattedBtcBalanceUSD || '$0.00',
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
        } else if (token.symbol === 'BTC' || token.symbol === 'ETH') {
          // Format BTC and ETH with appropriate decimal places
          formattedBalance = balance.toFixed(8);
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
          formattedUsdValue: usdValueMap[token.symbol],
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
    solBalance, usdcBalance, usdtBalance, ethBalance,
    trxBalance, bnbBalance, maticBalance, ngnzBalance, btcBalance,
    formattedSolBalanceUSD, formattedUsdcBalanceUSD, formattedUsdtBalanceUSD, formattedEthBalanceUSD,
    formattedTrxBalanceUSD, formattedBnbBalanceUSD, formattedMaticBalanceUSD,
    formattedNgnzBalanceUSD, formattedBtcBalanceUSD
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
      case 'ETH':
        router.push('/wallet-screens/eth-wallet');
        break;
      case 'TRX':
        router.push('/wallet-screens/trx-wallet');
        break;
      case 'BNB':
        router.push('/wallet-screens/bnb-wallet');
        break;
      case 'MATIC':
        router.push('/wallet-screens/matic-wallet');
        break;
      case 'BTC':
        router.push('/wallet-screens/btc-wallet');
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
          <Text style={styles.tokenName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
          <Text style={styles.tokenSymbol} numberOfLines={1} ellipsizeMode="tail">{item.symbol}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenBalance} numberOfLines={1} ellipsizeMode="tail">
          {item.formattedBalance}
        </Text>
        <Text style={styles.tokenUsdValue} numberOfLines={1} ellipsizeMode="tail">
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
    fontSize: moderateScale(14, 0.1),
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
    minHeight: moderateScale(72, 0.1),
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.lg,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  tokenIcon: {
    width: moderateScale(40, 0.1),
    height: moderateScale(40, 0.1),
    borderRadius: moderateScale(20, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  tokenIconImage: {
    width: moderateScale(40, 0.1),
    height: moderateScale(40, 0.1),
    resizeMode: 'cover',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  tokenName: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(14, 0.1),
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: moderateScale(3, 0.1),
  },
  tokenSymbol: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(12, 0.1),
    color: Colors.text.secondary,
  },
  tokenRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: Layout.spacing.md,
    minWidth: moderateScale(100, 0.1),
  },
  tokenBalance: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(13, 0.1),
    color: Colors.text.primary,
    marginBottom: moderateScale(4, 0.1),
    fontWeight: '600',
    textAlign: 'right',
  },
  tokenUsdValue: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(12, 0.1),
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(14, 0.1),
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
    fontSize: moderateScale(14, 0.1),
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
    fontSize: moderateScale(14, 0.1),
    color: Colors.text.secondary,
  },
});