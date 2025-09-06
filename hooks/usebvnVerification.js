// hooks/useBVNVerification.js
import { useCallback, useMemo, useState } from 'react';
import { kycService } from '../services/kycService';

const DEBUG_HOOK = true;
const dbg = (...args) => { if (DEBUG_HOOK) console.log('[useBVNVerification]', ...args); };

/**
 * Submit BVN (Enhanced KYC) and expose submission state.
 *
 * Usage:
 * const { loading, error, result, submit, reset } = useBVNVerification();
 * await submit({ bvn: '12345678901', firstName: 'Ada', lastName: 'Obi' });
 */
export const useBVNVerification = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    dbg('submit', payload);
    try {
      const res = await kycService.verifyBVN(payload);
      if (res.success) {
        setResult(res.data);
        dbg('✓ success', res.data);
        return { success: true, data: res.data, raw: res.raw };
      } else {
        setError(res.message || 'BVN verification failed');
        dbg('❌ failed', res);
        return { success: false, error: res.error, message: res.message, details: res.details };
      }
    } catch (e) {
      const msg = e?.message || 'Network error';
      setError(msg);
      dbg('❌ exception', msg);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const statusText = useMemo(() => {
    if (!result) return null;
    const { status, jobComplete } = result;
    if (jobComplete === true) return status || 'COMPLETED';
    return status ? `Submitted • ${status}` : 'Submitted';
  }, [result]);

  return {
    loading,
    error,
    result,      // { kycId, partnerJobId, smileJobId, status, jobComplete }
    statusText,  // convenient string for UI
    submit,
    reset,
  };
};
