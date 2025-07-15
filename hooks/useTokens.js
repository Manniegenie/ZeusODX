import { useMemo } from 'react';
import { useDashboard } from './useDashboard';

// Token metadata with icons and display info
const TOKEN_METADATA = {
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: require('../components/icons/btc-icon.png'),
    order: 1
  },
  NGNZ: {
    name: 'Nigerian Naira',
    symbol: 'NGNZ',
    icon: require('../components/icons/NGNZ.png'),
    order: 2
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: require('../components/icons/eth-icon.png'),
    order: 3
  },
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    icon: require('../components/icons/sol-icon.png'),
    order: 4
  },
  BNB: {
    name: 'BNB',
    symbol: 'BNB',
    icon: require('../components/icons/bnb-icon.png'),
    order: 5
  },
  AVAX: {
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: require('../components/icons/avax-icon.png'),
    order: 6
  },
  MATIC: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: require('../components/icons/matic-icon.png'),
    order: 7
  },
  DOGE: {
    name: 'Dogecoin',
    symbol: 'DOGE',
    icon: require('../components/icons/doge-icon.png'),
    order: 8
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: require('../components/icons/usdt-icon.png'),
    order: 9
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: require('../components/icons/usdc-icon.png'),
    order: 10
  }
};

export function useTokens() {
  // Get dashboard data which includes market prices and changes
  const { 
    market, 
    loading, 
    error, 
    refetch 
  } = useDashboard();

  // Format tokens based on market data from dashboard
  const formattedTokens = useMemo(() => {
    if (!market?.prices) {
      console.log('🪙 useTokens: No market prices data');
      return [];
    }

    const { prices, priceChanges12h, ngnzExchangeRate } = market;
    
    console.log('🪙 useTokens: Processing market data', {
      pricesCount: Object.keys(prices).length,
      changesCount: Object.keys(priceChanges12h || {}).length,
      ngnzRate: ngnzExchangeRate?.rate
    });

    const tokens = [];

    // Process each token that has a price
    Object.entries(prices).forEach(([symbol, price]) => {
      const metadata = TOKEN_METADATA[symbol];
      if (!metadata) return; // Skip unknown tokens

      const priceChange = priceChanges12h?.[symbol];
      const change24h = priceChange?.percentageChange || 0;

      // Special handling for NGNZ
      const isNGNZ = symbol === 'NGNZ';
      const currentPrice = isNGNZ ? (ngnzExchangeRate?.rate || price) : price;

      const token = {
        id: symbol.toLowerCase(),
        symbol: symbol,
        name: metadata.name,
        icon: metadata.icon,
        order: metadata.order,
        
        // Price data
        price: {
          usd: isNGNZ ? null : currentPrice,
          naira: isNGNZ ? currentPrice : (currentPrice * (ngnzExchangeRate?.rate || 1600))
        },
        currentPrice,
        
        // Change data
        change24h,
        priceChange12h: change24h,
        isPositive: change24h >= 0,
        
        // Formatted display values
        formattedPrice: {
          naira: isNGNZ 
            ? `₦${currentPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `₦${(currentPrice * (ngnzExchangeRate?.rate || 1600)).toLocaleString('en-NG')}`,
          usd: isNGNZ 
            ? 'Local Currency'
            : `$${currentPrice.toLocaleString('en-US', { 
                minimumFractionDigits: symbol === 'BTC' ? 2 : (currentPrice < 1 ? 4 : 2),
                maximumFractionDigits: symbol === 'BTC' ? 2 : (currentPrice < 1 ? 4 : 2)
              })}`
        },
        changeFormatted: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
        
        // Additional market data if needed
        lastUpdated: market.pricesLastUpdated,
        priceChangeData: priceChange || null
      };

      tokens.push(token);
    });

    // Sort tokens by order
    tokens.sort((a, b) => a.order - b.order);
    
    console.log('🪙 useTokens: Formatted tokens', {
      count: tokens.length,
      symbols: tokens.map(t => t.symbol),
      hasNGNZ: tokens.some(t => t.symbol === 'NGNZ')
    });

    return tokens;
  }, [market]);

  // Get favorite tokens (you might want to implement favorites storage separately)
  const favoriteTokens = useMemo(() => {
    // For now, return popular tokens as favorites
    // You can implement actual favorites storage later
    const favoriteSymbols = ['BTC', 'ETH', 'USDT', 'USDC', 'NGNZ', 'BNB'];
    const favorites = formattedTokens.filter(token => 
      favoriteSymbols.includes(token.symbol)
    );
    
    console.log('⭐ useTokens: Favorite tokens', favorites.length);
    return favorites;
  }, [formattedTokens]);

  // Get trending tokens (top performers by 24h change)
  const trendingTokens = useMemo(() => {
    if (!formattedTokens.length) return [];
    
    const trending = [...formattedTokens]
      .filter(token => token.symbol !== 'NGNZ') // Exclude NGNZ from trending
      .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
      .slice(0, 5);
    
    console.log('🔥 useTokens: Trending tokens', trending.length);
    return trending;
  }, [formattedTokens]);

  // Mock functions for favorites (implement with actual storage later)
  const addToFavorites = async (tokenId) => {
    console.log(`⭐ useTokens: Adding ${tokenId} to favorites (mock)`);
    // Implement actual favorites storage
    return { success: true };
  };

  const removeFromFavorites = async (tokenId) => {
    console.log(`🗑️ useTokens: Removing ${tokenId} from favorites (mock)`);
    // Implement actual favorites storage
    return { success: true };
  };

  const isFavorite = (tokenId) => {
    // Mock implementation - check against hardcoded favorites
    const favoriteIds = ['btc', 'eth', 'usdt', 'usdc', 'ngnz', 'bnb'];
    return favoriteIds.includes(tokenId.toLowerCase());
  };

  // Search tokens
  const searchTokens = (query) => {
    if (!query || !formattedTokens.length) return [];
    
    const searchTerm = query.toLowerCase();
    const results = formattedTokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm) ||
      token.symbol.toLowerCase().includes(searchTerm)
    );
    
    console.log(`🔍 useTokens: Search "${query}" found ${results.length} results`);
    return results;
  };

  // Get token by symbol
  const getTokenBySymbol = (symbol) => {
    return formattedTokens.find(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  };

  // Get token by id
  const getTokenById = (id) => {
    return formattedTokens.find(token => token.id === id);
  };

  // Refresh token data (refetch dashboard)
  const refreshTokens = async () => {
    console.log('🔄 useTokens: Refreshing token data via dashboard');
    return refetch();
  };

  return {
    // Token data
    tokens: formattedTokens,
    favoriteTokens,
    trendingTokens,
    
    // Market data (direct from dashboard)
    prices: market?.prices || {},
    priceChanges: market?.priceChanges12h || {},
    ngnzExchangeRate: market?.ngnzExchangeRate,
    lastUpdated: market?.pricesLastUpdated,
    
    // Loading states
    loading,
    error,
    
    // Actions
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    searchTokens,
    getTokenBySymbol,
    getTokenById,
    refreshTokens,
    refetch,
    
    // Helper getters
    getPopularTokens: () => favoriteTokens,
    getAllTokens: () => formattedTokens,
    getTokenCount: () => formattedTokens.length,
    
    // Market summary
    marketSummary: {
      totalTokens: formattedTokens.length,
      positiveChanges: formattedTokens.filter(t => t.change24h > 0).length,
      negativeChanges: formattedTokens.filter(t => t.change24h < 0).length,
      lastUpdated: market?.pricesLastUpdated
    }
  };
}