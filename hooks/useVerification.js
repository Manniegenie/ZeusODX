// hooks/useVerificationStatus.js
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { verificationService } from '../services/VerificationService';

/**
 * Updated hook for granular verification status tracking.
 * Now includes KYC2-specific progress and overall progress from backend.
 * 
 * Usage:
 * const {
 *   loading, error,
 *   fiat, kyc, overall, kyc2Progress,
 *   isFiatComplete, isKycComplete, isFullyVerified,
 *   // Fiat steps
 *   hasBankAccount, bvnVerified,
 *   // KYC granular steps
 *   emailVerified, identityVerified, addressVerified,
 *   // KYC level helpers
 *   level2Approved, level3Approved,
 *   refresh, startPolling, stopPolling
 * } = useVerificationStatus({ autoFetch: true, pollMs: 15000 });
 */
export const useVerificationStatus = (options = {}) => {
  const { autoFetch = true, pollMs = null } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fiat, setFiat] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [overall, setOverall] = useState(null);

  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verificationService.getStatus();
      if (result.success) {
        const { data } = result;
        setFiat(data.fiat || { totalSteps: 0, completedSteps: 0, percentage: 0, steps: [], completed: [] });
        setKyc(data.kyc || { totalSteps: 0, completedSteps: 0, percentage: 0, steps: [], completed: [] });
        setOverall(data.overall || { totalSteps: 0, completedSteps: 0, percentage: 0 });
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch verification status');
        setFiat(null);
        setKyc(null);
        setOverall(null);
      }
      return result;
    } catch (e) {
      const msg = e?.message || 'Network error fetching verification status';
      setError(msg);
      setFiat(null);
      setKyc(null);
      setOverall(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchStatus(), [fetchStatus]);

  const startPolling = useCallback((intervalMs = (typeof pollMs === 'number' ? pollMs : 10000)) => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => { fetchStatus(); }, intervalMs);
  }, [fetchStatus, pollMs]);

  const stopPolling = useCallback(() => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

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

  // -------- KYC2-specific progress (email + identity only) --------
  const kyc2Progress = useMemo(() => {
    return verificationService.getKyc2Progress(kyc);
  }, [kyc]);

  // -------- KYC3-specific progress (address only) --------
  const kyc3Progress = useMemo(() => {
    return verificationService.getKyc3Progress(kyc);
  }, [kyc]);

  // -------- Derived completion flags --------
  const isFiatComplete = !!fiat && fiat.percentage === 100;
  const isKycComplete = !!kyc && kyc.percentage === 100;
  const isFullyVerified = isFiatComplete && isKycComplete;

  // -------- FIAT STEP HELPERS --------
  const hasBankAccount = useMemo(() => {
    if (!fiat) return false;
    if (Array.isArray(fiat.completed) && fiat.completed.includes('bank_account')) return true;
    const step = (fiat.steps || []).find(s => s.id === 'bank_account');
    return !!step?.completed;
  }, [fiat]);

  const bvnVerified = useMemo(() => {
    if (!fiat) return false;
    if (Array.isArray(fiat.completed) && fiat.completed.includes('bvn')) return true;
    const step = (fiat.steps || []).find(s => s.id === 'bvn');
    return !!step?.completed;
  }, [fiat]);

  // -------- KYC GRANULAR STEP HELPERS --------
  const emailVerified = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('email')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'email');
    return !!step?.completed;
  }, [kyc]);

  const identityVerified = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('identity')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'identity');
    return !!step?.completed;
  }, [kyc]);

  const addressVerified = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('address')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'address');
    return !!step?.completed;
  }, [kyc]);

  // -------- KYC LEVEL HELPERS --------
  const level2Approved = useMemo(() => {
    // Level 2 is complete when both email and identity are verified
    return emailVerified && identityVerified;
  }, [emailVerified, identityVerified]);

  const level3Approved = useMemo(() => {
    // Level 3 is complete when address is verified
    return addressVerified;
  }, [addressVerified]);

  // -------- STEP DETAIL HELPERS --------
  const getStepDetails = useCallback((stepId) => {
    // Check KYC steps first
    const kycStep = (kyc?.steps || []).find(s => s.id === stepId);
    if (kycStep) return { ...kycStep, category: 'kyc' };
    
    // Check fiat steps
    const fiatStep = (fiat?.steps || []).find(s => s.id === stepId);
    if (fiatStep) return { ...fiatStep, category: 'fiat' };
    
    return null;
  }, [kyc, fiat]);

  const getStepStatus = useCallback((stepId) => {
    const step = getStepDetails(stepId);
    return step?.status || 'not_submitted';
  }, [getStepDetails]);

  return {
    loading,
    error,

    // Raw sections from service
    fiat,
    kyc,
    overall, // Overall progress from backend

    // KYC-specific progress calculations
    kyc2Progress, // Only email + identity (for KYC2 screen)
    kyc3Progress, // Only address (for KYC3 screen)

    // Completion flags
    isFiatComplete,
    isKycComplete,
    isFullyVerified,

    // Fiat step flags
    hasBankAccount,
    bvnVerified,

    // KYC granular step flags
    emailVerified,
    identityVerified,
    addressVerified,

    // KYC level flags
    level2Approved,
    level3Approved,

    // Helper methods
    getStepDetails,
    getStepStatus,

    // Controls
    refresh,
    startPolling,
    stopPolling,
  };
};