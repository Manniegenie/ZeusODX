// services/ngnzWithdrawalService.js
import { apiClient } from './apiClient';

const DEBUG_NGNZ_WD = true;
const dbg = (...args) => { if (DEBUG_NGNZ_WD) console.log('[ngnzWithdrawalService]', ...args); };

// If your router is mounted at /ngnz, keep this; if mounted at root, set to ''.
const BASE_PATH = '/ngnz-withdrawal';

const paths = {
  withdraw: () => `${BASE_PATH}/withdraw`,
  status: (withdrawalId) => `${BASE_PATH}/status/${encodeURIComponent(withdrawalId)}`
};

function genIdempotencyKey(prefix = 'ngnz-wd') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeWithdrawal(data = {}) {
  return {
    withdrawalId: data?.withdrawalId || data?.reference || null,
    transactionId: data?.transactionId || null,
    correlationId: data?.correlationId || null,
    status: data?.status || null, // e.g. SUCCESSFUL | PENDING | FAILED
    amount: typeof data?.amount === 'number' ? data.amount : null,
    currency: data?.currency || 'NGNZ',
    destination: {
      bankName: data?.destination?.bankName || null,
      accountName: data?.destination?.accountName || null,
      accountNumber: data?.destination?.accountNumber || null, // masked by backend
    },
    obiex: data?.obiex || null,
    balanceAfter: typeof data?.balanceAfter === 'number' ? data.balanceAfter : null,
    processedAt: data?.processedAt || null,
    authValidation: {
      twoFactorValidated: !!data?.authValidation?.twoFactorValidated,
      passwordPinValidated: !!data?.authValidation?.passwordPinValidated,
    },
  };
}

function normalizeStatus(data = {}) {
  return {
    withdrawalId: data?.withdrawalId || null,
    transactionId: data?.transactionId || null,
    status: data?.status || null, // PENDING | SUCCESSFUL | FAILED
    amount: typeof data?.amount === 'number' ? data.amount : null,
    currency: data?.currency || 'NGNZ',
    destination: {
      bankName: data?.destination?.bankName || null,
      accountName: data?.destination?.accountName || null,
      accountNumber: data?.destination?.accountNumber || null, // masked
    },
    obiex: data?.obiex || null,
    createdAt: data?.createdAt || null,
    completedAt: data?.completedAt || null,
    narration: data?.narration || null,
    authValidation: {
      twoFactorValidated: !!data?.authValidation?.twoFactorValidated,
      passwordPinValidated: !!data?.authValidation?.passwordPinValidated,
    },
  };
}

function parseError(err) {
  const status = err?.response?.status;
  const body = err?.response?.data || {};
  const code = body?.error;
  const apiMsg = body?.message || body?.error || err?.message || 'Network error';

  let error = 'NETWORK_ERROR';
  let message = apiMsg;

  // Parse error message to detect OTP/PIN invalid errors
  const errorText = (apiMsg || '').toLowerCase();

  if (status === 400) {
    if (code === 'LIMIT_EXCEEDED' || errorText.includes('limit exceeded')) {
      error = 'LIMIT_EXCEEDED';
    }
    if (code === '2FA_NOT_SETUP') error = '2FA_NOT_SETUP';
    else if (code === 'PIN_NOT_SETUP') error = 'PIN_NOT_SETUP';
    else if (code === 'INVALID_OTP' || errorText.includes('invalid otp') || errorText.includes('otp invalid') ||
             errorText.includes('incorrect otp') || errorText.includes('invalid verification code')) {
      error = 'INVALID_OTP';
    }
    else if (code === 'INVALID_PASSWORDPIN' || errorText.includes('invalid pin') || errorText.includes('pin invalid') ||
             errorText.includes('invalid passwordpin') || errorText.includes('passwordpin invalid') ||
             errorText.includes('invalid password pin') || errorText.includes('incorrect pin')) {
      error = 'INVALID_PASSWORDPIN';
    }
    else error = 'VALIDATION_ERROR';
  } else if (status === 401) {
    if (code === 'INVALID_2FA_CODE' || errorText.includes('invalid 2fa') || errorText.includes('2fa invalid') ||
        errorText.includes('invalid two-factor') || errorText.includes('incorrect 2fa')) {
      error = 'INVALID_2FA_CODE';
    }
    else if (code === 'INVALID_PASSWORDPIN' || errorText.includes('invalid pin') || errorText.includes('pin invalid') ||
             errorText.includes('invalid passwordpin') || errorText.includes('passwordpin invalid') ||
             errorText.includes('invalid password pin') || errorText.includes('incorrect pin')) {
      error = 'INVALID_PASSWORDPIN';
    }
    else if (code === 'INVALID_OTP' || errorText.includes('invalid otp') || errorText.includes('otp invalid') ||
             errorText.includes('incorrect otp') || errorText.includes('invalid verification code')) {
      error = 'INVALID_OTP';
    }
    else error = 'UNAUTHORIZED';
  } else if (status === 404) {
    error = 'NOT_FOUND';
  } else if ([502, 503, 504].includes(status)) {
    error = 'UPSTREAM_ERROR';
  }

  return { status, error, message, details: body };
}

