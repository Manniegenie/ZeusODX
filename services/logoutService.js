// services/logoutService.js
import { apiClient } from './apiClient';

function isOk(resp) {
  const status = resp?.status ?? resp?.data?.status;
  const success = resp?.data?.success;
  return (status >= 200 && status < 300) || status === 200 || success === true;
}

function normalizeMsg(v, fallback) {
  return (v && String(v)) || fallback;
}

function errorCodeFrom(status, message = '') {
  const m = String(message).toLowerCase();
  if (status === 400 || m.includes('required')) return 'MISSING_FIELDS';
  if (status === 404 || m.includes('not found')) return 'NOT_FOUND';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 500 || m.includes('server error')) return 'SERVER_ERROR';
  if (status === 503 || m.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
  return 'FETCH_FAILED';
}

export const logoutService = {
  /**
   * Logout user by removing refresh token.
   * @param {{ userId: string, refreshToken: string, signal?: AbortSignal }} params
   * @returns {Promise<{success:boolean, message:string, error?:string, status?:number}>}
   */
  async logout({ userId, refreshToken, signal } = {}) {
    if (!userId || !refreshToken) {
      return {
        success: false,
        error: 'MISSING_FIELDS',
        message: 'userId and refreshToken are required.',
      };
    }

    try {
      const resp = await apiClient.post(
        '/logout',
        { userId, refreshToken },
        { signal }
      );

      if (!isOk(resp)) {
        const msg = normalizeMsg(resp?.data?.message, 'Logout failed');
        return {
          success: false,
          error: errorCodeFrom(resp?.status, msg),
          message: msg,
          status: resp?.status,
        };
      }

      return {
        success: true,
        message: normalizeMsg(resp?.data?.message, 'Logged out successfully.'),
      };
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (err?.request ? 'Network error during logout.' : 'Server error during logout.');
      return {
        success: false,
        error: errorCodeFrom(status, msg),
        message: msg,
        status,
      };
    }
  },
};

export default logoutService;
