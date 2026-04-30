import { apiClient } from './apiClient';

export const referralService = {
  async getReferralInfo() {
    console.log('📊 Fetching referral info');
    const response = await apiClient.get('/referral/me');

    if (response.success) {
      console.log('✅ Referral info fetched');
    } else {
      console.log('❌ Referral info fetch failed:', response.error);
    }

    return response;
  },
};
