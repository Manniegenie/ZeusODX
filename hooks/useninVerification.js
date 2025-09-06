// hooks/useNINVerification.js
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ninVerificationService } from '../services/ninVerificationService';

/**
 * Hook for NIN verification management and status tracking.
 * 
 * Usage:
 * const {
 *   // Submission state
 *   submitting, submitError, submitSuccess,
 *   
 *   // Status state
 *   loading, error, verificationStatus,
 *   
 *   // Computed values
 *   canSubmit, statusMessage, level2Progress,
 *   isPhoneVerified, isEmailVerified, isNINSubmitted, isNINApproved,
 *   kycLevel, kycStatus, limits,
 *   
 *   // Methods
 *   submitNIN, getStatus, validateForm,
 *   refresh, startPolling, stopPolling,
 *   
 *   // Test data (development only)
 *   testData, loadTestData
 * } = useNINVerification({ autoFetch: true, pollMs: 30000 });
 */
export const useNINVerification = (options = {}) => {
  const { autoFetch = true, pollMs = null } = options;

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Test data state
  const [testData, setTestData] = useState(null);

  const intervalRef = useRef(null);

  // -------- STATUS FETCHING --------
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ninVerificationService.getVerificationStatus();
      
      if (result.success) {
        setVerificationStatus(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch verification status');
        setVerificationStatus(null);
      }
      
      return result;
    } catch (e) {
      const msg = e?.message || 'Network error fetching verification status';
      setError(msg);
      setVerificationStatus(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatus = useCallback(() => fetchStatus(), [fetchStatus]);
  const refresh = useCallback(() => fetchStatus(), [fetchStatus]);

  // -------- POLLING --------
  const startPolling = useCallback((intervalMs = (typeof pollMs === 'number' ? pollMs : 30000)) => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => { fetchStatus(); }, intervalMs);
  }, [fetchStatus, pollMs]);

  const stopPolling = useCallback(() => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // -------- NIN SUBMISSION --------
  const submitNIN = useCallback(async (ninData) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Validate form first
      const validation = ninVerificationService.validateNINForm(ninData);
      if (!validation.valid) {
        setSubmitError('Please fix validation errors');
        return { success: false, errors: validation.errors };
      }

      const result = await ninVerificationService.submitVerification(ninData);
      
      if (result.success) {
        setSubmitSuccess(true);
        setSubmitError(null);
        
        // Refresh status after successful submission
        setTimeout(() => {
          fetchStatus();
        }, 1000);
        
        return { success: true, data: result.data };
      } else {
        setSubmitError(result.message || 'Failed to submit NIN verification');
        setSubmitSuccess(false);
        return { success: false, error: result.error, message: result.message };
      }
    } catch (e) {
      const msg = e?.message || 'Network error submitting NIN verification';
      setSubmitError(msg);
      setSubmitSuccess(false);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setSubmitting(false);
    }
  }, [fetchStatus]);

  // -------- VALIDATION --------
  const validateForm = useCallback((formData) => {
    return ninVerificationService.validateNINForm(formData);
  }, []);

  const validateNIN = useCallback((nin) => {
    return ninVerificationService.validateNIN(nin);
  }, []);

  const validateDateOfBirth = useCallback((dob) => {
    return ninVerificationService.validateDateOfBirth(dob);
  }, []);

  // -------- TEST DATA --------
  const loadTestData = useCallback(async () => {
    try {
      const result = await ninVerificationService.getTestData();
      if (result.success) {
        setTestData(result.data);
      }
      return result;
    } catch (e) {
      return { success: false, error: 'NETWORK_ERROR', message: e?.message || 'Failed to load test data' };
    }
  }, []);

  // -------- AUTO-FETCH AND POLLING --------
  useEffect(() => {
    if (autoFetch) fetchStatus();
  }, [autoFetch, fetchStatus]);

  useEffect(() => {
    if (autoFetch && typeof pollMs === 'number' && pollMs > 0) {
      startPolling(pollMs);
      return () => stopPolling();
    }
    return undefined;
  }, [autoFetch, pollMs, startPolling, stopPolling]);

  // -------- COMPUTED VALUES --------
  
  // Basic status flags
  const isPhoneVerified = useMemo(() => {
    return verificationStatus?.level1?.phoneVerified === true;
  }, [verificationStatus]);

  const isEmailVerified = useMemo(() => {
    return verificationStatus?.level2?.emailVerified === true;
  }, [verificationStatus]);

  const isNINSubmitted = useMemo(() => {
    return verificationStatus?.level2?.documentSubmitted === true;
  }, [verificationStatus]);

  const isNINApproved = useMemo(() => {
    return verificationStatus?.level2?.status === 'approved';
  }, [verificationStatus]);

  const isNINPending = useMemo(() => {
    return verificationStatus?.level2?.status === 'pending';
  }, [verificationStatus]);

  const isNINRejected = useMemo(() => {
    return verificationStatus?.level2?.status === 'rejected';
  }, [verificationStatus]);

  const isUnderReview = useMemo(() => {
    return verificationStatus?.level2?.status === 'under_review';
  }, [verificationStatus]);

  // KYC level and status
  const kycLevel = useMemo(() => {
    return verificationStatus?.kycLevel || 0;
  }, [verificationStatus]);

  const kycStatus = useMemo(() => {
    return verificationStatus?.kycStatus || 'not_verified';
  }, [verificationStatus]);

  // Transaction limits
  const limits = useMemo(() => {
    return verificationStatus?.limits || {
      ngnb: { daily: 0, monthly: 0 },
      crypto: { daily: 0, monthly: 0 },
      utilities: { daily: 0, monthly: 0 }
    };
  }, [verificationStatus]);

  // Can submit check
  const canSubmit = useMemo(() => {
    return ninVerificationService.canSubmitVerification(verificationStatus);
  }, [verificationStatus]);

  // Status message
  const statusMessage = useMemo(() => {
    return ninVerificationService.getStatusMessage(verificationStatus);
  }, [verificationStatus]);

  // Level 2 progress
  const level2Progress = useMemo(() => {
    return ninVerificationService.getLevel2Progress(verificationStatus);
  }, [verificationStatus]);

  // Detailed verification breakdown
  const verificationBreakdown = useMemo(() => {
    if (!verificationStatus) return null;

    return {
      level1: {
        phoneVerified: isPhoneVerified,
        status: verificationStatus.level1?.status || 'not_submitted',
        verifiedAt: verificationStatus.level1?.verifiedAt
      },
      level2: {
        emailVerified: isEmailVerified,
        documentSubmitted: isNINSubmitted,
        documentType: verificationStatus.level2?.documentType,
        status: verificationStatus.level2?.status || 'not_submitted',
        submittedAt: verificationStatus.level2?.submittedAt,
        approvedAt: verificationStatus.level2?.approvedAt,
        rejectedAt: verificationStatus.level2?.rejectedAt,
        rejectionReason: verificationStatus.level2?.rejectionReason
      },
      overall: {
        kycLevel,
        kycStatus,
        progress: level2Progress,
        canSubmit,
        statusMessage
      }
    };
  }, [verificationStatus, isPhoneVerified, isEmailVerified, isNINSubmitted, kycLevel, kycStatus, level2Progress, canSubmit, statusMessage]);

  // Level completion flags
  const isLevel1Complete = useMemo(() => kycLevel >= 1, [kycLevel]);
  const isLevel2Complete = useMemo(() => kycLevel >= 2, [kycLevel]);
  const isLevel3Complete = useMemo(() => kycLevel >= 3, [kycLevel]);

  // Clear submit success after some time
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  return {
    // Submission state
    submitting,
    submitError,
    submitSuccess,

    // Status state
    loading,
    error,
    verificationStatus,

    // Computed values - basic flags
    isPhoneVerified,
    isEmailVerified,
    isNINSubmitted,
    isNINApproved,
    isNINPending,
    isNINRejected,
    isUnderReview,

    // Computed values - KYC info
    kycLevel,
    kycStatus,
    limits,
    canSubmit,
    statusMessage,
    level2Progress,

    // Computed values - level completion
    isLevel1Complete,
    isLevel2Complete,
    isLevel3Complete,

    // Detailed breakdown
    verificationBreakdown,

    // Methods - submission
    submitNIN,
    validateNIN,

    // Methods - status
    getStatus,
    refresh,
    startPolling,
    stopPolling,

    // Test data (development)
    testData,
    loadTestData,

    // Raw service access (for advanced usage)
    service: ninVerificationService
  };
};