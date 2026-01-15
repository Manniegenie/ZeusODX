// services/kycverificationService.js
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * kycService
 * - No longer requires reading userId from AsyncStorage before submitting.
 * - Caller may supply partnerParams.user_id in verificationData if desired.
 * - If backend returns a body (response.data) we forward it directly so the UI can read its message and data (kycId/submittedAt).
 */
export const kycService = {
  // KYC cache
  kycCache: new Map(),
  kycCacheExpiry: new Map(),

  // Cache duration (10 minutes for KYC results)
  KYC_CACHE_DURATION: 10 * 60 * 1000,

  /**
   * Submit KYC verification to backend
   * Accepts optional verificationData.partnerParams.user_id if caller wants to include user id.
   *
   * IMPORTANT: This function forwards backend-provided messages and `data` (kycId, status, submittedAt)
   * to the caller exactly as returned by the API so the UI can surface the precise text.
   */
  async submitKYCVerification(verificationData) {
    try {
      console.log('🔐 Starting KYC verification...');

      if (!verificationData) {
        return {
          success: false,
          error: 'MISSING_DATA',
          message: 'Verification data is required'
        };
      }

      const { idType, idNumber, selfieImage, livenessImages, dob, partnerParams, firstName, lastName } = verificationData;

      // Validate required fields
      if (!idType || !idNumber || !selfieImage) {
        return {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'ID type, ID number, and selfie image are required'
        };
      }

      // Validate ID type against backend-supported types
      const supportedIdTypes = ['passport', 'national_id', 'drivers_license', 'bvn', 'nin', 'nin_slip', 'voter_id'];
      if (!supportedIdTypes.includes(idType)) {
        return {
          success: false,
          error: 'INVALID_ID_TYPE',
          message: `Unsupported ID type. Supported types: ${supportedIdTypes.join(', ')}`
        };
      }

      // Validate ID number format
      const idValidation = this.validateID(idType, idNumber);
      if (!idValidation.valid) {
        return {
          success: false,
          error: 'INVALID_ID_NUMBER',
          message: idValidation.message
        };
      }

      // Validate selfie image format and size
      if (!this.validateImageFormat(selfieImage)) {
        return {
          success: false,
          error: 'INVALID_IMAGE_FORMAT',
          message: 'Selfie must be a valid base64 image'
        };
      }

      const sizeValidation = this.validateImageSize(selfieImage);
      if (!sizeValidation.valid) {
        return {
          success: false,
          error: 'INVALID_IMAGE_SIZE',
          message: sizeValidation.message
        };
      }

      // Validate liveness images if provided
      if (livenessImages) {
        if (!Array.isArray(livenessImages) || livenessImages.length !== 8) {
          return {
            success: false,
            error: 'INVALID_LIVENESS_IMAGES',
            message: 'Liveness images must be an array of exactly 8 images'
          };
        }
        for (const img of livenessImages) {
          if (!this.validateImageFormat(img)) {
            return {
              success: false,
              error: 'INVALID_LIVENESS_IMAGE_FORMAT',
              message: 'All liveness images must be valid base64 images'
            };
          }
          const imgSizeValidation = this.validateImageSize(img);
          if (!imgSizeValidation.valid) {
            return {
              success: false,
              error: 'INVALID_LIVENESS_IMAGE_SIZE',
              message: imgSizeValidation.message
            };
          }
        }
      }

      // Build payload for backend route POST /biometric-verification
      // NOTE: backend authorizes by token; apiClient must include Authorization header
      const payload = {
        idType,
        idNumber: idNumber.toString().trim(),
        selfieImage,
        ...(livenessImages && { livenessImages }),
        ...(dob && { dob }),
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        // forward partnerParams.user_id if caller provided it (optional)
        ...(partnerParams && partnerParams.user_id && { partnerParams: { user_id: partnerParams.user_id } })
      };

      console.log('📤 Submitting KYC verification request:', {
        idType,
        idNumberLength: idNumber.length,
        hasLivenessImages: !!livenessImages,
        hasDob: !!dob,
        forwardedPartnerUserId: partnerParams?.user_id ?? null
      });

      // POST to the backend route. Your backend's router has a route "/biometric-verification" under kyc.
      // Depending on how you mount routes server-side you may need to call '/kyc/biometric-verification' — keep your existing apiClient baseURL and path.
      const response = await apiClient.post('/kyc/biometric-verification', payload);

      // Normalize response: apiClient might return axios response or a wrapped object.
      const normalized = response || {};
      const respData = normalized.data ?? normalized; // prefer response.data if axios-like

      console.log('📨 KYC verification response received:', {
        httpStatus: normalized.status,
        bodyPresent: !!respData,
        bodySample: respData && (respData.message || respData.status || 'body present')
      });

      // If backend returned a body, forward it as-is to the caller (important: do not drop API message)
      if (respData && typeof respData === 'object') {
        // Store in cache if backend included useful info
        try {
          // attempt to determine a cache user id (partnerParams.user_id preferred)
          let cacheUserId = partnerParams?.user_id || null;
          if (!cacheUserId) {
            try {
              cacheUserId = await AsyncStorage.getItem('userId');
            } catch (e) {
              // ignore AsyncStorage errors; caching is optional
              cacheUserId = null;
            }
          }

          const cacheKey = cacheUserId ? `${idType}_${idNumber}_${cacheUserId}` : `${idType}_${idNumber}`;
          if (respData) {
            this.kycCache.set(cacheKey, respData);
            this.kycCacheExpiry.set(cacheKey, Date.now() + this.KYC_CACHE_DURATION);
            // persist last result locally
            await this.storeKYCResult(respData);
          }
        } catch (e) {
          console.log('⚠️ submitKYCVerification: cache/store failed', e);
        }

        // If API explicitly signalled a failed submission (e.g., success === false) but included data/message,
        // forward that directly so the UI can render the precise reason (e.g., "KYC verification in progress")
        const apiSuccessFlag = typeof respData.success === 'boolean' ? respData.success : undefined;

        // Build normalized return but DO NOT overwrite API message or data — expose both under data + meta
        const result = {
          success: apiSuccessFlag === undefined ? true : apiSuccessFlag,
          message: respData.message || respData.resultText || respData.result_text || null,
          error: respData.error || (apiSuccessFlag === false ? 'API_REJECTED' : null),
          data: respData.data ?? respData, // if API nests details under data, prefer that; otherwise return full body
          meta: {
            rawResponse: normalized,
            apiBody: respData
          },
          statusCode: normalized.status || 200
        };

        // Special handling: detect common "already in progress" phrasing in API message and add header for UI
        const msgLower = String(result.message || '').toLowerCase();
        if (msgLower.includes('in progress') || msgLower.includes('already in progress') || msgLower.includes('already pending')) {
          result.header = 'KYC Already in Progress';
        }

        // If API returned explicit HTTP 400 but provided body, treat it as a valid API response (don't wrap as network error).
        if (normalized.status === 400 || (result.success === false && normalized.status && normalized.status >= 400 && normalized.status < 500)) {
          // Ensure statusCode reflects HTTP status if present
          result.statusCode = normalized.status || result.statusCode || 400;
          return result;
        }

        // Otherwise return result (success true or false) to caller
        return result;
      }

      // No structured body returned — treat as server error
      return this.handleKYCError({
        error: 'NO_RESPONSE_BODY',
        message: 'No response body returned from KYC endpoint',
        statusCode: normalized.status || 500,
        response: normalized
      });

    } catch (error) {
      console.log('❌ Error during KYC verification:', error);

      // If axios-style error with response and body, forward that body rather than wrapping as generic error.
      const axiosResp = error?.response || null;
      if (axiosResp && axiosResp.data && typeof axiosResp.data === 'object') {
        const apiData = axiosResp.data;
        const apiMessage = apiData.message || apiData.resultText || apiData.result_text || null;

        const forwarded = {
          success: typeof apiData.success === 'boolean' ? apiData.success : false,
          message: apiMessage,
          error: apiData.error || 'API_REJECTED',
          data: apiData.data ?? apiData,
          meta: {
            rawResponse: axiosResp,
            apiBody: apiData
          },
          statusCode: axiosResp.status || 400
        };

        // Add header for in-progress case
        const msgLower = String(apiMessage || '').toLowerCase();
        if (msgLower.includes('in progress') || msgLower.includes('already in progress') || msgLower.includes('already pending')) {
          forwarded.header = 'KYC Already in Progress';
        }

        console.log('📨 Forwarding API error response (non-exceptional):', { statusCode: forwarded.statusCode, message: forwarded.message });
        return forwarded;
      }

      // Fallback to generic handler
      return this.handleKYCError({
        error: error?.message || 'NETWORK_ERROR',
        message: error?.message || 'Network error occurred during verification',
        response: error?.response || null,
        statusCode: error?.response?.status || 500,
        rawError: error
      });
    }
  },

  /**
   * Validate NIN format (Nigerian National Identification Number)
   */
  validateNIN(nin) {
    if (!nin) {
      return { valid: false, message: 'NIN is required' };
    }

    const cleanNIN = nin.replace(/\D/g, '');

    if (cleanNIN.length !== 11) {
      return { valid: false, message: 'NIN must be exactly 11 digits' };
    }

    if (cleanNIN[0] === '0') {
      return { valid: false, message: 'Invalid NIN format' };
    }

    return { valid: true };
  },

  /**
   * Validate BVN format (Bank Verification Number)
   */
  validateBVN(bvn) {
    if (!bvn) {
      return { valid: false, message: 'BVN is required' };
    }

    const cleanBVN = bvn.replace(/\D/g, '');

    if (cleanBVN.length !== 11) {
      return { valid: false, message: 'BVN must be exactly 11 digits' };
    }

    return { valid: true };
  },

  /**
   * Validate Passport format
   */
  validatePassport(passport) {
    if (!passport) {
      return { valid: false, message: 'Passport number is required' };
    }

    const passportRegex = /^[AB]\d{8}$/;
    if (!passportRegex.test(passport.toUpperCase())) {
      return { valid: false, message: 'Passport must be in format: A12345678 or B12345678' };
    }

    return { valid: true };
  },

  /**
   * Validate Driver's License format
   */
  validateDriversLicense(license) {
    if (!license) {
      return { valid: false, message: 'Driver\'s license number is required' };
    }

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
  },

  /**
   * Validate Voter ID format
   */
  validateVoterID(voterID) {
    if (!voterID) {
      return { valid: false, message: 'Voter ID is required' };
    }

    const cleanVoterID = voterID.replace(/\D/g, '');

    if (cleanVoterID.length !== 19) {
      return { valid: false, message: 'Voter ID must be exactly 19 digits' };
    }

    return { valid: true };
  },

  /**
   * Validate ID number based on type
   */
  validateID(idType, idNumber) {
    if (!idNumber) {
      return { valid: false, message: 'ID number is required' };
    }

    switch (idType) {
      case 'national_id':
      case 'nin_slip':
      case 'nin':
        return this.validateNIN(idNumber);

      case 'passport':
        return this.validatePassport(idNumber);

      case 'bvn':
        return this.validateBVN(idNumber);

      case 'drivers_license':
        return this.validateDriversLicense(idNumber);

      case 'voter_id':
        return this.validateVoterID(idNumber);

      default:
        return { valid: false, message: 'Unsupported ID type' };
    }
  },

  /**
   * Validate image format (base64)
   */
  validateImageFormat(image) {
    if (!image || typeof image !== 'string') {
      return false;
    }

    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,/;
    return base64Regex.test(image);
  },

  /**
   * Convert base64 to file size estimate
   */
  getBase64FileSize(base64String) {
    if (!base64String || typeof base64String !== 'string') return 0;

    const base64Data = base64String.split(',')[1] || base64String;
    return Math.round((base64Data.length * 3) / 4);
  },

  /**
   * Validate image file size (max 5MB)
   */
  validateImageSize(base64Image, maxSizeMB = 5) {
    const fileSizeBytes = this.getBase64FileSize(base64Image);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (fileSizeBytes > maxSizeBytes) {
      return {
        valid: false,
        message: `Image size (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  },

  /**
   * Get KYC result from cache
   * Tries partnerUserId first, then stored userId (AsyncStorage), then falls back to idType_idNumber.
   */
  async getCachedKYCResult(idType, idNumber, partnerUserId = null) {
    if (!idType || !idNumber) return null;

    try {
      let userId = partnerUserId;
      if (!userId) {
        userId = await AsyncStorage.getItem('userId');
      }
      const cacheKey = userId ? `${idType}_${idNumber}_${userId}` : `${idType}_${idNumber}`;
      const cachedResult = this.kycCache.get(cacheKey);
      const cacheExpiry = this.kycCacheExpiry.get(cacheKey);

      if (cachedResult && cacheExpiry && Date.now() < cacheExpiry) {
        console.log('📋 Using cached KYC result for:', cacheKey);
        return cachedResult;
      }
    } catch (e) {
      console.log('⚠️ getCachedKYCResult: AsyncStorage error', e);
    }

    return null;
  },

  /**
   * Clear KYC cache
   * If idType and idNumber are provided, tries to clear using stored userId (if present) or partnerUserId if supplied.
   */
  async clearKYCCache(idType = null, idNumber = null, partnerUserId = null) {
    if (idType && idNumber) {
      try {
        const userId = partnerUserId || await AsyncStorage.getItem('userId');
        const cacheKey = userId ? `${idType}_${idNumber}_${userId}` : `${idType}_${idNumber}`;
        this.kycCache.delete(cacheKey);
        this.kycCacheExpiry.delete(cacheKey);
        console.log('🧹 Cleared KYC cache for:', cacheKey);
      } catch (e) {
        console.log('⚠️ clearKYCCache: AsyncStorage error', e);
      }
    } else {
      this.kycCache.clear();
      this.kycCacheExpiry.clear();
      console.log('🧹 Cleared all KYC cache');
    }
  },

  /**
   * Get supported ID types
   */
  getSupportedIDTypes() {
    return [
      { id: 'national_id', name: 'National ID (NIN)', pattern: '11 digits' },
      { id: 'bvn', name: 'Bank Verification Number', pattern: '11 digits' },
      { id: 'passport', name: 'International Passport', pattern: 'A12345678 or B12345678' },
      { id: 'drivers_license', name: 'Driver License', pattern: '8-20 alphanumeric' },
      { id: 'voter_id', name: 'Voter ID', pattern: '19 digits' },
      { id: 'nin_slip', name: 'NIN with Slip', pattern: '11 digits' },
      { id: 'nin', name: 'NIN (alternate)', pattern: '11 digits' }
    ];
  },

  /**
   * Get ID type display name
   */
  getIDTypeDisplayName(idType) {
    const idTypes = this.getSupportedIDTypes();
    const foundType = idTypes.find(type => type.id === idType);
    return foundType ? foundType.name : idType.toUpperCase();
  },

  /**
   * Handle KYC errors with user-friendly messages.
   * This function prefers API-provided messages where available and returns meta.rawResponse for callers.
   */
  handleKYCError(errorResponse) {
    const raw = errorResponse || {};
    const apiData = raw.data || raw.response?.data || raw.apiData || null;

    const apiMessage =
      (apiData && (apiData.message || apiData.resultText || apiData.result_text)) ||
      raw.message ||
      raw.error ||
      (raw.response && raw.response.data && (raw.response.data.message || raw.response.data.error)) ||
      null;

    const statusCode = raw.status || raw.statusCode || raw.response?.status || 500;

    const fallbackMessages = {
      'MISSING_DATA': 'KYC data is missing',
      'MISSING_REQUIRED_FIELDS': 'Required fields are missing. Please provide ID type, number, and selfie image.',
      'INVALID_ID_TYPE': 'The selected ID type is not supported',
      'INVALID_ID_NUMBER': 'The provided ID number is invalid',
      'INVALID_IMAGE_FORMAT': 'Please provide a valid image format',
      'INVALID_LIVENESS_IMAGES': 'Liveness images must be exactly 8 images',
      'INVALID_LIVENESS_IMAGE_FORMAT': 'All liveness images must be valid base64 images',
      'INVALID_LIVENESS_IMAGE_SIZE': 'Liveness image size is too large',
      'MISSING_USER_ID': 'User authentication required',
      'VERIFICATION_FAILED': 'Identity verification failed. Please try again with clearer images.',
      'NETWORK_ERROR': 'Network connection error. Please check your connection and try again.',
      'SERVER_ERROR': 'Server error occurred during verification. Please try again later.'
    };

    const mappedFallback = fallbackMessages[raw.error] || fallbackMessages[raw.message] || fallbackMessages[apiData?.error];

    const userMessage = apiMessage || mappedFallback || 'KYC verification failed. Please try again.';

    console.log('❌ Handling KYC error:', {
      errorKey: raw.error || raw.message || apiData?.error,
      statusCode,
      apiMessage,
      userMessage,
      apiData
    });

    return {
      success: false,
      error: raw.error || apiData?.error || apiMessage || 'UNKNOWN_ERROR',
      message: userMessage,
      statusCode,
      meta: {
        rawResponse: raw,
        apiData
      }
    };
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    return {
      kycCacheCount: this.kycCache.size,
      cachedKYC: Array.from(this.kycCache.keys()),
      cacheExpiries: Array.from(this.kycCacheExpiry.entries()).map(([key, expiry]) => ({
        key,
        expiresAt: new Date(expiry).toISOString(),
        isExpired: Date.now() > expiry
      }))
    };
  },

  /**
   * Clear all data
   */
  async clearAllData() {
    console.log('🧹 Clearing all KYC data...');

    this.clearKYCCache();

    try {
      await AsyncStorage.removeItem('lastKYCResult');
      await AsyncStorage.removeItem('kycHistory');
    } catch (error) {
      console.log('⚠️ Error clearing AsyncStorage KYC data:', error);
    }

    console.log('✅ All KYC data cleared');
  },

  /**
   * Store KYC result locally
   */
  async storeKYCResult(result) {
    try {
      await AsyncStorage.setItem('lastKYCResult', JSON.stringify({
        ...result,
        timestamp: Date.now()
      }));
      console.log('💾 KYC result stored locally');
    } catch (error) {
      console.log('⚠️ Failed to store KYC result:', error);
    }
  },

  /**
   * Get last KYC result from local storage
   */
  async getLastKYCResult() {
    try {
      const storedResult = await AsyncStorage.getItem('lastKYCResult');
      if (storedResult) {
        const result = JSON.parse(storedResult);
        if (Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          return result;
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to get last KYC result:', error);
    }
    return null;
  }
};