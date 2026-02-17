import { apiClient } from './apiClient';

const BASE_PATH = '/withdrawal';

/**
 * Fetches the max withdrawable amount for a token from the server (source of truth).
 * Used for NGNZ withdrawal and external crypto withdrawal "Max" button.
 *
 * @param {string} currency - Token symbol (e.g. 'NGNZ', 'BTC', 'USDT')
 * @returns {Promise<{ success: boolean, maxAmount?: number, error?: string }>}
 */
export async function getMaxWithdrawable(currency) {
  if (!currency || typeof currency !== 'string') {
    return { success: false, error: 'Currency is required' };
  }
  const normalized = String(currency).trim().toUpperCase();
  try {
    const res = await apiClient.get(`${BASE_PATH}/max-amount?currency=${encodeURIComponent(normalized)}`);
    const data = res?.data;
    if (!data?.success || data?.data == null) {
      return {
        success: false,
        error: data?.error || data?.message || 'Failed to get max amount',
      };
    }
    const maxAmount = Number(data.data.maxAmount);
    return {
      success: true,
      maxAmount: Number.isFinite(maxAmount) ? maxAmount : 0,
      currency: data.data.currency || normalized,
    };
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Network error';
    return { success: false, error: message };
  }
}
