import { useMemo } from 'react';
import { useApi } from './useApi';
import { tokenService } from '../services/tokenService';

export function useTokens() {
  const {
    data: tokens,
    loading,
    error,
    refetch,
  } = useApi(() => tokenService.getTokens());

  const {
    data: favorites,
    loading: favoritesLoading,
    refetch: refetchFavorites,
  } = useApi(() => tokenService.getFavorites());

  const {
    data: prices,
    loading: pricesLoading,
    refetch: refetchPrices,
  } = useApi(() => tokenService.getTokenPrices());

  // Format tokens with prices and display data
  const formattedTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens)) {
      console.log('🪙 useTokens: No tokens data');
      return [];
    }
    
    console.log('🪙 useTokens: Formatting tokens', tokens.length);
    return tokens.map(token => ({
      ...token,
      formattedPrice: {
        naira: `₦${token.price?.naira?.toLocaleString('en-NG') || '0'}`,
        usd: `$${token.price?.usd?.toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 6 
        }) || '0.00'}`,
      },
      changeFormatted: `${token.change24h > 0 ? '+' : ''}${(token.change24h || 0).toFixed(2)}%`,
      isPositive: (token.change24h || 0) >= 0,
      formattedMarketCap: token.marketCap ? 
        `$${(token.marketCap / 1000000).toFixed(1)}M` : 'N/A',
      formattedVolume: token.volume24h ? 
        `$${(token.volume24h / 1000000).toFixed(1)}M` : 'N/A',
    }));
  }, [tokens, prices]);

  // Get favorite tokens
  const favoriteTokens = useMemo(() => {
    if (!formattedTokens.length || !favorites || !Array.isArray(favorites)) {
      console.log('⭐ useTokens: No favorite tokens');
      return [];
    }
    
    const favoriteIds = favorites.map(fav => fav.id || fav);
    const favTokens = formattedTokens.filter(token => favoriteIds.includes(token.id));
    console.log('⭐ useTokens: Found favorite tokens', favTokens.length);
    return favTokens;
  }, [formattedTokens, favorites]);

  // Get trending tokens (top performers)
  const trendingTokens = useMemo(() => {
    if (!formattedTokens.length) return [];
    
    const trending = [...formattedTokens]
      .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
      .slice(0, 5);
    
    console.log('🔥 useTokens: Found trending tokens', trending.length);
    return trending;
  }, [formattedTokens]);

  // Add token to favorites
  const addToFavorites = async (tokenId) => {
    try {
      console.log(`⭐ useTokens: Adding ${tokenId} to favorites`);
      const response = await tokenService.addToFavorites(tokenId);
      
      if (response.success) {
        console.log('✅ useTokens: Added to favorites successfully');
        refetchFavorites();
        return { success: true };
      } else {
        console.log('❌ useTokens: Failed to add to favorites');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('💥 useTokens: Add to favorites error', error);
      return { success: false, error: error.message };
    }
  };

  // Remove token from favorites
  const removeFromFavorites = async (tokenId) => {
    try {
      console.log(`🗑️ useTokens: Removing ${tokenId} from favorites`);
      const response = await tokenService.removeFromFavorites(tokenId);
      
      if (response.success) {
        console.log('✅ useTokens: Removed from favorites successfully');
        refetchFavorites();
        return { success: true };
      } else {
        console.log('❌ useTokens: Failed to remove from favorites');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('💥 useTokens: Remove from favorites error', error);
      return { success: false, error: error.message };
    }
  };

  // Check if token is favorite
  const isFavorite = (tokenId) => {
    if (!favorites || !Array.isArray(favorites)) return false;
    const favoriteIds = favorites.map(fav => fav.id || fav);
    return favoriteIds.includes(tokenId);
  };

  // Search tokens
  const searchTokens = (query) => {
    if (!query || !formattedTokens.length) return [];
    
    const searchTerm = query.toLowerCase();
    return formattedTokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm) ||
      token.symbol.toLowerCase().includes(searchTerm)
    );
  };

  // Refresh all token data
  const refreshTokens = async () => {
    console.log('🔄 useTokens: Refreshing all token data');
    await Promise.all([
      refetch(),
      refetchFavorites(),
      refetchPrices(),
    ]);
  };

  return {
    tokens: formattedTokens,
    favoriteTokens,
    trendingTokens,
    prices,
    loading: loading || favoritesLoading,
    pricesLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    searchTokens,
    refreshTokens,
    refetch,
    refetchFavorites,
    refetchPrices,
  };
}