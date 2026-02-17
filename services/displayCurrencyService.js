import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

const DISPLAY_CURRENCY_KEY = 'display_currency';

/**
 * Get user's preferred display currency (USD or NGN) from API, with local fallback.
 * @returns {Promise<'USD'|'NGN'>}
 */
export async function getDisplayCurrency() {
  try {
    const response = await apiClient.get('/user/display-currency');
    if (response?.success && response?.data?.displayCurrency) {
      const currency = response.data.displayCurrency;
      if (currency === 'USD' || currency === 'NGN') {
        await AsyncStorage.setItem(DISPLAY_CURRENCY_KEY, currency);
        return currency;
      }
    }
  } catch (_) {}
  try {
    const stored = await AsyncStorage.getItem(DISPLAY_CURRENCY_KEY);
    if (stored === 'USD' || stored === 'NGN') return stored;
  } catch (_) {}
  return 'USD';
}

/**
 * Set user's preferred display currency and persist to server.
 * @param {'USD'|'NGN'} displayCurrency
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setDisplayCurrency(displayCurrency) {
  if (displayCurrency !== 'USD' && displayCurrency !== 'NGN') {
    return { success: false, error: 'Invalid currency' };
  }
  try {
    await AsyncStorage.setItem(DISPLAY_CURRENCY_KEY, displayCurrency);
    const response = await apiClient.put('/user/display-currency', { displayCurrency });
    if (response?.success) return { success: true };
    return { success: false, error: response?.message || 'Update failed' };
  } catch (error) {
    return { success: false, error: error?.message || 'Network error' };
  }
}

export const displayCurrencyService = {
  getDisplayCurrency,
  setDisplayCurrency,
};
