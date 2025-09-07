// services/emailVerificationService.js
import { apiClient } from './apiClient';

const BASE = '/email';

/** --- Helpers (same approach as resetpinService) ------------------------- */

function unwrapResponse(resp) {
  if (resp && typeof resp === 'object' && 'data' in resp) {
    return { status: resp.status ?? 200, data: resp.data };
  }
  if (resp && typeof resp === 'object') {
    const status = typeof resp.status === 'number' ? resp.status : 200;
    return { status, data: resp };
  }
  return { status: 200, data: { value: resp } };
}

function extractMessage(data) {
  if (data == null) return undefined;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.msg === 'string' && data.msg.trim()) return data.msg;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data?.statusText === 'string' && data.statusText.trim()) return data.statusText;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message;

  const firstErrorMsg =
    Array.isArray(data?.errors) &&
    data.errors.find(e => typeof e?.message === 'string' && e.message.trim());
  if (firstErrorMsg?.message) return firstErrorMsg.message;

  return undefined;
}

function unwrapError(err) {
  const axiosResp = err?.response;
  if (axiosResp) {
    const msg = extractMessage(axiosResp?.data) ?? err?.message ?? 'Request failed';
    return { status: axiosResp.status, data: axiosResp.data, message: msg };
  }
  if (err && typeof err === 'object' && ('status' in err || 'data' in err)) {
    const msg = extractMessage(err?.data) ?? err?.message ?? 'Request failed';
    return { status: err.status, data: err.data, message: msg };
  }
  return { status: undefined, data: undefined, message: err?.message || 'Request failed' };
}

function isOkNormalized({ status, data }) {
  const okStatus = typeof status === 'number' ? status >= 200 && status < 300 : true;
  const notExplicitlyFailed = data?.success !== false;
  return okStatus && notExplicitlyFailed;
}

function msgFrom(data, fallback) {
  const exact = extractMessage(data);
  return exact ?? fallback;
}

function parseErrorCode(message = '') {
  const msg = String(message).toLowerCase();

  if (msg.includes('already verified')) return 'EMAIL_ALREADY_VERIFIED';
  if (msg.includes('invalid email')) return 'INVALID_EMAIL';
  if (msg.includes('email address is required')) return 'EMAIL_REQUIRED';
  if (msg.includes('user not found')) return 'USER_NOT_FOUND';
  if (msg.includes('failed to send')) return 'EMAIL_SEND_FAILED';
  if (msg.includes('authentication required')) return 'UNAUTHORIZED';
  if (msg.includes('server error')) return 'SERVER_ERROR';
  
  // Verification-specific errors
  if (msg.includes('verification code is required')) return 'OTP_REQUIRED';
  if (msg.includes('invalid verification code')) return 'INVALID_OTP';
  if (msg.includes('verification code has expired')) return 'OTP_EXPIRED';
  if (msg.includes('no verification code found')) return 'NO_OTP_FOUND';
  if (msg.includes('email mismatch')) return 'EMAIL_MISMATCH';

  return 'UNKNOWN_ERROR';
}

/** --- Service ------------------------------------------------------------ */

export const emailVerificationService = {
  /**
   * POST /email/initiate
   * @param {Object} opts
   * @param {string} [opts.email] - optional override; backend falls back to user.email
   * @param {AbortSignal} [opts.signal]
   */
  async initiate({ email, signal } = {}) {
    try {
      const payload = email ? { email } : {};
      const raw = await apiClient.post(`${BASE}/initiate`, payload, { signal });
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'Verification code sent to your email address');
        return { success: true, message, status, data };
      } else {
        // Prefer server message; only then fallback
        const message = msgFrom(data, undefined) ?? 'Failed to send verification code';
        return { success: false, error: parseErrorCode(message), message, status, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, error: parseErrorCode(message), message, status, data };
    }
  },

  /**
   * POST /email/verify
   * @param {Object} opts
   * @param {string} opts.otp - the verification code
   * @param {string} [opts.email] - optional email for validation
   * @param {AbortSignal} [opts.signal]
   */
  async verify({ otp, email, signal } = {}) {
    try {
      if (!otp) {
        return { 
          success: false, 
          error: 'OTP_REQUIRED', 
          message: 'Verification code is required',
          status: 400 
        };
      }

      const payload = { otp };
      if (email) payload.email = email;

      const raw = await apiClient.post(`${BASE}/verify`, payload, { signal });
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'Email address verified successfully');
        return { success: true, message, status, data };
      } else {
        const message = msgFrom(data, undefined) ?? 'Failed to verify email address';
        return { success: false, error: parseErrorCode(message), message, status, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, error: parseErrorCode(message), message, status, data };
    }
  },
};

export default emailVerificationService;