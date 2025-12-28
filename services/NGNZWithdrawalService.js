import { apiClient } from './apiClient';

const DEBUG_NGNZ_WD = true;
const dbg = (...args) => { if (DEBUG_NGNZ_WD) console.log('[ngnzWithdrawalService]', ...args); };

const BASE_PATH = '/ngnz-withdrawal';

const paths = {
  withdraw: () => `${BASE_PATH}/withdraw`,
  status: (withdrawalId) => `${BASE_PATH}/status/${encodeURIComponent(withdrawalId)}`
};

/**
 * NEW: Standard UUID v4 Generator
 * Ensures consistency across your withdrawal services.
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeWithdrawal(data = {}) {
  return {
    withdrawalId: data?.withdrawalId || data?.reference || null,
    transactionId: data?.transactionId || null,
    correlationId: data?.correlationId || null,
    status: data?.status || null,
    amount: typeof data?.amount === 'number' ? data.amount : null,
    currency: data?.currency || 'NGNZ',
    destination: {
      bankName: data?.destination?.bankName || null,
      accountName: data?.destination?.accountName || null,
      accountNumber: data?.destination?.accountNumber || null,
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
    status: data?.status || null,
    amount: typeof data?.amount === 'number' ? data.amount : null,
    currency: data?.currency || 'NGNZ',
    destination: {
      bankName: data?.destination?.bankName || null,
      accountName: data?.destination?.accountName || null,
      accountNumber: data?.destination?.accountNumber || null,
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

  const errorText = (apiMsg || '').toLowerCase();

  if (status === 400) {
    if (code === 'LIMIT_EXCEEDED' || errorText.includes('limit exceeded')) error = 'LIMIT_EXCEEDED';
    if (code === '2FA_NOT_SETUP') error = '2FA_NOT_SETUP';
    else if (code === 'PIN_NOT_SETUP') error = 'PIN_NOT_SETUP';
    else if (errorText.includes('otp') || errorText.includes('verification code')) error = 'INVALID_OTP';
    else if (errorText.includes('pin') || errorText.includes('passwordpin')) error = 'INVALID_PASSWORDPIN';
    else if (errorText.includes('idempotency')) error = 'IDEMPOTENCY_ERROR';
    else error = 'VALIDATION_ERROR';
  } else if (status === 401) {
    if (errorText.includes('2fa') || errorText.includes('two-factor')) error = 'INVALID_2FA_CODE';
    else if (errorText.includes('pin') || errorText.includes('passwordpin')) error = 'INVALID_PASSWORDPIN';
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
   * Now attaches X-Idempotency-Key UUID automatically.
   */
  async initiateWithdrawal(payload, opts = {}) {
    const path = paths.withdraw();
    
    // ATTACH UUID FOR IDEMPOTENCY
    const idempotencyKey = opts.idempotencyKey || generateUUID();

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
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });

      if (!res?.success) {
        const errorData = res?.data || {};
        const errorCode = errorData?.error || errorData?.data?.error || res?.error || 'UNEXPECTED_RESPONSE';
        const message = errorData?.message || errorData?.data?.message || res?.error || 'Unexpected response';
        const status = res?.status || errorData?.status;
        
        return { success: false, error: errorCode, message, details: errorData, status, idempotencyKey };
      }

      const data = res?.data || {};
      if (!data?.success) {
        return { success: false, error: data?.error || 'UNEXPECTED_RESPONSE', message: data?.message || 'Unexpected response', idempotencyKey };
      }

      const normalized = normalizeWithdrawal(data?.data);
      dbg('← OK initiate', { ...normalized, destination: { ...normalized.destination, accountNumber: '****' } });

      return { success: true, data: normalized, message: data?.message || 'Success', idempotencyKey };
    } catch (err) {
      const mapped = parseError(err);
      return { success: false, ...mapped, idempotencyKey };
    }
  },

  async getWithdrawalStatus(withdrawalId) {
    const path = paths.status(withdrawalId);
    try {
      dbg('→ GET', path);
      const res = await apiClient.get(path);
      const data = res?.data || {};

      if (!data?.success) {
        return { success: false, error: data?.error || 'UNEXPECTED_RESPONSE', message: data?.message || 'Status retrieval failed' };
      }

      const normalized = normalizeStatus(data?.data);
      return { success: true, data: normalized, message: data?.message || 'Status retrieved' };
    } catch (err) {
      const mapped = parseError(err);
      return { success: false, ...mapped };
    }
  },
};