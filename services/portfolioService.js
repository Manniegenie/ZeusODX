import { apiClient } from './apiClient';

export const portfolioService = {
  async getPortfolio() {
    console.log('📊 Fetching portfolio data');
    return apiClient.get('/portfolio');
  },

  async getBalance() {
    console.log('💰 Fetching portfolio balance');
    return apiClient.get('/portfolio/balance');
  },

  async getHistory(timeframe = '7d') {
    console.log(`📈 Fetching portfolio history for ${timeframe}`);
    return apiClient.get(`/portfolio/history?timeframe=${timeframe}`);
  },

  async getAssets() {
    console.log('🏦 Fetching portfolio assets');
    return apiClient.get('/portfolio/assets');
  },

  async getPerformance() {
    console.log('📊 Fetching portfolio performance');
    return apiClient.get('/portfolio/performance');
  },

  async updateAsset(assetId, data) {
    console.log(`✏️ Updating asset ${assetId}`);
    return apiClient.put(`/portfolio/assets/${assetId}`, data);
  },
};