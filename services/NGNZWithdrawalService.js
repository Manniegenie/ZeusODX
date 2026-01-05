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
  const apiMsg = body?.message;

  let error = 'NETWORK_ERROR';
  let message = apiMsg || err?.message || 'Network error';

  if (status === 400) {
    if (code === '2FA_NOT_SETUP') error = '2FA_NOT_SETUP';
    else if (code === 'PIN_NOT_SETUP') error = 'PIN_NOT_SETUP';
    else error = 'VALIDATION_ERROR';
  } else if (status === 401) {
    if (code === 'INVALID_2FA_CODE') error = 'INVALID_2FA_CODE';
    else if (code === 'INVALID_PASSWORDPIN') error = 'INVALID_PASSWORDPIN';
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

      const data = res?.data || {};
      if (!data?.success) {
        dbg('❌ unexpected success=false shape', data);
        return {
          success: false,
          error: 'UNEXPECTED_RESPONSE',
          message: data?.message || 'Unexpected response from withdrawal endpoint',
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
        dbg('❌ unexpected success=false shape', data);
        return {
          success: false,
          error: 'UNEXPECTED_RESPONSE',
          message: data?.message || 'Unexpected response from status endpoint',
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
