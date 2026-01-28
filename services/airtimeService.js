import { apiClient } from './apiClient';

export const airtimeService = {
  /**
   * Purchase airtime
   * @param {Object} purchaseData
   * @returns {Promise<Object>}
   */
  async purchaseAirtime(purchaseData) {
    try {
      console.log('📱 Starting airtime purchase:', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id,
        amount: purchaseData.amount
      });

      const response = await apiClient.post('/airtime/purchase', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id?.toLowerCase(),
        amount: parseFloat(purchaseData.amount),
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      if (response.success) {
        return { success: true, data: response.data?.data || response.data };
      } else {
        // Pass backend error exactly as received
        return {
          success: false,
          ...response.data,
          error: response.error,
          message: response.data?.message || response.error,
          status: response.status
        };
      }
    } catch (error) {
      console.error('❌ Airtime service network error:', error);

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error.message || 'Network request failed'
      };
    }
  },

  /**
   * Validate purchase data (client-side)
   */
  validatePurchaseData(data) {
    const errors = [];

    if (!data.phone?.trim()) errors.push('Phone number is required');
    if (!data.service_id?.trim()) errors.push('Network provider is required');
    if (!data.amount || isNaN(parseFloat(data.amount))) errors.push('Amount is required');
    if (!data.twoFactorCode?.trim()) errors.push('2FA code is required');
    if (!data.passwordpin?.trim()) errors.push('Password PIN is required');

    return { isValid: errors.length === 0, errors };
  },

  formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('234')) return `0${cleaned.slice(3)}`;
    if (cleaned.startsWith('0')) return cleaned;
    if (cleaned.length === 10) return `0${cleaned}`;
    return phone;
  },

  getNetworkDisplayName(serviceId) {
    const names = { mtn: 'MTN', airtel: 'Airtel', glo: 'Glo', '9mobile': '9mobile' };
    return names[serviceId?.toLowerCase()] || serviceId;
  }
};
