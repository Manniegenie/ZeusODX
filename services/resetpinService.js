// services/resetpinService.js
import { apiClient } from './apiClient';

const BASE = '/reset-pin';

function isOk(resp) {
  const status = resp?.status ?? resp?.data?.status;
  const successFlag = resp?.data?.success;
  return (status >= 200 && status < 300) || status === 200 || successFlag === true;
}

function errCode(msg = '') {
  const m = String(msg).toLowerCase();
  if (m.includes('verify your email')) return 'EMAIL_NOT_VERIFIED';
  if (m.includes('2fa')) return 'TWO_FA_REQUIRED';
  if (m.includes('otp') && m.includes('expired')) return 'OTP_EXPIRED';
  if (m.includes('invalid otp')) return 'INVALID_OTP';
  if (m.includes('unauthorized')) return 'UNAUTHORIZED';
  if (m.includes('server error')) return 'SERVER_ERROR';
  return 'FETCH_FAILED';
}

export const resetpinService = {
  async initiate({ signal } = {}) {
    try {
      const resp = await apiClient.post(`${BASE}/initiate`, {}, { signal });
      if (!isOk(resp)) {
        const msg = resp?.data?.message || 'Failed to send verification code';
        return { success: false, error: errCode(msg), message: msg };
      }
      const msg = resp?.data?.message || 'Verification code sent';
      return { success: true, message: msg };
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.message || 'Failed to send verification code';
      return { success: false, error: data?.error || errCode(msg), message: msg };
    }
  },

  async verifyOtp({ otp, signal } = {}) {
    const code = String(otp ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: 'INVALID_OTP_FORMAT', message: 'OTP must be 6 digits.' };
    }
    try {
      const resp = await apiClient.post(`${BASE}/verify-otp`, { otp: code }, { signal });
      if (!isOk(resp)) {
        const msg = resp?.data?.message || 'Failed to verify code';
        return { success: false, error: errCode(msg), message: msg };
      }
      const msg = resp?.data?.message || 'OTP verified';
      return { success: true, message: msg };
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.message || 'Failed to verify code';
      return { success: false, error: data?.error || errCode(msg), message: msg };
    }
  },

  async changePin({ newPin, confirmPin, twoFactorCode, signal } = {}) {
    const p1 = String(newPin ?? '').trim();
    const p2 = String(confirmPin ?? '').trim();
    const tfa = String(twoFactorCode ?? '').trim();
    if (!/^\d{4,6}$/.test(p1)) return { success: false, error: 'INVALID_PIN_FORMAT', message: 'PIN should be 4–6 digits.' };
    if (p1 !== p2) return { success: false, error: 'PIN_MISMATCH', message: 'New pin and confirm pin do not match.' };
    if (!tfa) return { success: false, error: 'MISSING_2FA', message: 'Two-factor authentication code is required.' };

    try {
      const resp = await apiClient.post(`${BASE}/change-pin`, { newPin: p1, confirmPin: p2, twoFactorCode: tfa }, { signal });
      if (!isOk(resp)) {
        const msg = resp?.data?.message || 'Failed to change PIN';
        return { success: false, error: errCode(msg), message: msg };
      }
      const msg = resp?.data?.message || 'PIN changed successfully';
      return { success: true, message: msg };
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.message || 'Failed to change PIN';
      return { success: false, error: data?.error || errCode(msg), message: msg };
    }
  },
};
export default resetpinService;
