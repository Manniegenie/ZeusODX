import { useState } from 'react';
import { biometricService } from '../services/kycverificationService';

export const useBiometricVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGettingKYCStatus, setIsGettingKYCStatus] = useState(false);

  const submitBiometricVerification = async (verificationData) => {
    setIsVerifying(true);
    try {
      console.log('🔐 useBiometricVerification: Starting verification process');
      
      // Validate data first
      const validation = await biometricService.validateBiometricData(verificationData);
      if (!validation.success) {
        return validation;
      }
      
      // Submit verification
      const result = await biometricService.submitBiometricVerification(verificationData);
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: Verification failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during verification' 
      };
    } finally {
      setIsVerifying(false);
    }
  };

  const validateBiometricData = async (verificationData) => {
    setIsValidating(true);
    try {
      const result = await biometricService.validateBiometricData(verificationData);
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: Validation failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during validation' 
      };
    } finally {
      setIsValidating(false);
    }
  };

  const checkVerificationStatus = async (jobId) => {
    setIsCheckingStatus(true);
    try {
      const result = await biometricService.checkVerificationStatus(jobId);
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: Status check failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while checking status' 
      };
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getUserKYCStatus = async () => {
    setIsGettingKYCStatus(true);
    try {
      const result = await biometricService.getUserKYCStatus();
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: KYC status check failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while getting KYC status' 
      };
    } finally {
      setIsGettingKYCStatus(false);
    }
  };

  const getLastVerificationResult = async () => {
    try {
      const result = await biometricService.getLastVerificationResult();
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: Get last result failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while getting verification result' 
      };
    }
  };

  const clearVerificationHistory = async () => {
    try {
      const result = await biometricService.clearVerificationHistory();
      return result;
    } catch (error) {
      console.error('❌ useBiometricVerification: Clear history failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while clearing history' 
      };
    }
  };

  const formatIdNumber = (idType, idNumber) => {
    try {
      return biometricService.formatIdNumber(idType, idNumber);
    } catch (error) {
      console.error('❌ useBiometricVerification: Format ID number failed', error);
      return idNumber; // Return original if formatting fails
    }
  };

  // Helper function to validate specific ID types
  const validateNIN = (nin) => {
    const cleanNin = nin.replace(/\D/g, '');
    if (cleanNin.length === 0) return { valid: false, message: '' };
    if (cleanNin.length !== 11) return { valid: false, message: 'NIN must be exactly 11 digits' };
    return { valid: true, message: 'Valid NIN format' };
  };

  const validateBVN = (bvn) => {
    const cleanBvn = bvn.replace(/\D/g, '');
    if (cleanBvn.length === 0) return { valid: false, message: '' };
    if (cleanBvn.length !== 11) return { valid: false, message: 'BVN must be exactly 11 digits' };
    return { valid: true, message: 'Valid BVN format' };
  };

  const validatePassport = (passport) => {
    if (passport.length === 0) return { valid: false, message: '' };
    const passportRegex = /^[A-Z]\d{8}$/;
    if (!passportRegex.test(passport.toUpperCase())) {
      return { valid: false, message: 'Passport must be 1 letter followed by 8 digits (e.g., A12345678)' };
    }
    return { valid: true, message: 'Valid passport format' };
  };

  const validateVoterID = (voterId) => {
    const cleanVoterId = voterId.replace(/\D/g, '');
    if (cleanVoterId.length === 0) return { valid: false, message: '' };
    if (cleanVoterId.length !== 19) return { valid: false, message: 'Voter ID must be exactly 19 digits' };
    return { valid: true, message: 'Valid Voter ID format' };
  };

  // Generic ID validation function
  const validateIdNumber = (idType, idNumber) => {
    switch (idType) {
      case 'national_id':
      case 'nin':
        return validateNIN(idNumber);
      case 'bvn':
        return validateBVN(idNumber);
      case 'passport':
        return validatePassport(idNumber);
      case 'voter_id':
        return validateVoterID(idNumber);
      default:
        return { valid: true, message: 'ID format validation not specified for this type' };
    }
  };

  return {
    // Loading states
    isVerifying,
    isCheckingStatus,
    isValidating,
    isGettingKYCStatus,
    
    // Main actions
    submitBiometricVerification,
    validateBiometricData,
    checkVerificationStatus,
    getUserKYCStatus,
    
    // Utility actions
    getLastVerificationResult,
    clearVerificationHistory,
    formatIdNumber,
    
    // Validation helpers
    validateIdNumber,
    validateNIN,
    validateBVN,
    validatePassport,
    validateVoterID,
  };
};