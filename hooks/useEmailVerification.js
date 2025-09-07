// hooks/useEmailVerification.js
import { useCallback, useState } from 'react';
import emailVerificationService from '../services/emailVerificationService';

/**
 * Hook for email verification (initiate and verify).
 * Returns exact backend messages via `lastMessage`.
 */
export function useEmailVerification() {
  // Initiate states
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initSuccess, setInitSuccess] = useState(false);
  
  // Verify states
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  
  // Shared states
  const [lastMessage, setLastMessage] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const initiate = useCallback(async ({ email } = {}) => {
    setInitiating(true);
    setInitError(null);
    setInitSuccess(false);
    setVerifyError(null); // Clear verify errors when initiating
    setVerifySuccess(false);
    
    try {
      const res = await emailVerificationService.initiate({ email });
      setLastResponse(res);
      setLastMessage(res?.message ?? null);

      if (res?.success) {
        setInitSuccess(true);
      } else {
        setInitError(res?.message || 'Failed to initiate verification');
      }
      return res;
    } finally {
      setInitiating(false);
    }
  }, []);

  const verify = useCallback(async ({ otp, email } = {}) => {
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);
    
    try {
      const res = await emailVerificationService.verify({ otp, email });
      setLastResponse(res);
      setLastMessage(res?.message ?? null);

      if (res?.success) {
        setVerifySuccess(true);
        // Clear init states on successful verification
        setInitError(null);
        setInitSuccess(false);
      } else {
        setVerifyError(res?.message || 'Failed to verify email address');
      }
      return res;
    } finally {
      setVerifying(false);
    }
  }, []);

  const reset = useCallback(() => {
    setInitiating(false);
    setInitError(null);
    setInitSuccess(false);
    setVerifying(false);
    setVerifyError(null);
    setVerifySuccess(false);
    setLastMessage(null);
    setLastResponse(null);
  }, []);

  return {
    // Initiate
    initiating,
    initError,
    initSuccess,
    initiate,
    
    // Verify
    verifying,
    verifyError,
    verifySuccess,
    verify,
    
    // Shared
    lastMessage,
    lastResponse,
    reset,
    
    // Computed states
    isLoading: initiating || verifying,
    hasError: !!(initError || verifyError),
    hasSuccess: initSuccess || verifySuccess,
  };
}

export default useEmailVerification;