// services/userProfileService.js
import { apiClient } from './apiClient';

export const userProfileService = {
  /**
   * Fetch the authenticated user's profile
   * @param {{ signal?: AbortSignal }} [opts]
   * @returns {Promise<{success: boolean, data?: any, error?: string, message?: string, raw?: any}>}
   */
  async getProfile(opts = {}) {
    try {
      console.log('👤 Fetching user profile…');

      // Base URL in apiClient should already prefix with /api
      const resp = await apiClient.get('/profile/profile', { signal: opts.signal });

      // Your apiClient typically standardizes to { success, data }
      // But backend returns { success, profile }. Handle both safely.
      const payload = resp?.data ?? resp;
      const success = Boolean(payload?.success);

      if (!success) {
        const backendMsg = payload?.message || payload?.error || 'Failed to load profile';
        const code = this._codeFromMessage(backendMsg);
        console.log('❌ Profile fetch failed:', { code, backendMsg });
        return { success: false, error: code, message: backendMsg };
      }

      const serverProfile = payload?.data?.profile ?? payload?.profile ?? payload?.data ?? payload;
      const normalized = this._normalize(serverProfile);

      console.log('✅ Profile fetched:', {
        username: normalized.username,
        email: normalized.email,
      });

      return {
        success: true,
        data: normalized,
        raw: payload,
        message: payload?.message || 'Profile loaded',
      };
    } catch (error) {
      console.error('❌ Profile network/error:', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      // If backend sent structured error
      const errData = error?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData.error || errData.message);
        return {
          success: false,
          error: code,
          message: errData?.message || 'Failed to load profile',
        };
      }

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Unable to load profile. Check your connection.',
      };
    }
  },

  /**
   * Map server profile → app shape
   * Accepts either {username, fullName, email, phoneNumber, avatar:{url,lastUpdated}}
   * or {firstname, lastname, phonenumber, avatarUrl, avatarLastUpdated}
   * @param {any} p
   */
  _normalize(p = {}) {
    const first = p.firstname ?? p.firstName ?? null;
    const last = p.lastname ?? p.lastName ?? null;

    const fullName =
      p.fullName ||
      [first, last].filter(Boolean).join(' ').trim() ||
      null;

    const avatarUrl = p.avatar?.url ?? p.avatarUrl ?? null;
    const avatarLastUpdated = p.avatar?.lastUpdated ?? p.avatarLastUpdated ?? null;

    return {
      username: p.username ?? null,
      fullName,
      email: p.email ?? null,
      phoneNumber: p.phoneNumber ?? p.phonenumber ?? null,
      avatar: {
        url: avatarUrl,
        lastUpdated: avatarLastUpdated,
        // Helpful cache-buster for <Image/> e.g. `${url}?t=...`
        cacheKey: avatarLastUpdated ? String(new Date(avatarLastUpdated).getTime()) : null,
      },
      _original: p,
    };
  },

  /**
   * Generate a stable error code from backend text
   * @param {string} msg
   * @returns {string}
   */
  _codeFromMessage(msg = '') {
    const m = String(msg).toLowerCase();
    if (m.includes('unauthorized') || m.includes('invalid token')) return 'UNAUTHORIZED';
    if (m.includes('not found')) return 'USER_NOT_FOUND';
    if (m.includes('timeout')) return 'REQUEST_TIMEOUT';
    if (m.includes('server error') || m.includes('internal')) return 'SERVER_ERROR';
    return 'FETCH_FAILED';
  },

  /**
   * Optional: map error codes → user-friendly messages
   * @param {string} code
   * @param {string} [fallback]
   */
  getUserFriendlyMessage(code, fallback = 'Something went wrong') {
    const map = {
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      USER_NOT_FOUND: 'Profile not found.',
      REQUEST_TIMEOUT: 'Request timed out. Please try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NETWORK_ERROR: 'Network error. Check your connection.',
      FETCH_FAILED: 'Could not load your profile.',
    };
    return map[code] ?? fallback;
  },
};
