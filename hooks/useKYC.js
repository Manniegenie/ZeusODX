// hooks/useBiometricVerification.js
import { useState } from 'react';
import { kycService } from '../services/kycverificationService';

export const useBiometricVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGettingKYCStatus, setIsGettingKYCStatus] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  /**
   * Submit biometric verification.
   * verificationData may include partnerParams.user_id if caller wants to attach a partner user id.
   *
   * Returns the raw result from kycService.submitKYCVerification but with a few normalized helper
   * fields to make UI handling easier:
   *  - inProgress: boolean (true when backend indicates pending/already-in-progress)
   *  - modalHeader: string (preferred header for modals; service may set result.header)
   */
  const submitBiometricVerification = async (verificationData) => {
    setIsVerifying(true);
    try {
      console.log('🔐 useBiometricVerification: Starting verification process');

      // Optionally run local validation first
      const validation = await validateBiometricData(verificationData);
      if (!validation.success) {
        return validation;
      }

      // Call service; caller may include partnerParams.user_id inside verificationData if they want
      const result = await kycService.submitKYCVerification(verificationData);

      // Normalize and add convenience flags for UI:
      // - The service intentionally forwards API bodies (including 400 with a valid body).
      // - Detect "in progress"/pending cases and expose a boolean + modalHeader for easy consumption.
      const normalized = {
        ...result,
        statusCode: result?.statusCode ?? result?.meta?.rawResponse?.status ?? 200,
        meta: result?.meta ?? null
      };

      // Determine in-progress condition:
      const apiMessage = String((result && (result.message || (result.data && result.data.message))) || '').toLowerCase();
      const apiStatus = (result && result.data && (result.data.status || result.data.state)) || null;
      const headerFromService = result && result.header ? result.header : null;

      const isInProgress = Boolean(
        headerFromService ||
        apiStatus === 'PENDING' ||
        apiMessage.includes('in progress') ||
        apiMessage.includes('already in progress') ||
        apiMessage.includes('already pending') ||
        (normalized.statusCode === 400 && apiStatus === 'PENDING') // explicit 400+body pending case
      );

      if (isInProgress) {
        normalized.inProgress = true;
        normalized.modalHeader = headerFromService || 'KYC In Progress';
        // populate friendlyTitle/message if not present so UI can show something clear
        normalized.modalMessage = result.message || (result.data && result.data.message) || 'KYC verification in progress. You will receive a confirmation email.';
      } else {
        normalized.inProgress = false;
      }

      // If service returned success:true include data as-is
      // The UI can inspect normalized.data for kycId/submittedAt/etc.
      return normalized;
    } catch (error) {
      console.error('❌ useBiometricVerification: Verification failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred during verification'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const validateBiometricData = async (verificationData) => {
    setIsValidating(true);
    try {
      console.log('🔍 useBiometricVerification: Validating biometric data');

      if (!verificationData) {
        return {
          success: false,
          error: 'MISSING_DATA',
          message: 'Verification data is required'
        };
      }

      const { idType, idNumber, selfieImage, livenessImages } = verificationData;

      if (!idType || !idNumber || !selfieImage) {
        return {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'ID type, ID number, and selfie image are required'
        };
      }

      // ensure idType is supported by service
      const supported = kycService.getSupportedIDTypes().map(t => t.id);
      if (!supported.includes(idType)) {
        return {
          success: false,
          error: 'INVALID_ID_TYPE',
          message: `Unsupported ID type. Supported: ${supported.join(', ')}`
        };
      }

      const idValidation = kycService.validateID(idType, idNumber);
      if (!idValidation.valid) {
        return {
          success: false,
          error: 'INVALID_ID_NUMBER',
          message: idValidation.message
        };
      }

      if (!kycService.validateImageFormat(selfieImage)) {
        return {
          success: false,
          error: 'INVALID_IMAGE_FORMAT',
          message: 'Selfie must be a valid base64 image'
        };
      }

      const imageSizeValidation = kycService.validateImageSize(selfieImage);
      if (!imageSizeValidation.valid) {
        return {
          success: false,
          error: 'IMAGE_TOO_LARGE',
          message: imageSizeValidation.message
        };
      }

      if (livenessImages) {
        if (!Array.isArray(livenessImages) || livenessImages.length !== 8) {
          return {
            success: false,
            error: 'INVALID_LIVENESS_IMAGES',
            message: 'Liveness images must be an array of exactly 8 images'
          };
        }

        for (let i = 0; i < livenessImages.length; i++) {
          if (!kycService.validateImageFormat(livenessImages[i])) {
            return {
              success: false,
              error: 'INVALID_LIVENESS_IMAGE_FORMAT',
              message: `Liveness image ${i + 1} has invalid format`
            };
          }

          const livenessImageSizeValidation = kycService.validateImageSize(livenessImages[i]);
          if (!livenessImageSizeValidation.valid) {
            return {
              success: false,
              error: 'LIVENESS_IMAGE_TOO_LARGE',
              message: `Liveness image ${i + 1}: ${livenessImageSizeValidation.message}`
            };
          }
        }
      }

      console.log('✅ useBiometricVerification: Data validation successful');
      return {
        success: true,
        message: 'All validation checks passed'
      };
    } catch (error) {
      console.error('❌ useBiometricVerification: Validation failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred during validation'
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Check verification status by kycId.
   * Will try last stored KYC result first.
   */
  const checkVerificationStatus = async (kycId) => {
    setIsCheckingStatus(true);
    try {
      console.log('📊 useBiometricVerification: Checking verification status for KYC ID:', kycId);

      if (!kycId) {
        return {
          success: false,
          error: 'MISSING_KYC_ID',
          message: 'KYC ID is required to check status'
        };
      }

      // Check cached/stored results
      const cachedResult = await kycService.getLastKYCResult();
      if (cachedResult && cachedResult.kycId === kycId) {
        return {
          success: true,
          data: {
            kycId: cachedResult.kycId,
            smileJobId: cachedResult.smileJobId,
            status: cachedResult.status,
            resultCode: cachedResult.resultCode,
            resultText: cachedResult.resultText,
            confidenceValue: cachedResult.confidenceValue,
            kycLevel: cachedResult.kycLevel,
            documentInfo: cachedResult.documentInfo
          }
        };
      }

      return {
        success: false,
        error: 'NO_STATUS_FOUND',
        message: 'No status found for the provided KYC ID'
      };
    } catch (error) {
      console.error('❌ useBiometricVerification: Status check failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while checking status'
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getUserKYCStatus = async () => {
    setIsGettingKYCStatus(true);
    try {
      console.log('📋 useBiometricVerification: Getting user KYC status');

      const lastResult = await kycService.getLastKYCResult();

      if (lastResult) {
        return {
          success: true,
          data: {
            kycStatus: lastResult.status,
            kycLevel: lastResult.kycLevel,
            isApproved: lastResult.status === 'APPROVED',
            lastVerification: lastResult.timestamp,
            resultText: lastResult.resultText,
            kycId: lastResult.kycId,
            documentInfo: lastResult.documentInfo
          }
        };
      } else {
        return {
          success: false,
          error: 'NO_KYC_DATA',
          message: 'No KYC verification found'
        };
      }
    } catch (error) {
      console.error('❌ useBiometricVerification: KYC status check failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while getting KYC status'
      });
    } finally {
      setIsGettingKYCStatus(false);
    }
  };

  const getLastVerificationResult = async () => {
    try {
      console.log('📄 useBiometricVerification: Getting last verification result');

      const lastResult = await kycService.getLastKYCResult();

      if (lastResult) {
        return {
          success: true,
          data: lastResult
        };
      } else {
        return {
          success: false,
          error: 'NO_VERIFICATION_RESULT',
          message: 'No previous verification result found'
        };
      }
    } catch (error) {
      console.error('❌ useBiometricVerification: Get last result failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while getting verification result'
      });
    }
  };

  const clearVerificationHistory = async () => {
    setIsClearingHistory(true);
    try {
      console.log('🧹 useBiometricVerification: Clearing verification history');

      await kycService.clearAllData();

      return {
        success: true,
        message: 'Verification history cleared successfully'
      };
    } catch (error) {
      console.error('❌ useBiometricVerification: Clear history failed', error);
      return kycService.handleKYCError({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while clearing history'
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  const formatIdNumber = (idType, idNumber) => {
    try {
      console.log('🔤 useBiometricVerification: Formatting ID number');

      if (!idType || !idNumber) {
        return idNumber;
      }

      switch (idType) {
        case 'national_id':
        case 'nin_slip':
        case 'bvn':
          return idNumber.replace(/\D/g, '');

        case 'passport':
        case 'drivers_license':
          return idNumber.toUpperCase().replace(/\s/g, '');

        default:
          return idNumber.trim();
      }
    } catch (error) {
      console.error('❌ useBiometricVerification: Format ID number failed', error);
      return idNumber;
    }
  };

  // Simple wrappers to expose validator methods from service
  const validateNIN = (nin) => {
    const validation = kycService.validateNIN(nin);
    if (nin && nin.length === 0) return { valid: false, message: '' };
    return validation;
  };

  const validateBVN = (bvn) => {
    const validation = kycService.validateBVN(bvn);
    if (bvn && bvn.length === 0) return { valid: false, message: '' };
    return validation;
  };

  const validatePassport = (passport) => {
    const validation = kycService.validatePassport(passport);
    if (passport && passport.length === 0) return { valid: false, message: '' };
    return validation;
  };

  const validateDriversLicense = (license) => {
    if (!license || license.length === 0) return { valid: false, message: '' };
    
    const cleanLicense = license.trim().toUpperCase();
    
    if (cleanLicense.length < 8) {
      return { valid: false, message: 'License number must be at least 8 characters' };
    }
    
    if (cleanLicense.length > 20) {
      return { valid: false, message: 'License number cannot exceed 20 characters' };
    }
    
    const alphanumericRegex = /^[A-Z0-9]+$/;
    if (!alphanumericRegex.test(cleanLicense)) {
      return { valid: false, message: 'License number can only contain letters and numbers' };
    }
    
    return { valid: true };
  };

  const validateIdNumber = (idType, idNumber) => {
    if (!idNumber || idNumber.length === 0) {
      return { valid: false, message: '' };
    }

    const validation = kycService.validateID(idType, idNumber);
    return validation;
  };

  const getSupportedIdTypes = () => {
    return kycService.getSupportedIDTypes();
  };

  const getIdTypeDisplayName = (idType) => {
    return kycService.getIDTypeDisplayName(idType);
  };

  const getCacheStatus = () => {
    return kycService.getCacheStatus();
  };

  /**
   * getCachedKYCResult wrapper
   * Accepts optional partnerUserId to prefer when building cache key
   */
  const getCachedKYCResult = (idType, idNumber, partnerUserId = null) => {
    return kycService.getCachedKYCResult(idType, idNumber, partnerUserId);
  };

  /**
   * clearKYCCache wrapper
   * Accepts optional partnerUserId to prefer when clearing cache for a specific id
   */
  const clearKYCCache = (idType, idNumber, partnerUserId = null) => {
    return kycService.clearKYCCache(idType, idNumber, partnerUserId);
  };

  return {
    isVerifying,
    isCheckingStatus,
    isValidating,
    isGettingKYCStatus,
    isClearingHistory,

    submitBiometricVerification,
    validateBiometricData,
    checkVerificationStatus,
    getUserKYCStatus,

    getLastVerificationResult,
    clearVerificationHistory,
    formatIdNumber,

    validateIdNumber,
    validateNIN,
    validateBVN,
    validatePassport,
    validateDriversLicense,

    getSupportedIdTypes,
    getIdTypeDisplayName,
    getCacheStatus,
    getCachedKYCResult,
    clearKYCCache,
  };
};