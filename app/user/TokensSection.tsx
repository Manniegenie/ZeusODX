import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Image
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';

// Crypto Asset Icons (only for available tokens)
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const ngnzIcon = require('../../components/icons/NGNZ.png');
const solIcon = require('../../components/icons/sol-icon.png');
const bnbIcon = require('../../components/icons/bnb-icon.png');
const maticIcon = require('../../components/icons/matic-icon.png');
const dogeIcon = require('../../components/icons/doge-icon.png');
const avaxIcon = require('../../components/icons/avax-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');

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
  onAssetPress 
}: TokensSectionProps) {
  // Destructure only the data we need, explicitly ignoring loading and error states
  const { 
    btcPrice, 
    ethPrice, 
    solPrice, 
    usdcPrice, 
    usdtPrice,
    avaxPrice,
    bnbPrice,
    maticPrice,
    dogePrice,
    ngnzExchangeRate,
    btcPercentageChange,
    ethPercentageChange, 
    solPercentageChange,
    avaxPercentageChange,
    bnbPercentageChange,
    maticPercentageChange,
    market  // Add market for debugging
  } = useDashboard();

  // Debug logging
  console.log('🔍 TokensSection Debug - Market Data:', {
    market,
    ngnzExchangeRate,
    marketNgnzExchangeRate: market?.ngnzExchangeRate,
    marketNgnbExchangeRate: market?.ngnbExchangeRate
  });

  // Format price with proper decimals
  const formatPrice = (price: number, symbol: string): string => {
    if (symbol === 'BTC') {
      return `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    if (symbol === 'ETH' || symbol === 'SOL' || symbol === 'BNB' || symbol === 'AVAX') {
      return `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    if (symbol === 'USDT' || symbol === 'USDC') {
      return `${price.toFixed(4)} USD`;
    }
    if (symbol === 'MATIC' || symbol === 'DOGE') {
      return `${price.toFixed(4)} USD`;
    }
    if (symbol === 'NGNZ') {
      return `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`;
    }
    return `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  // Format percentage change
  const formatPercentageChange = (change: number): { text: string; isPositive: boolean } => {
    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(2);
    return {
      text: `${isPositive ? '+' : '-'}${formattedChange}%`,
      isPositive
    };
  };

  // Generate tokens from real data only
  const tokens: Token[] = useMemo(() => {
    const tokenData = [];

    // Debug logging for NGNZ
    console.log('🔍 TokensSection Debug - NGNZ Exchange Rate:', {
      ngnzExchangeRate,
      type: typeof ngnzExchangeRate,
      greaterThanZero: ngnzExchangeRate > 0,
      actualValue: ngnzExchangeRate,
      marketNgnbRate: market?.ngnbExchangeRate?.rate
    });

    // Bitcoin
    if (btcPrice > 0) {
      const btcChange = formatPercentageChange(btcPercentageChange);
      tokenData.push({
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: formatPrice(btcPrice, 'BTC'),
        change: btcChange.text,
        changePercent: `${Math.abs(btcPercentageChange).toFixed(2)}%`,
        isPositive: btcChange.isPositive
      });
    }

    // NGNZ (Nigerian Naira - using ngnzExchangeRate) - Moved up after Bitcoin
    // Always show NGNZ, use fallback rate if needed
    const ngnzRate = ngnzExchangeRate || 1600; // Fallback to default NGN rate
    tokenData.push({
      id: 'ngnz',
      name: 'Nigerian Naira',
      symbol: 'NGNZ',
      price: formatPrice(ngnzRate, 'NGNZ'),
      change: '0.00%',
      changePercent: '0.00%',
      isPositive: true
    });

    console.log('🔍 NGNZ Token Added:', {
      ngnzExchangeRate,
      ngnzRate,
      formattedPrice: formatPrice(ngnzRate, 'NGNZ')
    });

    // Ethereum
    if (ethPrice > 0) {
      const ethChange = formatPercentageChange(ethPercentageChange);
      tokenData.push({
        id: 'eth',
        name: 'Ethereum',
        symbol: 'ETH',
        price: formatPrice(ethPrice, 'ETH'),
        change: ethChange.text,
        changePercent: `${Math.abs(ethPercentageChange).toFixed(2)}%`,
        isPositive: ethChange.isPositive
      });
    }

    // Solana
    if (solPrice > 0) {
      const solChange = formatPercentageChange(solPercentageChange);
      tokenData.push({
        id: 'sol',
        name: 'Solana',
        symbol: 'SOL',
        price: formatPrice(solPrice, 'SOL'),
        change: solChange.text,
        changePercent: `${Math.abs(solPercentageChange).toFixed(2)}%`,
        isPositive: solChange.isPositive
      });
    }

    // BNB
    if (bnbPrice > 0) {
      const bnbChange = formatPercentageChange(bnbPercentageChange);
      tokenData.push({
        id: 'bnb',
        name: 'BNB',
        symbol: 'BNB',
        price: formatPrice(bnbPrice, 'BNB'),
        change: bnbChange.text,
        changePercent: `${Math.abs(bnbPercentageChange).toFixed(2)}%`,
        isPositive: bnbChange.isPositive
      });
    }

    // Avalanche
    if (avaxPrice > 0) {
      const avaxChange = formatPercentageChange(avaxPercentageChange);
      tokenData.push({
        id: 'avax',
        name: 'Avalanche',
        symbol: 'AVAX',
        price: formatPrice(avaxPrice, 'AVAX'),
        change: avaxChange.text,
        changePercent: `${Math.abs(avaxPercentageChange).toFixed(2)}%`,
        isPositive: avaxChange.isPositive
      });
    }

    // Polygon (MATIC)
    if (maticPrice > 0) {
      const maticChange = formatPercentageChange(maticPercentageChange);
      tokenData.push({
        id: 'matic',
        name: 'Polygon',
        symbol: 'MATIC',
        price: formatPrice(maticPrice, 'MATIC'),
        change: maticChange.text,
        changePercent: `${Math.abs(maticPercentageChange).toFixed(2)}%`,
        isPositive: maticChange.isPositive
      });
    }

    // Dogecoin (no percentage change available)
    if (dogePrice > 0) {
      tokenData.push({
        id: 'doge',
        name: 'Dogecoin',
        symbol: 'DOGE',
        price: formatPrice(dogePrice, 'DOGE'),
        change: '0.00%',
        changePercent: '0.00%',
        isPositive: true
      });
    }

    // USDT - hardcoded to 1.00 USD
    tokenData.push({
      id: 'usdt',
      name: 'Tether USD',
      symbol: 'USDT',
      price: '1.00 USD',
      change: '0.00%',
      changePercent: '0.00%',
      isPositive: true
    });

    // USDC - hardcoded to 1.00 USD
    tokenData.push({
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      price: '1.00 USD',
      change: '0.00%',
      changePercent: '0.00%',
      isPositive: true
    });

    console.log('🔍 Final Token Data:', {
      totalTokens: tokenData.length,
      tokenIds: tokenData.map(t => t.id),
      hasNGNZ: tokenData.some(t => t.id === 'ngnz'),
      ngnzToken: tokenData.find(t => t.id === 'ngnz')
    });

    return tokenData;
  }, [
    btcPrice, 
    ethPrice, 
    solPrice, 
    usdtPrice, 
    usdcPrice, 
    avaxPrice, 
    bnbPrice, 
    maticPrice, 
    dogePrice,
    ngnzExchangeRate,
    btcPercentageChange, 
    ethPercentageChange, 
    solPercentageChange,
    avaxPercentageChange,
    bnbPercentageChange,
    maticPercentageChange
  ]);

  const getTokenIcon = (symbol: string) => {
    const iconMap: { [key: string]: any } = {
      'BTC': btcIcon,
      'ETH': ethIcon,
      'SOL': solIcon,
      'BNB': bnbIcon,
      'AVAX': avaxIcon,
      'MATIC': maticIcon,
      'DOGE': dogeIcon,
      'USDT': usdtIcon,
      'USDC': usdcIcon,
      'NGNZ': ngnzIcon
    };
    return iconMap[symbol] || btcIcon;
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
        <View style={[styles.changeContainer, { backgroundColor: item.isPositive ? '#E8F5E8' : '#FFE8E8' }]}>
          <Text style={[styles.changeText, { color: item.isPositive ? '#4CAF50' : '#F44336' }]}>
            {item.change}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filter tokens based on active tab
  const filteredTokens = activeTab === 'All tokens' 
    ? tokens 
    : tokens.filter(token => ['btc', 'eth', 'usdt', 'usdc', 'ngnz', 'bnb'].includes(token.id));

  // Debug filtered tokens
  console.log('🔍 Filtered Tokens Debug:', {
    activeTab,
    totalTokens: tokens.length,
    filteredCount: filteredTokens.length,
    filterCriteria: ['btc', 'eth', 'usdt', 'usdc', 'ngnz', 'bnb'],
    filteredIds: filteredTokens.map(t => t.id),
    hasNGNZ: filteredTokens.some(t => t.id === 'ngnz')
  });

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
        data={filteredTokens}
        renderItem={renderToken}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} 
        contentContainerStyle={styles.tokenListContent}
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
});