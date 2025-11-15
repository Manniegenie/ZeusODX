import { apiClient } from './apiClient';

/**
 * User Profile Service
 * Handles all profile-related API interactions
 */
export const userProfileService = {
  /**
   * Fetch the authenticated user's profile
   * @param {{ signal?: AbortSignal }} [opts] - Request options
   * @returns {Promise<{success: boolean, data?: any, error?: string, message?: string}>}
   */
  async getProfile(opts = {}) {
    try {
      const requestOptions = opts.signal ? { signal: opts.signal } : {};
      const resp = await apiClient.get('/profile/profile/complete', requestOptions);

      const payload = resp?.data ?? resp;
      const success = Boolean(payload?.success);

      if (!success) {
        const backendMsg = payload?.message || payload?.error || 'Failed to load profile';
        const code = this._codeFromMessage(backendMsg);
        return { 
          success: false, 
          error: code, 
          message: backendMsg 
        };
      }

      // Extract profile from response (handles both response formats)
      const serverProfile = payload?.data?.profile ?? payload?.profile ?? payload?.data ?? payload;
      
      if (!serverProfile || (typeof serverProfile === 'object' && Object.keys(serverProfile).length === 0)) {
        return {
          success: false,
          error: 'EMPTY_PROFILE',
          message: 'Profile data is empty',
        };
      }

      const normalized = this._normalize(serverProfile);

      return {
        success: true,
        data: normalized,
        message: payload?.message || 'Profile loaded successfully',
      };
    } catch (error) {
      // Handle AbortError (cancelled request)
      if (error?.name === 'AbortError') {
        return {
          success: false,
          error: 'CANCELLED',
          message: 'Request was cancelled',
        };
      }

      // Handle API error responses
      const errData = error?.response?.data;
      if (errData) {
        const code = this._codeFromMessage(errData.error || errData.message);
        return {
          success: false,
          error: code,
          message: errData?.message || 'Failed to load profile',
        };
      }

      // Network or other errors
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Unable to load profile. Check your connection.',
      };
    }
  },

  /**
   * Normalize server profile data to app format
   * @param {any} p - Server profile object
   * @returns {Object} Normalized profile
   */
  _normalize(p = {}) {
    const first = p.firstname ?? p.firstName ?? null;
    const last = p.lastname ?? p.lastName ?? null;
    const fullName = p.fullName || [first, last].filter(Boolean).join(' ').trim() || null;
    const avatarUrl = p.avatar?.url ?? p.avatarUrl ?? null;
    const avatarLastUpdated = p.avatar?.lastUpdated ?? p.avatarLastUpdated ?? null;

    // Extract KYC information
    const kycData = p.kyc || {};
    const kycLevel = p.kycLevel ?? kycData.level ?? 0;
    const kycStatus = p.kycStatus ?? kycData.status ?? 'not_verified';
    const isKycActive = kycData.isActive ?? (kycLevel > 0 && kycStatus === 'approved');

    return {
      username: p.username ?? null,
      fullName,
      email: p.email ?? null,
      phoneNumber: p.phoneNumber ?? p.phonenumber ?? null,
      is2FAEnabled: Boolean(p.is2FAEnabled),
      avatar: {
        url: avatarUrl,
        lastUpdated: avatarLastUpdated,
        cacheKey: avatarLastUpdated ? String(new Date(avatarLastUpdated).getTime()) : null,
      },
      kyc: {
        level: kycLevel,
        status: kycStatus,
        isActive: isKycActive,
        level1: kycData.level1 || null,
        level2: kycData.level2 || null,
      },
    };
  },

  /**
   * Extract error code from error message
   * @param {string} msg - Error message
   * @returns {string} Error code
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
   * Get user-friendly error message
   * @param {string} code - Error code
   * @param {string} fallback - Fallback message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(code, fallback = 'Something went wrong') {
    const map = {
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      USER_NOT_FOUND: 'Profile not found.',
      REQUEST_TIMEOUT: 'Request timed out. Please try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NETWORK_ERROR: 'Network error. Check your connection.',
      FETCH_FAILED: 'Could not load your profile.',
      CANCELLED: 'Request was cancelled.',
      EMPTY_PROFILE: 'Profile data is empty.',
    };
    return map[code] ?? fallback;
  },
};
