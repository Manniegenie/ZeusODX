// hooks/useNINVerification.js
import { useCallback, useState } from 'react';
import { ninVerificationService } from '../services/ninVerificationService';

export const useNINVerification = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateNIN = useCallback((nin) => {
    return ninVerificationService.validateNIN(nin);
  }, []);

  const submitNIN = useCallback(async ({ nin, signal } = {}) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // client-side validation first
    const v = ninVerificationService.validateNIN(nin);
    if (!v.valid) {
      setSubmitting(false);
      setSubmitError(v.message);
      return { success: false, error: 'VALIDATION_ERROR', message: v.message };
    }

    try {
      const res = await ninVerificationService.submitVerification({ nin }, { signal });
      if (res.success) {
        setSubmitSuccess(true);
        return res;
      } else {
        setSubmitError(res.message || 'Failed to submit NIN verification');
        return res;
      }
    } catch (e) {
      const msg = e?.message || 'Network error submitting NIN verification';
      setSubmitError(msg);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    submitError,
    submitSuccess,
    validateNIN,
    submitNIN,
  };
};

export default useNINVerification;
