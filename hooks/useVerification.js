// hooks/useVerificationStatus.js
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
// NOTE: ensure path casing matches your file system
import { verificationService } from '../services/VerificationService';

/**
 * Usage:
 * const {
 *   loading, error,
 *   fiat, kyc, overall,
 *   isFiatComplete, isKycComplete, isFullyVerified,
 *   hasBankAccount, bvnVerified,
 *   level1Approved, level2Approved, level3Approved,
 *   refresh, startPolling, stopPolling
 * } = useVerificationStatus({ autoFetch: true, pollMs: 15000 });
 */
export const useVerificationStatus = (options = {}) => {
  const { autoFetch = true, pollMs = null } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [fiat, setFiat] = useState(null); // { totalSteps, completedSteps, percentage, steps[], completed[] }
  const [kyc,  setKyc]  = useState(null); // { totalSteps, completedSteps, percentage, steps[], completed[] }

  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verificationService.getStatus();
      if (result.success) {
        const { data } = result;
        setFiat(data.fiat || { totalSteps: 0, completedSteps: 0, percentage: 0, steps: [], completed: [] });
        setKyc(data.kyc   || { totalSteps: 0, completedSteps: 0, percentage: 0, steps: [], completed: [] });
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch verification status');
        setFiat(null);
        setKyc(null);
      }
      return result;
    } catch (e) {
      const msg = e?.message || 'Network error fetching verification status';
      setError(msg);
      setFiat(null);
      setKyc(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchStatus(), [fetchStatus]);

  const startPolling = useCallback((intervalMs = (typeof pollMs === 'number' ? pollMs : 10000)) => {
    if (intervalRef.current) return; // already polling
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

  // -------- Derived values --------
  const overall = useMemo(() => {
    const fTot = Number(fiat?.totalSteps || 0);
    const kTot = Number(kyc?.totalSteps || 0);
    const fCmp = Number(fiat?.completedSteps || 0);
    const kCmp = Number(kyc?.completedSteps || 0);

    const totalSteps = fTot + kTot;
    const completedSteps = fCmp + kCmp;
    const percentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return { totalSteps, completedSteps, percentage };
  }, [fiat, kyc]);

  const isFiatComplete  = !!fiat && fiat.percentage === 100;
  const isKycComplete   = !!kyc && kyc.percentage === 100;
  const isFullyVerified = isFiatComplete && isKycComplete;

  // Step-level helpers (use API’s completed list first; fallback to steps[])
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

  const level1Approved = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('level1')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'level1');
    return !!step?.completed;
  }, [kyc]);

  const level2Approved = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('level2')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'level2');
    return !!step?.completed;
  }, [kyc]);

  const level3Approved = useMemo(() => {
    if (!kyc) return false;
    if (Array.isArray(kyc.completed) && kyc.completed.includes('level3')) return true;
    const step = (kyc.steps || []).find(s => s.id === 'level3');
    return !!step?.completed;
  }, [kyc]);

  return {
    loading,
    error,

    // Raw sections from service (include steps/completed)
    fiat,
    kyc,

    // Derived
    overall,
    isFiatComplete,
    isKycComplete,
    isFullyVerified,

    // Convenient flags for UI
    hasBankAccount,
    bvnVerified,
    level1Approved,
    level2Approved,
    level3Approved,

    // Controls
    refresh,
    startPolling,
    stopPolling,
  };
};
