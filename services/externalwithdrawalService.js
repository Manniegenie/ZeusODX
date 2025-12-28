import { apiClient } from './apiClient';

export const withdrawalService = {
  // Active withdrawals tracking
  activeWithdrawals: new Map(),

  /**
   * Helper: Generate a unique ID (UUID v4) for idempotency
   */
  generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Calculate withdrawal fee and receiver amount
   */
  async calculateWithdrawalFee(amount, currency, network) {
    try {
      console.log('🔄 Calculating withdrawal fee:', { amount, currency, network });

      const validation = this.validateFeeCalculationRequest({ amount, currency, network });
      if (!validation.success) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          errors: validation.errors
        };
      }

      const payload = {
        amount: Number(amount),
        currency: currency.toUpperCase(),
        network: network?.toUpperCase()
      };

      const idempotencyKey = this.generateIdempotencyKey();

      const response = await apiClient.post('/withdraw/initiate', payload, {
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });

      if (response.success) {
        const feeData = (response.data && response.data.data) || response.data;
        const respMessage = (response.data && response.data.message) || response.message || 'Fee calculated successfully';

        return {
          success: true,
          message: respMessage,
          data: {
            ...feeData,
            feeFormatted: this.formatWithdrawalAmount(feeData.fee, currency),
            receiverAmountFormatted: this.formatWithdrawalAmount(feeData.receiverAmount, currency),
            totalAmountFormatted: this.formatWithdrawalAmount(feeData.totalAmount, currency),
            feeUsdFormatted: this.formatCurrency(feeData.feeUsd, 'USD')
          }
        };
      } else {
        return this.handleWithdrawalError(response);
      }
    } catch (error) {
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * Initiate crypto withdrawal
   */
  async initiateWithdrawal(withdrawalData) {
    try {
      const { destination, amount, currency, twoFactorCode, passwordpin, memo, narration } = withdrawalData;

      const validation = this.validateWithdrawalRequest(withdrawalData);
      if (!validation.success) {
        return { success: false, error: 'VALIDATION_ERROR', message: validation.message, errors: validation.errors };
      }

      const idempotencyKey = this.generateIdempotencyKey();

      const payload = {
        destination: {
          address: destination.address.trim(),
          network: destination.network?.toUpperCase(),
          memo: destination.memo?.trim()
        },
        amount: Number(amount),
        currency: currency.toUpperCase(),
        twoFactorCode: twoFactorCode.trim(),
        passwordpin: String(passwordpin).trim(),
        memo: memo?.trim() || null,
        narration: narration?.trim() || null
      };

      const response = await apiClient.post('/withdraw/crypto', payload, {
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });

      if (response.success) {
        const wdData = (response.data && response.data.data) || response.data;
        this.trackActiveWithdrawal(wdData.transactionId, {
          ...wdData,
          idempotencyKey,
          initiatedAt: new Date().toISOString()
        });

        return { success: true, message: response.message || 'Success', data: { ...wdData } };
      } else {
        return this.handleWithdrawalError(response);
      }
    } catch (error) {
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(transactionId) {
    try {
      if (!transactionId) return { success: false, error: 'INVALID_ID', message: 'ID required' };
      const response = await apiClient.get(`/withdraw/status/${transactionId}`);

      if (response.success) {
        const statusData = (response.data && response.data.data) || response.data;
        if (this.activeWithdrawals.has(transactionId)) {
          const existing = this.activeWithdrawals.get(transactionId);
          this.activeWithdrawals.set(transactionId, { ...existing, ...statusData, lastUpdated: new Date().toISOString() });
        }
        return { success: true, data: { ...statusData, statusDescription: this.getStatusDescription(statusData.status) } };
      }
      return this.handleWithdrawalError(response);
    } catch (error) {
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * RESTORED: Get minimum withdrawal amounts
   */
  getMinimumWithdrawalAmount(currency) {
    const minimums = {
      BTC: 0.0001,
      ETH: 0.001,
      SOL: 0.01,
      USDT: 20,
      USDC: 10,
      BNB: 0.01,
      MATIC: 1,
      TRX: 10,
      NGNB: 100
    };
    return minimums[currency?.toUpperCase()] || 0;
  },

  /**
   * RESTORED: Validate minimum amount
   */
  validateMinimumAmount(amount, currency) {
    const minimum = this.getMinimumWithdrawalAmount(currency);
    const numericAmount = Number(amount);
    if (numericAmount < minimum) {
      return { success: false, message: `Minimum withdrawal for ${currency} is ${minimum}`, minimum };
    }
    return { success: true };
  },

  validateFeeCalculationRequest(data) {
    const { amount, currency, network } = data;
    if (!amount || !currency?.trim() || !network?.trim()) return { success: false, message: 'Missing fields' };
    return { success: true };
  },

  validateWithdrawalRequest(data) {
    const { destination, amount, currency, twoFactorCode, passwordpin } = data;
    if (!destination?.address || !amount || !currency || !twoFactorCode || !passwordpin) return { success: false, message: 'Missing required fields' };
    return { success: true };
  },

  handleWithdrawalError(error) {
    const raw = error.message || error.error || error.response?.data?.message || 'Withdrawal error';
    return { success: false, message: raw, error: 'SERVICE_ERROR' };
  },

  getStatusDescription(status) {
    const descriptions = { PENDING: 'Processing', SUCCESS: 'Completed', FAILED: 'Failed' };
    return descriptions[status] || 'Unknown';
  },

  trackActiveWithdrawal(transactionId, data) {
    this.activeWithdrawals.set(transactionId, { ...data, trackedAt: new Date().toISOString() });
  },

  getActiveWithdrawals() {
    return Array.from(this.activeWithdrawals.entries()).map(([id, data]) => ({ transactionId: id, ...data }));
  },

  formatWithdrawalAmount(amount, currency) {
    return amount.toFixed(currency?.toUpperCase() === 'BTC' ? 8 : 4);
  },

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  },

  getSupportedCurrencies() {
    return [{ symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ethereum' }, { symbol: 'USDT', name: 'Tether' }];
  },

  getSupportedNetworks(currency) {
    const networks = { BTC: [{ code: 'BTC' }], ETH: [{ code: 'ETH' }, { code: 'BSC' }], USDT: [{ code: 'TRX' }, { code: 'ETH' }] };
    return networks[currency?.toUpperCase()] || [];
  },

  getCacheStatus() {
    return { activeCount: this.activeWithdrawals.size };
  },

  async clearAllData() {
    this.activeWithdrawals.clear();
  }
};