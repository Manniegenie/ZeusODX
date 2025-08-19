// hooks/useResetPin.js
import { useCallback, useEffect, useRef, useState } from 'react';
import resetpinService from '../services/resetpinService';

export function useResetPin() {
  const [step, setStep] = useState('idle'); // 'idle' | 'initiated' | 'otpVerified' | 'completed'
  const [initiating, setInitiating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [changing, setChanging] = useState(false);
  const [initiateError, setInitiateError] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [changeError, setChangeError] = useState(null);

  const initAbortRef = useRef(null);
  const verifyAbortRef = useRef(null);
  const changeAbortRef = useRef(null);

  const reset = useCallback(() => {
    initAbortRef.current?.abort?.();
    verifyAbortRef.current?.abort?.();
    changeAbortRef.current?.abort?.();
    setStep('idle');
    setInitiating(false);
    setVerifying(false);
    setChanging(false);
    setInitiateError(null);
    setVerifyError(null);
    setChangeError(null);
  }, []);

  const initiate = useCallback(async () => {
    initAbortRef.current?.abort?.();
    const controller = new AbortController();
    initAbortRef.current = controller;

    setInitiating(true);
    setInitiateError(null);
    try {
      const res = await resetpinService.initiate({ signal: controller.signal });
      if (res?.success === true) setStep('initiated');
      else setInitiateError({ error: res?.error, message: res?.message });
      return res;
    } finally {
      setInitiating(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp) => {
    verifyAbortRef.current?.abort?.();
    const controller = new AbortController();
    verifyAbortRef.current = controller;

    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await resetpinService.verifyOtp({ otp, signal: controller.signal });
      if (res?.success === true) setStep('otpVerified');
      else setVerifyError({ error: res?.error, message: res?.message });
      return res;
    } finally {
      setVerifying(false);
    }
  }, []);

  const changePin = useCallback(async ({ newPin, confirmPin, twoFactorCode }) => {
    changeAbortRef.current?.abort?.();
    const controller = new AbortController();
    changeAbortRef.current = controller;

    setChanging(true);
    setChangeError(null);
    try {
      const res = await resetpinService.changePin({ newPin, confirmPin, twoFactorCode, signal: controller.signal });
      if (res?.success === true) setStep('completed');
      else setChangeError({ error: res?.error, message: res?.message });
      return res;
    } finally {
      setChanging(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      initAbortRef.current?.abort?.();
      verifyAbortRef.current?.abort?.();
      changeAbortRef.current?.abort?.();
    };
  }, []);

  return {
    step,
    initiate, verifyOtp, changePin, reset,
    initiating, verifying, changing,
    initiateError, verifyError, changeError,
  };
}
export default useResetPin;
