import { useState } from 'react';
import { verifyService } from '../services/verifyOTPService';

export const useVerify = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const verifyOTP = async (verificationData) => {
    setIsVerifying(true);
    try {
      const result = await verifyService.verifyOTP(verificationData);
      return result;
    } catch (error) {
      console.error('❌ useVerify: OTP verification failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOTP = async (phonenumber) => {
    setIsResending(true);
    try {
      const result = await verifyService.resendOTP(phonenumber);
      return result;
    } catch (error) {
      console.error('❌ useVerify: Resend OTP failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async (phonenumber) => {
    setIsCheckingStatus(true);
    try {
      const result = await verifyService.checkVerificationStatus(phonenumber);
      return result;
    } catch (error) {
      console.error('❌ useVerify: Check status failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getTempSignupData = async () => {
    try {
      const result = await verifyService.getTempSignupData();
      return result;
    } catch (error) {
      console.error('❌ useVerify: Get temp data failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  const clearTempSignupData = async () => {
    try {
      const result = await verifyService.clearTempSignupData();
      return result;
    } catch (error) {
      console.error('❌ useVerify: Clear temp data failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  return {
    // Loading states
    isVerifying,
    isResending,
    isCheckingStatus,
    
    // Actions
    verifyOTP,
    resendOTP,
    checkVerificationStatus,
    getTempSignupData,
    clearTempSignupData,
  };
};