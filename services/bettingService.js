import { apiClient } from './apiClient';

export const bettingService = {
  /**
   * Validate betting customer
   */
  async validateBettingCustomer(validationData) {
    try {
      console.log('🎰 Validating betting customer via PayBeta:', {
        service: validationData.service,
        customerId: validationData.customerId?.substring(0, 4) + '***'
      });

      const response = await apiClient.post('/betting/validate', {
        service: validationData.service,
        customerId: validationData.customerId
      });

      if (response.success) {
        const data = response.data?.data || response.data;
        console.log('✅ Betting customer validation successful:', data);
        return { success: true, data };
      } else {
        console.log('❌ Betting customer validation failed:', response.data || response.error);
        return { success: false, ...response.data, error: response.error, message: response.data?.message || response.error, status: response.status };
      }
    } catch (error) {
      console.error('❌ Betting customer validation error:', error);
      return { success: false, error: error.message, message: error.message };
    }
  },

  /**
   * Fund betting account
   */
  async fundBettingAccount(fundingData) {
    try {
      console.log('🎰 Starting betting account funding:', {
        customer_id: fundingData.userId,
        service_id: fundingData.service_id,
        amount: fundingData.amount,
        provider: this.getProviderDisplayName(fundingData.service_id)
      });

      const response = await apiClient.post('/betting/fund', {
        customer_id: fundingData.userId,
        service_id: fundingData.service_id,
        amount: parseFloat(fundingData.amount),
        payment_currency: 'NGNZ',
        twoFactorCode: fundingData.twoFactorCode,
        passwordpin: fundingData.passwordpin
      });

      if (response.success) {
        const data = response.data?.data || response.data;
        console.log('✅ Betting funding successful:', data);
        return { success: true, data };
      } else {
        console.log('❌ Betting funding failed:', response.data || response.error);
        return { success: false, ...response.data, error: response.error, message: response.data?.message || response.error, status: response.status };
      }
    } catch (error) {
      console.error('❌ Betting service network error:', error);
      return { success: false, error: error.message, message: error.message };
    }
  },

  /**
   * Fetch betting providers from API. Falls back to static list on failure so UI always has a list.
   * @returns {Promise<Array<{ id, name, displayName, slug, category, logo?, hasLogo }>>}
   */
  async getBettingProviders() {
    try {
      const response = await apiClient.get('/betting/providers');
      const payload = response?.data?.data || response?.data;
      const list = Array.isArray(payload?.providers) ? payload.providers : payload;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return this.getStaticBettingProviders();
    } catch (err) {
      console.warn('Betting providers API failed, using static list:', err?.message);
      return this.getStaticBettingProviders();
    }
  },

  // --- Helpers for UI (no error normalization) ---

  getStaticBettingProviders() {
    const raw = [
      { id: '1xbet', name: '1xBet', displayName: '1xBet', category: 'gaming' },
      { id: 'bangbet', name: 'BangBet', displayName: 'BangBet', category: 'gaming' },
      { id: 'bet9ja', name: 'Bet9ja', displayName: 'Bet9ja', category: 'gaming' },
      { id: 'betking', name: 'BetKing', displayName: 'BetKing', category: 'gaming' },
      { id: 'betland', name: 'BetLand', displayName: 'BetLand', category: 'gaming' },
      { id: 'betlion', name: 'BetLion', displayName: 'BetLion', category: 'gaming' },
      { id: 'betway', name: 'BetWay', displayName: 'Betway', category: 'gaming' },
      { id: 'cloudbet', name: 'CloudBet', displayName: 'CloudBet', category: 'gaming' },
      { id: 'livescorebet', name: 'LiveScoreBet', displayName: 'LiveScore Bet', category: 'gaming' },
      { id: 'merrybet', name: 'MerryBet', displayName: 'MerryBet', category: 'gaming' },
      { id: 'naijabet', name: 'NaijaBet', displayName: 'NaijaBet', category: 'gaming' },
      { id: 'nairabet', name: 'NairaBet', displayName: 'NairaBet', category: 'gaming' },
      { id: 'supabet', name: 'SupaBet', displayName: 'SupaBet', category: 'gaming' }
    ];
    return raw.map(p => ({
      ...p,
      slug: p.slug ?? p.id,
      hasLogo: false,
      logo: undefined
    }));
  },

  getProviderDisplayName(providerId) {
    const provider = this.getStaticBettingProviders().find(p => p.id === providerId);
    return provider?.displayName || providerId;
  },

  getProviderCategory(providerId) {
    const provider = this.getStaticBettingProviders().find(p => p.id === providerId);
    return provider?.category || 'gaming';
  },

  getFundingLimits() {
    return {
      minimum: 1000,
      maximum: 100000,
      currency: 'NGNZ',
      formattedMinimum: '₦1,000',
      formattedMaximum: '₦100,000'
    };
  }
};
