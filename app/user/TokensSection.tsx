import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useTokens } from '../../hooks/useTokens';

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

interface TokensSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAssetPress: (asset: Token) => void;
}

export default function TokensSection({
  activeTab,
  onTabChange,
  onAssetPress,
}: TokensSectionProps) {
  const {
    tokens: allTokens,
    favoriteTokens,
    loading,
    error,
  } = useTokens();

  // Debug logging
  console.log('🔍 TokensSection Debug - useTokens Data:', {
    allTokensCount: allTokens.length,
    favoritesCount: favoriteTokens.length,
    loading,
    error,
    tokenSymbols: allTokens.map(t => t.symbol),
    hasNGNZ: allTokens.some(t => t.symbol === 'NGNZ'),
  });

  // Transform useTokens data to match the component's expected Token interface
  const transformedTokens: Token[] = useMemo(() => {
    return allTokens.map(token => {
      const priceDisplay =
        token.symbol === 'NGNZ' ? token.formattedPrice.naira : token.formattedPrice.usd;

      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        price: priceDisplay,
        change: token.changeFormatted,
        changePercent: `${Math.abs(token.change24h).toFixed(2)}%`,
        isPositive: token.isPositive,
      };
    });
  }, [allTokens]);

  // Transform favorites for consistency
  const transformedFavorites: Token[] = useMemo(() => {
    return favoriteTokens.map(token => {
      const priceDisplay =
        token.symbol === 'NGNZ' ? token.formattedPrice.naira : token.formattedPrice.usd;

      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        price: priceDisplay,
        change: token.changeFormatted,
        changePercent: `${Math.abs(token.change24h).toFixed(2)}%`,
        isPositive: token.isPositive,
      };
    });
  }, [favoriteTokens]);

  // Get token icon from useTokens data
  const getTokenIcon = (symbol: string) => {
    const token = allTokens.find(t => t.symbol === symbol);
    return token?.icon;
  };

  const renderToken = ({ item }: { item: Token }) => (
    <TouchableOpacity style={styles.tokenItem} onPress={() => onAssetPress(item)}>
      <View style={styles.tokenLeft}>
        <View style={styles.tokenIcon}>
          <Image source={getTokenIcon(item.symbol)} style={styles.tokenIconImage} />
        </View>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenPrice}>{item.price}</Text>
        <View
          style={[
            styles.changeContainer,
            { backgroundColor: item.isPositive ? '#E8F5E8' : '#FFE8E8' },
          ]}
        >
          <Text
            style={[
              styles.changeText,
              { color: item.isPositive ? '#4CAF50' : '#F44336' },
            ]}
          >
            {item.change}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Get tokens based on active tab
  const displayTokens = useMemo(() => {
    return activeTab === 'Favorites' ? transformedFavorites : transformedTokens;
  }, [activeTab, transformedTokens, transformedFavorites]);

  // Debug filtered tokens
  console.log('🔍 Display Tokens Debug:', {
    activeTab,
    displayCount: displayTokens.length,
    displayIds: displayTokens.map(t => t.id),
    hasNGNZ: displayTokens.some(t => t.id === 'ngnz'),
  });

  // Loading
  if (loading) {
    return (
      <View style={styles.tokensContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tokens...</Text>
        </View>
      </View>
    );
    }

  // Error
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
          <Text
            style={[
              styles.tokenTabText,
              activeTab === 'All tokens' && styles.activeTokenTabText,
            ]}
          >
            All tokens
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tokenTab, activeTab === 'Favorites' && styles.activeTokenTab]}
          onPress={() => onTabChange('Favorites')}
        >
          <Text
            style={[
              styles.tokenTabText,
              activeTab === 'Favorites' && styles.activeTokenTabText,
            ]}
          >
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
              {activeTab === 'Favorites' ? 'No favorite tokens' : 'No tokens available'}
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
    position: 'relative',
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
  tokenPrice: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  changeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  changeText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
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
