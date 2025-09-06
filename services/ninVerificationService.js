// services/ninVerificationService.js
import { apiClient } from './apiClient';

const DEBUG_NIN = true;
const dbg = (...args) => { if (DEBUG_NIN) console.log('[ninVerificationService]', ...args); };

export const ninVerificationService = {
  /**
   * Submit NIN verification to backend
   */
  async submitVerification(ninData) {
    try {
      const path = '/kyc/verify-nin';
      dbg('POST', path, { nin: ninData.nin?.slice(0, 3) + '********' });

      const response = await apiClient.post(path, ninData);
      const data = response?.data || {};

      if (!data.success) {
        dbg('Submission failed:', data.message);
        return {
          success: false,
          error: 'SUBMISSION_FAILED',
          message: data.message || 'Failed to submit NIN verification',
        };
      }

      dbg('NIN verification submitted:', data.jobId);
      return {
        success: true,
        data: {
          jobId: data.jobId,
          status: data.status || 'pending',
          message: data.message
        },
        message: 'NIN verification submitted successfully',
      };

    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
      dbg('POST failed:', errorMsg);
      
      return {
        success: false,
        error: err?.response?.status === 400 ? 'VALIDATION_ERROR' : 
               err?.response?.status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR',
        message: errorMsg,
        details: err?.response?.data,
      };
    }
  },

  /**
   * Get NIN verification status
   */
  async getVerificationStatus() {
    try {
      const path = '/kyc/verification-status';
      dbg('GET', path);

      const response = await apiClient.get(path);
      const data = response?.data || {};

      if (!data.success) {
        dbg('Status fetch failed:', data.message);
        return {
          success: false,
          error: 'STATUS_FETCH_FAILED',
          message: data.message || 'Failed to fetch verification status',
        };
      }

      const verificationStatus = data.verificationStatus || {};
      
      const status = {
        kycLevel: Number(verificationStatus.kycLevel ?? 0),
        kycStatus: verificationStatus.kycStatus || 'not_verified',
        level1: verificationStatus.level1 || {},
        level2: verificationStatus.level2 || {},
        limits: verificationStatus.limits || {},
      };

      dbg('verification status', {
        kycLevel: status.kycLevel,
        kycStatus: status.kycStatus,
        level2Status: status.level2.status,
        emailVerified: status.level2.emailVerified,
        documentSubmitted: status.level2.documentSubmitted
      });

      return {
        success: true,
        data: status,
        raw: data,
        message: 'Verification status retrieved',
      };

    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
      dbg('GET status failed:', errorMsg);
      
      return {
        success: false,
        error: err?.response?.status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR',
        message: err?.response?.status === 401 ? 'Authentication required' : 'Failed to fetch verification status',
        details: errorMsg,
      };
    }
  },

  /**
   * Get test data for sandbox testing
   */
  async getTestData() {
    try {
      const path = '/kyc/test-data';
      dbg('GET', path);

      const response = await apiClient.get(path);
      const data = response?.data || {};

      if (!data.success) {
        return {
          success: false,
          error: 'TEST_DATA_FAILED',
          message: data.message || 'Failed to fetch test data',
        };
      }

      return {
        success: true,
        data: data.testData || {},
        message: 'Test data retrieved',
      };

    } catch (err) {
      if (err?.response?.status === 404) {
        return {
          success: false,
          error: 'NOT_AVAILABLE',
          message: 'Test data not available in production',
        };
      }

      const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to fetch test data',
        details: errorMsg,
      };
    }
  },

  /**
   * Validate NIN format client-side
   */
  validateNIN(nin) {
    if (!nin || typeof nin !== 'string') {
      return { valid: false, message: 'NIN is required' };
    }

    const cleanNin = nin.trim();
    
    if (cleanNin.length !== 11) {
      return { valid: false, message: 'NIN must be exactly 11 digits' };
    }

    if (!/^\d{11}$/.test(cleanNin)) {
      return { valid: false, message: 'NIN must contain only numbers' };
    }

    return { valid: true, message: 'Valid NIN format' };
  },

  /**
   * Helper to check if user can submit NIN verification
   */
  canSubmitVerification(verificationStatus) {
    if (!verificationStatus) return false;
    
    if (verificationStatus.kycLevel < 1) return false;
    
    if (!verificationStatus.level2?.emailVerified) return false;
    
    const level2Status = verificationStatus.level2?.status;
    if (level2Status === 'pending' || level2Status === 'approved') return false;
    
    return true;
  },

  /**
   * Get user-friendly status message
   */
  getStatusMessage(verificationStatus) {
    if (!verificationStatus) return 'Loading verification status...';
    
    const { kycLevel, level2 } = verificationStatus;
    
    if (kycLevel < 1) {
      return 'Please complete phone verification first';
    }
    
    if (!level2?.emailVerified) {
      return 'Please verify your email address first';
    }
    
    switch (level2?.status) {
      case 'pending':
        return 'NIN verification is being processed. This may take a few minutes.';
      case 'approved':
        return 'NIN verification completed successfully';
      case 'rejected':
        return level2?.rejectionReason || 'NIN verification was rejected. Please try again.';
      case 'under_review':
        return 'NIN verification is under manual review. We will notify you once complete.';
      default:
        return 'Ready to submit NIN verification';
    }
  },

  /**
   * Get progress percentage for Level 2 KYC
   */
  getLevel2Progress(verificationStatus) {
    if (!verificationStatus) return 0;
    
    let completed = 0;
    const total = 2;
    
    if (verificationStatus.level2?.emailVerified) completed++;
    if (verificationStatus.level2?.documentSubmitted && verificationStatus.level2?.status === 'approved') completed++;
    
    return Math.round((completed / total) * 100);
  },

  /**
   * Check if user has required profile data for NIN verification
   */
  hasRequiredProfile(verificationStatus) {
    // This would typically check if user has firstName/lastName
    // Since we're using backend profile data, this is handled server-side
    return true;
  },

  /**
   * Get eligibility status for NIN verification
   */
  getEligibilityStatus(verificationStatus) {
    if (!verificationStatus) {
      return {
        eligible: false,
        reason: 'Loading verification status...'
      };
    }

    if (verificationStatus.kycLevel < 1) {
      return {
        eligible: false,
        reason: 'Please complete phone verification first'
      };
    }

    if (!verificationStatus.level2?.emailVerified) {
      return {
        eligible: false,
        reason: 'Please verify your email address first'
      };
    }

    const level2Status = verificationStatus.level2?.status;
    
    if (level2Status === 'pending') {
      return {
        eligible: false,
        reason: 'NIN verification already in progress'
      };
    }

    if (level2Status === 'approved') {
      return {
        eligible: false,
        reason: 'NIN verification already completed'
      };
    }

    return {
      eligible: true,
      reason: 'Ready to submit NIN verification'
    };
  }
};