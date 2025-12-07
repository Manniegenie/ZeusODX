import { useMemo } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
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
        <Text style={styles.tokenName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        <Text style={styles.tokenSymbol} numberOfLines={1} ellipsizeMode="tail">{item.symbol}</Text>
      </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenPrice} numberOfLines={1} ellipsizeMode="tail">{item.price}</Text>
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
            numberOfLines={1}
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
    marginTop: -12, // Ensure no margin is adding space
    // OR
    // marginTop: -10, // Use negative to pull it closer if necessary
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
  tokenPrice: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(13, 0.1),
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  changeContainer: {
    paddingHorizontal: moderateScale(6, 0.1),
    paddingVertical: moderateScale(2, 0.1),
    borderRadius: moderateScale(6, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(50, 0.1),
    marginTop: moderateScale(4, 0.1),
  },
  changeText: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(12, 0.1),
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
