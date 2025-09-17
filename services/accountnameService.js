// services/obiexService.js
import { apiClient } from './apiClient';

/**
 * Obiex account resolution service
 * Endpoints used:
 *  - GET  /accountname/resolve?sortCode=...&accountNumber=...
 *  - POST /accountname/resolve-batch  { accounts: [{sortCode,accountNumber}, ...] }
 */
export const obiexService = {
  /**
   * Resolve single account name
   * @param {{ sortCode: string, accountNumber: string }} params
   * @param {{ signal?: AbortSignal }} [opts]
   * @returns {Promise<{ success:boolean, data?:any, error?:string, message?:string, raw?:any }>}
   */
  async resolveAccount(params = {}, opts = {}) {
    try {
      const { sortCode, accountNumber } = params || {};
      if (!sortCode || !accountNumber) {
        return { success: false, error: 'INVALID_PARAMS', message: 'sortCode and accountNumber are required' };
      }

      const qs = `?sortCode=${encodeURIComponent(String(sortCode))}&accountNumber=${encodeURIComponent(String(accountNumber))}`;
      // apiClient should already be configured to the API base (e.g., /api)
      const resp = await apiClient.get(`/accountname/resolve${qs}`, { signal: opts.signal });

      const payload = resp?.data ?? resp;
      const success = Boolean(payload?.success);

      if (!success) {
        const msg = payload?.message || payload?.error || 'Failed to resolve account';
        return { success: false, error: this._codeFromMessage(msg), message: msg, raw: payload };
      }

      const d = payload?.data ?? {};
      return { success: true, data: d, raw: payload, message: payload?.message || 'Account resolved' };
    } catch (err) {
      // network / axios error shape handling
      const errData = err?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData.message || errData.error);
        return { success: false, error: code, message: errData?.message || 'Obiex error', raw: errData };
      }
      return { success: false, error: 'NETWORK_ERROR', message: err?.message || 'Network error' };
    }
  },

  /**
   * Resolve multiple accounts in batch
   * @param {{ accounts: Array<{ sortCode: string, accountNumber: string }> }} body
   * @param {{ signal?: AbortSignal }} [opts]
   * @returns {Promise<{ success:boolean, data?:any, error?:string, message?:string, raw?:any }>}
   */
  async resolveBatch(body = {}, opts = {}) {
    try {
      const accounts = Array.isArray(body?.accounts) ? body.accounts : null;
      if (!accounts || accounts.length === 0) {
        return { success: false, error: 'INVALID_PARAMS', message: 'accounts must be a non-empty array' };
      }

      // POST body is { accounts: [...] }
      const resp = await apiClient.post('/accountname/resolve-batch', { accounts }, { signal: opts.signal });

      const payload = resp?.data ?? resp;
      const success = Boolean(payload?.success);

      if (!success) {
        const msg = payload?.message || 'Batch resolution failed';
        return { success: false, error: this._codeFromMessage(msg), message: msg, raw: payload };
      }

      // payload.data: { total, successful, failed, results }
      return { success: true, data: payload?.data ?? payload, raw: payload, message: payload?.message || 'Batch completed' };
    } catch (err) {
      const errData = err?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData.message || errData.error);
        return { success: false, error: code, message: errData?.message || 'Obiex error', raw: errData };
      }
      return { success: false, error: 'NETWORK_ERROR', message: err?.message || 'Network error' };
    }
  },

  /**
   * Basic mapping of backend text -> stable code
   * @param {string} msg
   */
  _codeFromMessage(msg = '') {
    const m = String(msg).toLowerCase();
    if (m.includes('invalid') && m.includes('sortcode')) return 'INVALID_SORTCODE';
    if (m.includes('invalid') && m.includes('accountnumber')) return 'INVALID_ACCOUNT_NUMBER';
    if (m.includes('sortcode') && m.includes('required')) return 'MISSING_SORTCODE';
    if (m.includes('accountnumber') && m.includes('required')) return 'MISSING_ACCOUNTNUMBER';
    if (m.includes('maximum') && m.includes('10')) return 'BATCH_SIZE_EXCEEDED';
    if (m.includes('not found') || m.includes('resolve failed')) return 'NOT_FOUND';
    if (m.includes('missing') && m.includes('api_key')) return 'CONFIG_MISSING';
    if (m.includes('timeout')) return 'REQUEST_TIMEOUT';
    if (m.includes('server error') || m.includes('internal')) return 'SERVER_ERROR';
    return 'REQUEST_FAILED';
  },

  /**
   * Optional user-friendly mapping
   * @param {string} code
   */
  getUserFriendlyMessage(code = 'REQUEST_FAILED') {
    const map = {
      INVALID_PARAMS: 'Invalid parameters sent.',
      INVALID_SORTCODE: 'Sort code is invalid.',
      INVALID_ACCOUNT_NUMBER: 'Account number is invalid.',
      MISSING_SORTCODE: 'Sort code is required.',
      MISSING_ACCOUNTNUMBER: 'Account number is required.',
      BATCH_SIZE_EXCEEDED: 'Too many accounts in batch (max 10).',
      NOT_FOUND: 'Account not found.',
      CONFIG_MISSING: 'Service configuration is missing.',
      REQUEST_TIMEOUT: 'Request timed out.',
      SERVER_ERROR: 'Server error. Try again later.',
      NETWORK_ERROR: 'Network error. Check your connection.',
      REQUEST_FAILED: 'Request failed.',
    };
    return map[code] || 'Something went wrong';
  }
};
