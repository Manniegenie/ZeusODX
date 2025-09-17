// hooks/useForgotPin.js
import { useCallback, useState } from 'react';
import { forgotPinService } from '../services/forgotpinService';

/**
 * useForgotPin hook
 *
 * Provides two pin management flows:
 * 
 * FORGOT PIN FLOW (when user forgot their pin):
 * - initiate(phoneNumber): sends OTP to user's email
 * - verifyOtp(otp): verifies OTP from email
 * - resetPin({ newPin, confirmPin }): completes pin reset
 *
 * UPDATE PIN FLOW (when user knows current pin):
 * - updatePin({ phoneNumber, currentPin, newPin, confirmPin }): changes existing pin
 *
 * Returns:
 * {
 *   // Forgot pin flow
 *   initiate, verifyOtp, resetPin,
 *   
 *   // Update pin flow  
 *   updatePin,
 *   
 *   // State
 *   loading, error, successMessage, lastResponse,
 *   phoneNumber, setPhoneNumber,
 *   
 *   // Helpers
 *   clearState
 * }
 */
export function useForgotPin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const clearState = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setLastResponse(null);
  }, []);

  const clearAll = useCallback(() => {
    clearState();
    setPhoneNumber('');
  }, [clearState]);

  // FORGOT PIN FLOW: Step 1 - Initiate pin reset with phone number
  const initiate = useCallback(async (phone) => {
    clearState();
    setLoading(true);
    
    // Use provided phone or stored phone
    const phoneToUse = phone || phoneNumber;
    if (!phoneToUse) {
      setError('Phone number is required');
      setLoading(false);
      return { success: false, error: 'Phone number is required' };
    }

    // Store phone number for subsequent calls
    if (phone) {
      setPhoneNumber(phone);
    }

    try {
      const res = await forgotPinService.initiate(phoneToUse);
      setLastResponse(res);
      
      if (res.success) {
        setSuccessMessage(res.data?.message || 'Verification code sent to your email.');
        setError(null);
        setLoading(false);
        return { success: true, data: res.data };
      } else {
        setError(res.error || res.data?.message || 'Failed to initiate pin reset');
        setLoading(false);
        return { success: false, error: res.error || res.data?.message };
      }
    } catch (err) {
      console.error('useForgotPin.initiate error', err);
      setError(err?.message || 'Network error');
      setLoading(false);
      return { success: false, error: err?.message || 'Network error' };
    }
  }, [clearState, phoneNumber]);

  // FORGOT PIN FLOW: Step 2 - Verify OTP from email
  const verifyOtp = useCallback(async (otp, phone) => {
    clearState();
    setLoading(true);
    
    // Use provided phone or stored phone
    const phoneToUse = phone || phoneNumber;
    if (!phoneToUse) {
      setError('Phone number is required');
      setLoading(false);
      return { success: false, error: 'Phone number is required' };
    }

    if (!otp) {
      setError('OTP is required');
      setLoading(false);
      return { success: false, error: 'OTP is required' };
    }

    try {
      const res = await forgotPinService.verifyOtp(otp, phoneToUse);
      setLastResponse(res);
      
      if (res.success) {
        setSuccessMessage(res.data?.message || 'OTP verified successfully.');
        setError(null);
        setLoading(false);
        return { success: true, data: res.data };
      } else {
        setError(res.error || res.data?.message || 'Failed to verify OTP');
        setLoading(false);
        return { success: false, error: res.error || res.data?.message };
      }
    } catch (err) {
      console.error('useForgotPin.verifyOtp error', err);
      setError(err?.message || 'Network error');
      setLoading(false);
      return { success: false, error: err?.message || 'Network error' };
    }
  }, [clearState, phoneNumber]);

  // FORGOT PIN FLOW: Step 3 - Complete pin reset
  const resetPin = useCallback(async ({ newPin, confirmPin, phoneNumber: phone }) => {
    clearState();
    setLoading(true);
    
    // Use provided phone or stored phone
    const phoneToUse = phone || phoneNumber;
    if (!phoneToUse) {
      setError('Phone number is required');
      setLoading(false);
      return { success: false, error: 'Phone number is required' };
    }

    try {
      const res = await forgotPinService.resetPin({ 
        phoneNumber: phoneToUse, 
        newPin, 
        confirmPin
      });
      setLastResponse(res);
      
      if (res.success) {
        setSuccessMessage(res.data?.message || 'Pin reset successfully.');
        setError(null);
        setLoading(false);
        // Clear phone number after successful reset
        setPhoneNumber('');
        return { success: true, data: res.data };
      } else {
        setError(res.error || res.data?.message || 'Failed to reset pin');
        setLoading(false);
        return { success: false, error: res.error || res.data?.message };
      }
    } catch (err) {
      console.error('useForgotPin.resetPin error', err);
      setError(err?.message || 'Network error');
      setLoading(false);
      return { success: false, error: err?.message || 'Network error' };
    }
  }, [clearState, phoneNumber]);

  // UPDATE PIN FLOW: Change existing pin (requires current pin)
  const updatePin = useCallback(async ({ 
    phoneNumber: phone, 
    currentPin, 
    newPin, 
    confirmPin
  }) => {
    clearState();
    setLoading(true);
    
    // Use provided phone or stored phone
    const phoneToUse = phone || phoneNumber;
    if (!phoneToUse) {
      setError('Phone number is required');
      setLoading(false);
      return { success: false, error: 'Phone number is required' };
    }

    try {
      const res = await forgotPinService.updatePin({ 
        phoneNumber: phoneToUse, 
        currentPin, 
        newPin, 
        confirmPin
      });
      setLastResponse(res);
      
      if (res.success) {
        setSuccessMessage(res.data?.message || 'Pin updated successfully.');
        setError(null);
        setLoading(false);
        return { success: true, data: res.data };
      } else {
        setError(res.error || res.data?.message || 'Failed to update pin');
        setLoading(false);
        return { success: false, error: res.error || res.data?.message };
      }
    } catch (err) {
      console.error('useForgotPin.updatePin error', err);
      setError(err?.message || 'Network error');
      setLoading(false);
      return { success: false, error: err?.message || 'Network error' };
    }
  }, [clearState, phoneNumber]);

  // DEPRECATED: Legacy method for backward compatibility
  const changePin = useCallback(async (params) => {
    console.warn('useForgotPin.changePin is deprecated, use resetPin instead');
    return resetPin(params);
  }, [resetPin]);

  return {
    // Forgot pin flow methods
    initiate,
    verifyOtp,
    resetPin,
    
    // Update pin flow method
    updatePin,
    
    // Deprecated method (backward compatibility)
    changePin,

    // State
    loading,
    error,
    successMessage,
    lastResponse,
    phoneNumber,
    setPhoneNumber,

    // Helpers
    clearState,
    clearAll,
  };
}