export const ngnzWithdrawalService = {
  /**
   * POST /withdraw
   * @param {{
   *   amount:number,
   *   destination:{bankName:string, bankCode:string, accountNumber:string, accountName:string},
   *   narration?:string,
   *   twoFactorCode:string,
   *   passwordpin:string  // exactly 6 digits
   * }} payload
   * @param {{ idempotencyKey?: string }} opts
   */
  async initiateWithdrawal(payload, opts = {}) {
    const path = paths.withdraw();
    const idempotencyKey = opts.idempotencyKey || genIdempotencyKey();

    // Avoid logging secrets
    const safePreview = {
      ...payload,
      twoFactorCode: payload?.twoFactorCode ? '[REDACTED]' : undefined,
      passwordpin: payload?.passwordpin ? '[REDACTED]' : undefined,
      destination: payload?.destination
        ? { ...payload.destination, accountNumber: payload.destination.accountNumber ? '****' : undefined }
        : undefined,
    };

    try {
      dbg('→ POST', path, { payload: safePreview, idempotencyKey });

      const res = await apiClient.post(path, payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });

      // Handle apiClient error response (when res.success === false)
      if (!res?.success) {
        // apiClient now returns { success: false, error: "...", status: 400, data: {...} } for error responses
        // The full error response body is in res.data
        const errorData = res?.data || {};
        // Extract error code from nested data structure: errorData.error or errorData.data?.error
        const errorCode = errorData?.error || errorData?.data?.error || res?.error || 'UNEXPECTED_RESPONSE';
        // Extract message from nested data structure: errorData.message or errorData.data?.message
        const message = errorData?.message || errorData?.data?.message || res?.error || 'Unexpected response from withdrawal endpoint';
        const status = res?.status || errorData?.status;
        
        dbg('❌ apiClient returned success=false', { error: errorCode, message, status, details: errorData });
        return {
          success: false,
          error: errorCode,
          message,
          details: errorData,
          status,
          idempotencyKey
        };
      }

      const data = res?.data || {};
      if (!data?.success) {
        const errorCode = data?.error || 'UNEXPECTED_RESPONSE';
        const message = data?.message || 'Unexpected response from withdrawal endpoint';
        dbg('❌ unexpected success=false shape', { error: errorCode, message, details: data });
        return {
          success: false,
          error: errorCode,
          message,
          details: data,
          idempotencyKey
        };
      }

      const normalized = normalizeWithdrawal(data?.data);
      dbg('← OK initiate', { ...normalized, destination: { ...normalized.destination, accountNumber: '****' } });

      return {
        success: true,
        data: normalized,
        message: data?.message || 'NGNZ withdrawal processed successfully',
        idempotencyKey
      };
    } catch (err) {
      const mapped = parseError(err);
      dbg('❌ POST failed', mapped);
      return { success: false, ...mapped, idempotencyKey };
    }
  },

  /**
   * GET /status/:withdrawalId
   */
  async getWithdrawalStatus(withdrawalId) {
    const path = paths.status(withdrawalId);
    try {
      dbg('→ GET', path);
      const res = await apiClient.get(path);
      const data = res?.data || {};

      if (!data?.success) {
        const errorCode = data?.error || 'UNEXPECTED_RESPONSE';
        const message = data?.message || 'Unexpected response from status endpoint';
        dbg('❌ unexpected success=false shape', { error: errorCode, message, details: data });
        return {
          success: false,
          error: errorCode,
          message,
          details: data
        };
      }

      const normalized = normalizeStatus(data?.data);
      dbg('← OK status', { ...normalized, destination: { ...normalized.destination, accountNumber: '****' } });

      return {
        success: true,
        data: normalized,
        message: data?.message || 'Withdrawal status retrieved'
      };
    } catch (err) {
      const mapped = parseError(err);
      dbg('❌ GET failed', mapped);
      return { success: false, ...mapped };
    }
  },
};
