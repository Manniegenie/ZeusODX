// services/bankAccountsService.js
import { apiClient } from './apiClient';

export const bankAccountsService = {
  /**
   * List user's active bank accounts + summary
   * @param {{ signal?: AbortSignal }} [opts]
   */
  async list(opts = {}) {
    try {
      console.log('🏦 Fetching bank accounts…');
      const resp = await apiClient.get('/bank/bank-accounts', { signal: opts.signal });
      const payload = resp?.data ?? resp;

      if (!payload?.success) {
        const msg = payload?.message || payload?.error || 'Failed to load bank accounts';
        const code = this._codeFromMessage(msg);
        console.log('❌ Bank accounts fetch failed:', { code, msg });
        return { success: false, error: code, message: msg };
      }

      const data = payload?.data ?? {};
      const normalized = this._normalizeList(data);

      console.log('✅ Bank accounts fetched:', {
        count: normalized.summary.totalAccounts,
        canAddMore: normalized.summary.canAddMore,
      });

      return { success: true, data: normalized, raw: payload };
    } catch (error) {
      console.error('❌ Bank accounts network/error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const errData = error?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData?.message || errData?.error);
        return { success: false, error: code, message: errData?.message || 'Failed to load bank accounts' };
      }

      return { success: false, error: 'NETWORK_ERROR', message: 'Unable to load bank accounts. Check your connection.' };
    }
  },

  /**
   * Add a new bank account
   * @param {{ accountNumber: string, bankName: string, accountName: string, signal?: AbortSignal }} body
   */
  async add({ accountNumber, bankName, accountName, signal } = {}) {
    try {
      console.log('➕ Adding bank account…', { bankName, accountName });

      const resp = await apiClient.post('/user/bank-accounts', {
        accountNumber,
        bankName: bankName?.trim(),
        accountName: accountName?.trim(),
      }, { signal });

      const payload = resp?.data ?? resp;
      if (!payload?.success) {
        const msg = payload?.message || payload?.error || 'Failed to add bank account';
        const code = this._codeFromMessage(msg);
        return { success: false, error: code, message: msg };
      }

      const added = payload?.data?.bankAccount ?? payload?.data ?? payload?.bankAccount;
      const normalized = this._normalizeAccount(added);

      console.log('✅ Bank account added:', { id: normalized.id, bankName: normalized.bankName });
      return { success: true, data: normalized, message: payload?.message || 'Bank account added successfully' };
    } catch (error) {
      console.error('❌ Add bank account error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const errData = error?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData?.message || errData?.error);
        return { success: false, error: code, message: errData?.message || 'Failed to add bank account' };
      }

      return { success: false, error: 'NETWORK_ERROR', message: 'Unable to add bank account. Check your connection.' };
    }
  },

  /**
   * Delete a bank account (JSON body)
   * @param {{ accountId: string, signal?: AbortSignal }} params
   */
  async remove({ accountId, signal } = {}) {
    try {
      console.log('🗑️ Deleting bank account…', { accountId });

      // axios-style delete with body
      const resp = await apiClient.delete('/user/bank-accounts', { data: { accountId }, signal });
      const payload = resp?.data ?? resp;

      if (!payload?.success) {
        const msg = payload?.message || payload?.error || 'Failed to delete bank account';
        const code = this._codeFromMessage(msg);
        return { success: false, error: code, message: msg };
      }

      console.log('✅ Bank account deleted:', { accountId });
      return { success: true, data: { accountId }, message: payload?.message || 'Bank account deleted successfully' };
    } catch (error) {
      console.error('❌ Delete bank account error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const errData = error?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData?.message || errData?.error);
        return { success: false, error: code, message: errData?.message || 'Failed to delete bank account' };
      }

      return { success: false, error: 'NETWORK_ERROR', message: 'Unable to delete bank account. Check your connection.' };
    }
  },

  // ===== Helpers =====
  _normalizeList(data = {}) {
    const list = Array.isArray(data.bankAccounts) ? data.bankAccounts : [];
    return {
      bankAccounts: list.map(this._normalizeAccount),
      summary: {
        totalAccounts: data.summary?.totalAccounts ?? list.length,
        maxAllowed: data.summary?.maxAllowed ?? 10,
        canAddMore: Boolean(data.summary?.canAddMore ?? (list.length < (data.summary?.maxAllowed ?? 10))),
        remainingSlots:
          typeof data.summary?.remainingSlots === 'number'
            ? data.summary.remainingSlots
            : Math.max(0, (data.summary?.maxAllowed ?? 10) - (data.summary?.totalAccounts ?? list.length)),
      },
    };
  },

  _normalizeAccount(a = {}) {
    return {
      id: a.id ?? a._id ?? null,
      accountName: a.accountName ?? '',
      bankName: a.bankName ?? '',
      accountNumber: a.accountNumber ?? '',
      addedAt: a.addedAt ? new Date(a.addedAt).toISOString() : null,
      isVerified: Boolean(a.isVerified),
      isActive: Boolean(a.isActive ?? true),
    };
  },

  _codeFromMessage(msg = '') {
    const m = String(msg).toLowerCase().trim();
    if (m.includes('invalid token')) return 'UNAUTHORIZED';
    if (m.includes('user not found')) return 'USER_NOT_FOUND';
    if (m.includes('already exists') || m.includes('duplicate')) return 'DUPLICATE_ACCOUNT';
    if (m.includes('maximum') && m.includes('reached')) return 'MAX_LIMIT_REACHED';
    if (m.includes('required')) return 'MISSING_FIELDS';
    if (m.includes('between 8 and 20')) return 'INVALID_ACCOUNT_NUMBER_LENGTH';
    if (m.includes('timeout')) return 'REQUEST_TIMEOUT';
    if (m.includes('server error') || m.includes('internal')) return 'SERVER_ERROR';
    return 'FETCH_FAILED';
  },

  getUserFriendlyMessage(code, fallback = 'Something went wrong') {
    const map = {
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      USER_NOT_FOUND: 'User not found.',
      DUPLICATE_ACCOUNT: 'This account number is already added.',
      MAX_LIMIT_REACHED: 'You have reached the maximum number of bank accounts.',
      MISSING_FIELDS: 'Please fill in all required fields.',
      INVALID_ACCOUNT_NUMBER_LENGTH: 'Account number must be between 8 and 20 characters.',
      REQUEST_TIMEOUT: 'Request timed out. Please try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NETWORK_ERROR: 'Network error. Check your connection.',
      FETCH_FAILED: 'Could not complete the request.',
    };
    return map[code] ?? fallback;
  },

  // Optional UI helper
  maskAccountNumber(num = '') {
    const s = String(num);
    if (s.length < 4) return '****';
    return `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
  },
};
