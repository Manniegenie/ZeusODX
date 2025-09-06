// services/resetpinService.js
import { apiClient } from './apiClient';

const BASE = '/reset-pin';

/** --- Helpers ------------------------------------------------------------ */

// Normalize axios/fetch/custom clients into { status, data }
function unwrapResponse(resp) {
  // Axios style: { status, data }
  if (resp && typeof resp === 'object' && 'data' in resp) {
    return { status: resp.status ?? 200, data: resp.data };
  }
  // Already a plain payload or custom shape
  if (resp && typeof resp === 'object') {
    const status = typeof resp.status === 'number' ? resp.status : 200;
    return { status, data: resp };
  }
  // Primitive fallback
  return { status: 200, data: { value: resp } };
}

// Normalize errors (axios/fetch/custom)
function unwrapError(err) {
  const axiosResp = err?.response;
  if (axiosResp) {
    const msg = extractMessage(axiosResp?.data) ?? err?.message ?? 'Request failed';
    return {
      status: axiosResp.status,
      data: axiosResp.data,
      message: msg,
    };
  }
  if (err && typeof err === 'object' && ('status' in err || 'data' in err)) {
    const msg = extractMessage(err?.data) ?? err?.message ?? 'Request failed';
    return {
      status: err.status,
      data: err.data,
      message: msg,
    };
  }
  return {
    status: undefined,
    data: undefined,
    message: err?.message || 'Request failed',
  };
}

// Treat 2xx & not explicitly success:false as OK
function isOkNormalized({ status, data }) {
  const okStatus = typeof status === 'number' ? status >= 200 && status < 300 : true;
  const notExplicitlyFailed = data?.success !== false;
  return okStatus && notExplicitlyFailed;
}

/**
 * Extract the most specific server-sent message we can find.
 * Priority order covers common API shapes:
 * - { message }, { msg }, { detail }, { statusText }
 * - { error: string } or { error: { message } }
 * - { errors: [{ message }] }
 * - raw string response
 */
function extractMessage(data) {
  if (data == null) return undefined;

  // If the payload itself is a string, use it directly
  if (typeof data === 'string') return data;

  // Common fields
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.msg === 'string' && data.msg.trim()) return data.msg;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data?.statusText === 'string' && data.statusText.trim()) return data.statusText;

  // error could be a string or object with .message
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message;

  // errors could be an array with { message }
  const firstErrorMsg = Array.isArray(data?.errors) && data.errors.find(e => typeof e?.message === 'string' && e.message.trim());
  if (firstErrorMsg && firstErrorMsg.message) return firstErrorMsg.message;

  return undefined;
}

// Backward-compatible helper that *prefers* exact server message; only then fallback
function msgFrom(data, fallback) {
  return extractMessage(data) ?? fallback;
}

// Map human messages to internal codes (uses whatever message we ended up returning)
function parseErrorCode(message = '') {
  const msg = String(message).toLowerCase();

  if (msg.includes('kindly verify your email')) return 'EMAIL_NOT_VERIFIED';
  if (msg.includes('2fa setup required')) return 'TWO_FA_REQUIRED';
  if (msg.includes('invalid two-factor authentication')) return 'INVALID_2FA_CODE';
  if (msg.includes('otp has expired')) return 'OTP_EXPIRED';
  if (msg.includes('session has expired')) return 'SESSION_EXPIRED';
  if (msg.includes('invalid otp')) return 'INVALID_OTP';
  if (msg.includes('no pending pin reset request')) return 'NO_PENDING_REQUEST';
  if (msg.includes('please verify otp first')) return 'OTP_NOT_VERIFIED';
  if (msg.includes('user not found')) return 'USER_NOT_FOUND';
  if (msg.includes('server error')) return 'SERVER_ERROR';
  if (msg.includes('failed to send verification code')) return 'EMAIL_SEND_FAILED';

  return 'UNKNOWN_ERROR';
}

/** --- Service ------------------------------------------------------------ */

export const resetpinService = {
  async initiate({ signal } = {}) {
    try {
      const raw = await apiClient.post(`${BASE}/initiate`, {}, { signal });
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'Verification code sent successfully');
        return { success: true, message, data };
      } else {
        // IMPORTANT: prefer the server's exact message (no generic override)
        const message = msgFrom(data, undefined) ?? 'Failed to send verification code';
        return { success: false, error: parseErrorCode(message), message, status, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, error: parseErrorCode(message), message, status, data };
    }
  },

  async verifyOtp({ otp, signal } = {}) {
    const code = String(otp ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: 'INVALID_OTP_FORMAT',
        message: 'OTP must be 6 digits.',
      };
    }

    try {
      const raw = await apiClient.post(`${BASE}/verify-otp`, { otp: code }, { signal });
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'OTP verified successfully');
        return { success: true, message, data };
      } else {
        const message = msgFrom(data, undefined) ?? 'Failed to verify code';
        return { success: false, error: parseErrorCode(message), message, status, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, error: parseErrorCode(message), message, status, data };
    }
  },

  async changePin({ newPin, confirmPin, twoFactorCode, signal } = {}) {
    const p1 = String(newPin ?? '').trim();
    const p2 = String(confirmPin ?? '').trim();
    const tfa = String(twoFactorCode ?? '').trim();

    if (!/^\d{4,6}$/.test(p1)) {
      return { success: false, error: 'INVALID_PIN_FORMAT', message: 'PIN should be 4–6 digits.' };
    }
    if (p1 !== p2) {
      return { success: false, error: 'PIN_MISMATCH', message: 'New pin and confirm pin do not match.' };
    }
    if (!tfa) {
      return { success: false, error: 'MISSING_2FA', message: 'Two-factor authentication code is required.' };
    }

    try {
      const raw = await apiClient.post(
        `${BASE}/change-pin`,
        { newPin: p1, confirmPin: p2, twoFactorCode: tfa },
        { signal }
      );
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'PIN changed successfully');
        return { success: true, message, data };
      } else {
        const message = msgFrom(data, undefined) ?? 'Failed to change PIN';
        return { success: false, error: parseErrorCode(message), message, status, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, error: parseErrorCode(message), message, status, data };
    }
  },
};

export default resetpinService;
