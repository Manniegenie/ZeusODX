// hooks/useResetPin.js
import { useState, useCallback } from 'react';
import resetpinService from '../services/resetpinService';

export function useResetPin() {
  const [initiating, setInitiating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [changing, setChanging] = useState(false);

  const initiate = useCallback(async () => {
    setInitiating(true);
    try {
      // Return exactly what the service returns (server payload)
      return await resetpinService.initiate();
    } finally {
      setInitiating(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp) => {
    setVerifying(true);
    try {
      return await resetpinService.verifyOtp({ otp });
    } finally {
      setVerifying(false);
    }
  }, []);

  const changePin = useCallback(async ({ newPin, confirmPin, twoFactorCode }) => {
    setChanging(true);
    try {
      return await resetpinService.changePin({ newPin, confirmPin, twoFactorCode });
    } finally {
      setChanging(false);
    }
  }, []);

  return {
    initiate,
    verifyOtp,
    changePin,
    initiating,
    verifying,
    changing,
  };
}

export default useResetPin;
