// services/verificationService.js
import { apiClient } from './apiClient';

const DEBUG_VERIFICATION = true;
const dbg = (...args) => { if (DEBUG_VERIFICATION) console.log('[verificationService]', ...args); };

export const verificationService = {
  /**
   * Fetch verification status from your API.
   * Passthrough of fiat/kyc objects INCLUDING steps/completed arrays.
   */
  async getStatus() {
    try {
      const path = '/verification/status';
      dbg('GET', path);

      const response = await apiClient.get(path);
      const data = response?.data || {};

      const hasShape = !!(data?.fiatVerification && data?.kycVerification);
      if (!hasShape) {
        return {
          success: false,
          error: 'UNEXPECTED_RESPONSE',
          message: 'Unexpected response shape from verification-status endpoint',
        };
      }

      // Map with safe numbers; include steps/completed exactly as delivered
      const fiatRaw = data.fiatVerification;
      const kycRaw  = data.kycVerification;

      const fiat = {
        totalSteps: Number(fiatRaw.totalSteps ?? 0),
        completedSteps: Number(fiatRaw.completedSteps ?? 0),
        percentage: Number(fiatRaw.percentage ?? 0),
        steps: Array.isArray(fiatRaw.steps) ? fiatRaw.steps : [],
        completed: Array.isArray(fiatRaw.completed) ? fiatRaw.completed : [],
      };

      const kyc = {
        totalSteps: Number(kycRaw.totalSteps ?? 0),
        completedSteps: Number(kycRaw.completedSteps ?? 0),
        percentage: Number(kycRaw.percentage ?? 0),
        steps: Array.isArray(kycRaw.steps) ? kycRaw.steps : [],
        completed: Array.isArray(kycRaw.completed) ? kycRaw.completed : [],
      };

      dbg('← status', { fiat, kyc });

      return {
        success: true,
        data: { fiat, kyc },   // keep service minimal; hook derives "overall"
        raw: data,
        message: 'Verification status retrieved',
      };
    } catch (err) {
      dbg('GET failed', err?.message || err);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to fetch verification status',
      };
    }
  },
};
