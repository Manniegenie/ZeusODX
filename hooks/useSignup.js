import { useState } from 'react';
import { signupService } from '../services/signupService';

export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOTPLoading, setIsOTPLoading] = useState(false);
  const [isPINLoading, setIsPINLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);

  const addUser = async (userData) => {
    setIsLoading(true);
    try {
      const result = await signupService.addUser(userData);
      return result;
    } catch (error) {
      console.error('❌ useSignup: Add user failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (verificationData) => {
    setIsOTPLoading(true);
    try {
      const result = await signupService.verifyOTP(verificationData);
      return result;
    } catch (error) {
      console.error('❌ useSignup: OTP verification failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsOTPLoading(false);
    }
  };

  const createPIN = async (pinData) => {
    setIsPINLoading(true);
    try {
      const result = await signupService.createPIN(pinData);
      return result;
    } catch (error) {
      console.error('❌ useSignup: PIN creation failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsPINLoading(false);
    }
  };

  const resendOTP = async (phonenumber) => {
    setIsResendLoading(true);
    try {
      const result = await signupService.resendOTP(phonenumber);
      return result;
    } catch (error) {
      console.error('❌ useSignup: Resend OTP failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setIsResendLoading(false);
    }
  };

  const getTempSignupData = async () => {
    try {
      const result = await signupService.getTempSignupData();
      return result;
    } catch (error) {
      console.error('❌ useSignup: Get temp data failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  const clearTempSignupData = async () => {
    try {
      const result = await signupService.clearTempSignupData();
      return result;
    } catch (error) {
      console.error('❌ useSignup: Clear temp data failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  return {
    // Loading states
    isLoading,
    isOTPLoading,
    isPINLoading,
    isResendLoading,
    
    // Actions
    addUser,
    verifyOTP,
    createPIN,
    resendOTP,
    getTempSignupData,
    clearTempSignupData,
  };
};