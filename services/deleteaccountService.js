// services/accountDeletionService.js
import { apiClient } from './apiClient';

export const accountDeletionService = {
  /**
   * Initiate deletion (schedules if no funds)
   * POST /account-deletion/initiate
   * @param {{ signal?: AbortSignal }} [opts]
   */
  async initiate(opts = {}) {
    try {
      console.log('🧨 Initiating account deletion…');
      const resp = await apiClient.post('/delete-account/initiate', {}, { signal: opts.signal });
      const payload = resp?.data ?? resp;

      if (resp.status !== 200) {
        const code = this._codeFromMessage(payload?.message || payload?.error);
        return { success: false, error: code, message: payload?.message || 'Failed to initiate deletion' };
      }

      const data = this._normalizeSchedule(payload);
      console.log('✅ Deletion scheduled?', { when: data.scheduledDeletionDate, fundsBlocked: payload?.fundsAvailable });
      return { success: true, data, message: payload?.message || 'Account scheduled for deletion' };
    } catch (error) {
      console.error('❌ Initiate deletion error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const errData = error?.response?.data;
      if (errData) {
        // Funds present branch returns details from server
        const msg = String(errData?.message || errData?.error || '');
        const code = this._codeFromMessage(msg);
        return {
          success: false,
          error: code,
          message: errData?.message || 'Failed to initiate deletion',
          data: (code === 'FUNDS_PRESENT') ? { fundsAvailable: true, fundDetails: errData?.fundDetails || {} } : undefined,
        };
      }
      return { success: false, error: 'NETWORK_ERROR', message: 'Network error. Check your connection.' };
    }
  },

  /**
   * Finalize (kept for compatibility; server still re-checks funds and schedules)
   * POST /account-deletion/delete
   * @param {{ signal?: AbortSignal }} [opts]
   */
  async finalize(opts = {}) {
    try {
      console.log('🧹 Finalizing account deletion…');
      const resp = await apiClient.post('/delete-account/delete', {}, { signal: opts.signal });
      const payload = resp?.data ?? resp;

      if (resp.status !== 200) {
        const code = this._codeFromMessage(payload?.message || payload?.error);
        return { success: false, error: code, message: payload?.message || 'Failed to schedule deletion' };
      }

      const data = this._normalizeSchedule(payload);
      console.log('✅ Account scheduled for deletion:', { when: data.scheduledDeletionDate });
      return { success: true, data, message: payload?.message || 'Account scheduled for deletion' };
    } catch (error) {
      console.error('❌ Finalize deletion error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const errData = error?.response?.data;
      if (errData) {
        const msg = String(errData?.message || errData?.error || '');
        const code = this._codeFromMessage(msg);
        return {
          success: false,
          error: code,
          message: errData?.message || 'Failed to schedule deletion',
          data: (code === 'FUNDS_PRESENT') ? { fundsAvailable: true, fundDetails: errData?.fundDetails || {} } : undefined,
        };
      }
      return { success: false, error: 'NETWORK_ERROR', message: 'Network error. Check your connection.' };
    }
  },

  // ===== Helpers =====
  _normalizeSchedule(payload = {}) {
    const date = payload?.scheduledDeletionDate ? new Date(payload.scheduledDeletionDate) : null;
    return {
      scheduledDeletionDate: date ? date.toISOString() : null,
      note: payload?.note || '',
    };
  },

  _codeFromMessage(msg = '') {
    const m = String(msg).toLowerCase().trim();
    if (m.includes('cannot delete account with remaining funds')) return 'FUNDS_PRESENT';
    if (m.includes('no pending account deletion')) return 'NO_PENDING_REQUEST';
    if (m.includes('unauthorized') || m.includes('invalid token')) return 'UNAUTHORIZED';
    if (m.includes('server error') || m.includes('internal')) return 'SERVER_ERROR';
    return 'REQUEST_FAILED';
  },

  getUserFriendlyMessage(code, fallback = 'Something went wrong') {
    const map = {
      FUNDS_PRESENT: 'You still have funds. Please withdraw them before deleting your account.',
      NO_PENDING_REQUEST: 'No pending deletion request. Start by initiating account deletion.',
      UNAUTHORIZED: 'Your session expired. Please log in again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NETWORK_ERROR: 'Network error. Check your connection.',
      REQUEST_FAILED: 'Could not complete the request.',
    };
    return map[code] ?? fallback;
  },
};
