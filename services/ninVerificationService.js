// services/ninVerificationService.js
import { apiClient } from './apiClient';

/** --- Helpers (same style as reset-pin) ---------------------------------- */

// Normalize axios/fetch/custom clients into { status, data }
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

// Extract the most specific server-sent message
function extractMessage(data) {
  if (data == null) return undefined;
  if (typeof data === 'string') return data;

  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.msg === 'string' && data.msg.trim()) return data.msg;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data?.statusText === 'string' && data.statusText.trim()) return data.statusText;

  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message;

  const firstErrorMsg = Array.isArray(data?.errors)
    && data.errors.find(e => typeof e?.message === 'string' && e.message.trim());
  if (firstErrorMsg?.message) return firstErrorMsg.message;

  return undefined;
}
const msgFrom = (data, fallback) => extractMessage(data) ?? fallback;

// Normalize errors (axios/fetch/custom)
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

// Treat 2xx & not explicitly success:false as OK
function isOkNormalized({ status, data }) {
  const okStatus = typeof status === 'number' ? status >= 200 && status < 300 : true;
  const notExplicitlyFailed = data?.success !== false;
  return okStatus && notExplicitlyFailed;
}

// Map human messages to internal codes
function parseErrorCode(message = '') {
  const msg = String(message).toLowerCase();
  if (msg.includes('verify your email')) return 'EMAIL_NOT_VERIFIED';
  if (msg.includes('kindly verify your email')) return 'EMAIL_NOT_VERIFIED';
  if (msg.includes('authentication required')) return 'UNAUTHORIZED';
  if (msg.includes('network')) return 'NETWORK_ERROR';
  return 'UNKNOWN_ERROR';
}

/** --- Service ------------------------------------------------------------ */

export const ninVerificationService = {
  validateNIN(nin) {
    if (!nin || typeof nin !== 'string') return { valid: false, message: 'NIN is required' };
    const clean = nin.trim();
    if (clean.length !== 11) return { valid: false, message: 'NIN must be exactly 11 digits' };
    if (!/^\d{11}$/.test(clean)) return { valid: false, message: 'NIN must contain only numbers' };
    return { valid: true, message: 'Valid NIN format' };
  },

  /**
   * Submit NIN verification to backend
   * Accepts: string "12345678901" OR { nin: "123..." }
   */
  async submitVerification(ninData, { signal } = {}) {
    const nin = typeof ninData === 'string' ? ninData : ninData?.nin;
    try {
      const raw = await apiClient.post('/nin/verify-nin', { nin }, { signal });
      const { status, data } = unwrapResponse(raw);

      if (isOkNormalized({ status, data })) {
        const message = msgFrom(data, 'NIN verification submitted');
        return {
          success: true,
          status,
          message,
          data,
        };
      } else {
        // IMPORTANT: prefer exact server message
        const message = msgFrom(data, undefined) ?? 'Failed to submit NIN verification';
        return { success: false, status, error: parseErrorCode(message), message, data };
      }
    } catch (err) {
      const { status, data, message } = unwrapError(err);
      return { success: false, status, error: parseErrorCode(message), message, data };
    }
  },
};

export default ninVerificationService;
