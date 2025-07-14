import { apiClient } from './apiClient';

export const tokenService = {
  async getTokens() {
    console.log('🪙 Fetching all tokens');
    return apiClient.get('/tokens');
  },

  async getTokenPrices(symbols) {
    const endpoint = symbols 
      ? `/tokens/prices?symbols=${symbols.join(',')}`
      : '/tokens/prices';
    
    console.log('💰 Fetching token prices', symbols ? `for ${symbols.join(', ')}` : 'for all tokens');
    return apiClient.get(endpoint);
  },

  async getTokenDetails(tokenId) {
    console.log(`🔍 Fetching details for token ${tokenId}`);
    return apiClient.get(`/tokens/${tokenId}`);
  },

  async getFavorites() {
    console.log('⭐ Fetching favorite tokens');
    return apiClient.get('/tokens/favorites');
  },

  async addToFavorites(tokenId) {
    console.log(`⭐ Adding token ${tokenId} to favorites`);
    return apiClient.post('/tokens/favorites', { tokenId });
  },

  async removeFromFavorites(tokenId) {
    console.log(`🗑️ Removing token ${tokenId} from favorites`);
    return apiClient.delete(`/tokens/favorites/${tokenId}`);
  },

  async getTokenChart(tokenId, timeframe = '7d') {
    console.log(`📈 Fetching chart data for ${tokenId} (${timeframe})`);
    return apiClient.get(`/tokens/${tokenId}/chart?timeframe=${timeframe}`);
  },

  async searchTokens(query) {
    console.log(`🔍 Searching tokens for: ${query}`);
    return apiClient.get(`/tokens/search?q=${encodeURIComponent(query)}`);
  },

  async getMarketData() {
    console.log('📊 Fetching market data');
    return apiClient.get('/tokens/market');
  },

  async getTrendingTokens() {
    console.log('🔥 Fetching trending tokens');
    return apiClient.get('/tokens/trending');
  },
};