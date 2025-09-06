// services/verificationService.js
import { apiClient } from './apiClient';

const DEBUG_VERIFICATION = true;
const dbg = (...args) => { if (DEBUG_VERIFICATION) console.log('[verificationService]', ...args); };

export const verificationService = {
  /**
   * Fetch verification status from your API.
   * Now handles granular steps and overall progress from backend.
   */
  async getStatus() {
    try {
      const path = '/verification/status';
      dbg('GET', path);

      const response = await apiClient.get(path);
      const data = response?.data || {};

      const hasShape = !!(data?.fiatVerification && data?.kycVerification);
      if (!hasShape) {
        dbg('❌ Unexpected response shape:', data);
        return {
          success: false,
          error: 'UNEXPECTED_RESPONSE',
          message: 'Unexpected response shape from verification-status endpoint',
        };
      }

      // Map with safe numbers; include steps/completed exactly as delivered
      const fiatRaw = data.fiatVerification;
      const kycRaw  = data.kycVerification;
      const overallRaw = data.overallProgress;

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

      // Overall progress from backend
      const overall = overallRaw ? {
        totalSteps: Number(overallRaw.totalSteps ?? 0),
        completedSteps: Number(overallRaw.completedSteps ?? 0),
        percentage: Number(overallRaw.percentage ?? 0),
      } : null;

      // Enhanced debugging for granular steps
      if (DEBUG_VERIFICATION) {
        dbg('← status', { fiat, kyc, overall });
        dbg('Overall progress:', overall?.percentage + '% (' + overall?.completedSteps + '/' + overall?.totalSteps + ')');
        dbg('Fiat completed steps:', fiat.completed);
        dbg('KYC completed steps:', kyc.completed);
        dbg('KYC steps detail:', kyc.steps.map(s => `${s.id}: ${s.completed ? '✅' : '❌'} (${s.status || 'unknown'})`));
        dbg('Fiat steps detail:', fiat.steps.map(s => `${s.id}: ${s.completed ? '✅' : '❌'}`));
      }

      return {
        success: true,
        data: { fiat, kyc, overall },
        raw: data,
        message: 'Verification status retrieved',
      };
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
      dbg('❌ GET failed:', errorMsg);
      
      return {
        success: false,
        error: err?.response?.status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR',
        message: err?.response?.status === 401 ? 'Authentication required' : 'Failed to fetch verification status',
        details: errorMsg,
      };
    }
  },

  /**
   * Helper method to check if a specific verification step is completed
   */
  isStepCompleted(verificationData, stepId) {
    if (!verificationData || !Array.isArray(verificationData.completed)) {
      return false;
    }
    return verificationData.completed.includes(stepId);
  },

  /**
   * Helper method to get step details by ID
   */
  getStepDetails(verificationData, stepId) {
    if (!verificationData || !Array.isArray(verificationData.steps)) {
      return null;
    }
    return verificationData.steps.find(step => step.id === stepId) || null;
  },

  /**
   * Helper method to calculate KYC2-specific progress (email + identity only)
   */
  getKyc2Progress(kycData) {
    if (!kycData || !Array.isArray(kycData.steps)) {
      return { totalSteps: 0, completedSteps: 0, percentage: 0 };
    }

    const kyc2Steps = kycData.steps.filter(step => 
      step.id === 'email' || step.id === 'identity'
    );
    
    const completedCount = kyc2Steps.filter(step => step.completed).length;
    const totalCount = kyc2Steps.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalSteps: totalCount,
      completedSteps: completedCount,
      percentage: percentage,
      steps: kyc2Steps
    };
  },

  /**
   * Helper method to calculate KYC3-specific progress (address only)
   */
  getKyc3Progress(kycData) {
    if (!kycData || !Array.isArray(kycData.steps)) {
      return { totalSteps: 0, completedSteps: 0, percentage: 0 };
    }

    const kyc3Steps = kycData.steps.filter(step => step.id === 'address');
    const completedCount = kyc3Steps.filter(step => step.completed).length;
    const totalCount = kyc3Steps.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalSteps: totalCount,
      completedSteps: completedCount,
      percentage: percentage,
      steps: kyc3Steps
    };
  }
};