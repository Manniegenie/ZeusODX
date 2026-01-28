// services/electricityService.js
import { apiClient } from './apiClient';

export const electricityService = {
  /**
   * Get electricity providers from PayBeta API
   * @returns {Promise<Array>} Available electricity providers
   */
  async getElectricityProviders() {
    try {
      console.log('🔌 Fetching electricity providers from PayBeta...');
      
      const response = await apiClient.get('/electricity/providers');
      
      // Handle nested data structure from API client
      const providers = response.data?.data?.providers || response.data?.providers;
      
      if (response.success && providers) {
        console.log('✅ Electricity providers fetched successfully:', providers.length);
        return providers;
      } else {
        const errorMessage = response.error || 'Failed to fetch electricity providers';
        console.warn('⚠️ PayBeta providers API failed:', errorMessage);
        return this.getStaticElectricityProviders();
      }
    } catch (error) {
      console.error('❌ Failed to fetch electricity providers:', error.message);
      return this.getStaticElectricityProviders();
    }
  },

  /**
   * Get static electricity providers as fallback
   * @returns {Array} Static electricity providers
   */
  getStaticElectricityProviders() {
    return [
      { id: 'ikeja-electric', name: 'Ikeja Electric', region: 'Lagos' },
      { id: 'eko-electric', name: 'Eko Electricity Distribution Company', region: 'Lagos' },
      { id: 'kano-electric', name: 'Kano Electricity Distribution Company', region: 'Kano' },
      { id: 'portharcourt-electric', name: 'Port Harcourt Electricity Distribution Company', region: 'Rivers' },
      { id: 'jos-electric', name: 'Jos Electricity Distribution Company', region: 'Plateau' },
      { id: 'ibadan-electric', name: 'Ibadan Electricity Distribution Company', region: 'Oyo' },
      { id: 'kaduna-electric', name: 'Kaduna Electric', region: 'Kaduna' },
      { id: 'abuja-electric', name: 'Abuja Electricity Distribution Company', region: 'FCT' },
      { id: 'enugu-electric', name: 'Enugu Electricity Distribution Company', region: 'Enugu' },
      { id: 'benin-electric', name: 'Benin Electricity Distribution Company', region: 'Edo' },
      { id: 'aba-electric', name: 'Aba Power Electric Company', region: 'Abia' },
      { id: 'yola-electric', name: 'Yola Electricity Distribution Company', region: 'Adamawa' }
    ];
  },

  /**
   * Validate electricity customer using PayBeta
   * @param {Object} validationData - Customer validation data
   * @returns {Promise<Object>} Validation result
   */
  async validateElectricityCustomer(validationData) {
    try {
      console.log('🔌 Starting electricity customer validation:', {
        service: validationData.service,
        meterNumber: validationData.meterNumber ? `${validationData.meterNumber.substring(0, 3)}***${validationData.meterNumber.substring(validationData.meterNumber.length - 3)}` : 'N/A',
        meterType: validationData.meterType
      });

      const response = await apiClient.post('/electricity/validate', validationData);
      
      // Check for nested data structure (response.data.data)
      const responseData = response.data?.data || response.data;
      
      if (response.success && responseData) {
        console.log('✅ Electricity customer validation successful:', {
          customerName: responseData.customerName,
          customerAddress: responseData.customerAddress,
          meterNumber: responseData.meterNumber,
          meterType: responseData.meterType,
          minimumAmount: responseData.minimumAmount
        });
        
        return {
          success: true,
          data: {
            customerName: responseData.customerName,
            customerAddress: responseData.customerAddress,
            meterNumber: responseData.meterNumber,
            meterType: responseData.meterType,
            minimumAmount: responseData.minimumAmount,
            verifiedAt: responseData.verified_at,
            requestId: responseData.requestId
          }
        };
      } else {
        const errorMessage = response.error || 'Customer validation failed';
        console.log('❌ Electricity customer validation failed:', errorMessage);
        
        return {
          success: false,
          error: errorMessage, // Direct backend error message
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('❌ Electricity customer validation error:', error);
      return {
        success: false,
        error: error.message || 'Customer validation failed', // Network error message directly
        message: error.message || 'Customer validation failed'
      };
    }
  },

  /**
   * Purchase electricity
   * Returns the RAW backend body (eBills shape): { code, message, data }
   * On backend/validation error, returns backend error body if present.
   * On pure network failure, returns a minimal fallback with same keys.
   */
  async purchaseElectricity(purchaseData) {
    try {
      const body = {
        customer_id: purchaseData.meterNumber,
        service_id: purchaseData.service_id?.toLowerCase(),
        variation_id: purchaseData.variation_id?.toLowerCase(),
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNZ', // align with backend
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin,
        // PayBeta requires customer details
        customerName: purchaseData.customerName,
        customerAddress: purchaseData.customerAddress
      };

      console.log('⚡ Starting electricity purchase:', {
        customer_id: body.customer_id,
        service_id: body.service_id,
        variation_id: body.variation_id,
        amount: body.amount,
        provider: this.getProviderDisplayName(purchaseData.service_id)
      });

      const response = await apiClient.post('/electricity/purchase', body);

      // If using axios, raw.data is the server body. If a custom client, raw may already be body.
      return response?.data ?? response;
    } catch (error) {
      console.error('❌ Electricity service error:', {
        error: error?.message,
        type: error?.response?.data ? 'BACKEND_ERROR' : 'NETWORK_OR_UNKNOWN',
        backend: error?.response?.data
      });

      // If backend responded with a body, return it exactly as-is
      if (error?.response?.data) {
        return error.response.data;
      }

      // Fallback for network errors (keep eBills-like keys)
      return {
        code: 'error',
        message: error.message || 'Network connection failed. Please try again.',
        data: null
      };
    }
  },

  /**
   * Get available electricity providers
   * @returns {Array} Available electricity providers
   */
  getElectricityProviders() {
    return [
      { id: 'ikeja-electric', name: 'Ikeja Electric', region: 'Lagos' },
      { id: 'eko-electric', name: 'Eko Electricity Distribution Company', region: 'Lagos' },
      { id: 'kano-electric', name: 'Kano Electricity Distribution Company', region: 'Kano' },
      { id: 'portharcourt-electric', name: 'Port Harcourt Electricity Distribution Company', region: 'Rivers' },
      { id: 'jos-electric', name: 'Jos Electricity Distribution Company', region: 'Plateau' },
      { id: 'ibadan-electric', name: 'Ibadan Electricity Distribution Company', region: 'Oyo' },
      { id: 'kaduna-electric', name: 'Kaduna Electric', region: 'Kaduna' },
      { id: 'abuja-electric', name: 'Abuja Electricity Distribution Company', region: 'FCT' },
      { id: 'enugu-electric', name: 'Enugu Electricity Distribution Company', region: 'Enugu' },
      { id: 'benin-electric', name: 'Benin Electricity Distribution Company', region: 'Edo' },
      { id: 'aba-electric', name: 'Aba Power Electric Company', region: 'Abia' },
      { id: 'yola-electric', name: 'Yola Electricity Distribution Company', region: 'Adamawa' }
    ];
  },

  /**
   * Get available meter types
   * @returns {Array} Available meter types
   */
  getMeterTypes() {
    return [
      { id: 'prepaid', name: 'Prepaid', description: 'Pay before consumption' },
      { id: 'postpaid', name: 'Postpaid', description: 'Pay after consumption' }
    ];
  },

  /**
   * Validate electricity purchase data
   * @param {Object} data - Purchase data to validate
   * @returns {Object} Validation result with errors array
   */
  validatePurchaseData(data) {
    const errors = [];

    // Meter number validation
    if (!data.meterNumber?.trim()) {
      errors.push('Meter/account number is required');
    } else {
      const meterNumber = data.meterNumber.trim();
      if (meterNumber.length < 10) {
        errors.push('Meter/account number must be at least 10 characters');
      } else if (meterNumber.length > 20) {
        errors.push('Meter/account number must not exceed 20 characters');
      } else if (!/^[a-zA-Z0-9]+$/.test(meterNumber)) {
        errors.push('Meter/account number can only contain letters and numbers');
      }
    }

    // Provider validation
    if (!data.service_id?.trim()) {
      errors.push('Electricity provider is required');
    } else {
      const validProviders = this.getElectricityProviders().map((p) => p.id);
      if (!validProviders.includes(data.service_id.toLowerCase())) {
        errors.push('Please select a valid electricity provider');
      }
    }

    // Meter type validation
    if (!data.variation_id?.trim()) {
      errors.push('Meter type is required');
    } else {
      const validMeterTypes = ['prepaid', 'postpaid'];
      if (!validMeterTypes.includes(data.variation_id.toLowerCase())) {
        errors.push('Please select a valid meter type (Prepaid or Postpaid)');
      }
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 1000) {
      errors.push('Minimum electricity purchase amount is ₦1,000');
    } else if (amount > 100000) {
      errors.push('Maximum electricity purchase amount is ₦100,000');
    }

    // 2FA code validation
    if (!data.twoFactorCode?.trim()) {
      errors.push('Two-factor authentication code is required');
    } else {
      const code = data.twoFactorCode.trim();
      if (!/^\d{6}$/.test(code)) {
        errors.push('2FA code must be exactly 6 digits');
      }
    }

    // Password PIN validation
    if (!data.passwordpin?.trim()) {
      errors.push('Password PIN is required');
    } else {
      const pin = data.passwordpin.trim();
      if (!/^\d{6}$/.test(pin)) {
        errors.push('Password PIN must be exactly 6 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate meter number format
   * @param {string} meterNumber - Meter number to validate
   * @returns {boolean} True if valid meter number format
   */
  validateMeterNumber(meterNumber) {
    if (!meterNumber || typeof meterNumber !== 'string') return false;

    const cleaned = meterNumber.trim();

    // Basic validation: 10-20 characters, alphanumeric
    if (cleaned.length < 10 || cleaned.length > 20) return false;
    if (!/^[a-zA-Z0-9]+$/.test(cleaned)) return false;

    return true;
  },

  /**
   * Format meter number for display
   * @param {string} meterNumber - Meter number to format
   * @returns {string} Formatted meter number
   */
  formatMeterNumber(meterNumber) {
    if (!meterNumber) return '';

    const cleaned = meterNumber.toString().trim().replace(/[^a-zA-Z0-9]/g, '');

    // Add spaces every 4 characters for readability
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  },

  /**
   * Get provider display name
   * @param {string} providerId - Provider ID
   * @returns {string} Provider display name
   */
  getProviderDisplayName(providerId) {
    const provider = this.getElectricityProviders().find(
      (p) => p.id.toLowerCase() === providerId?.toLowerCase()
    );

    return provider?.name || providerId || 'Unknown Provider';
  },

  /**
   * Get provider region
   * @param {string} providerId - Provider ID
   * @returns {string} Provider region
   */
  getProviderRegion(providerId) {
    const provider = this.getElectricityProviders().find(
      (p) => p.id.toLowerCase() === providerId?.toLowerCase()
    );

    return provider?.region || '';
  },

  /**
   * Get meter type display name
   * @param {string} meterTypeId - Meter type ID
   * @returns {string} Meter type display name
   */
  getMeterTypeDisplayName(meterTypeId) {
    const meterType = this.getMeterTypes().find(
      (t) => t.id.toLowerCase() === meterTypeId?.toLowerCase()
    );

    return meterType?.name || meterTypeId || 'Unknown';
  },

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount with currency
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₦0.00';

    return `₦${numAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  /**
   * Get electricity purchase limits
   * @returns {Object} Purchase limits
   */
  getPurchaseLimits() {
    return {
      minimum: 1000,
      maximum: 100000,
      currency: 'NGNZ',
      formattedMinimum: this.formatAmount(1000),
      formattedMaximum: this.formatAmount(100000)
    };
  },

  /**
   * Get popular electricity amounts
   * @returns {Array} Popular electricity amounts
   */
  getPopularAmounts() {
    return [
      { amount: 1000, label: '₦1,000', popular: true },
      { amount: 2000, label: '₦2,000', popular: true },
      { amount: 3000, label: '₦3,000', popular: true },
      { amount: 5000, label: '₦5,000', popular: true },
      { amount: 10000, label: '₦10,000', popular: true },
      { amount: 20000, label: '₦20,000', popular: false }
    ];
  },

  /**
   * Format electricity units for display
   * @param {string|number} units - Electricity units
   * @returns {string} Formatted units
   */
  formatElectricityUnits(units) {
    if (!units) return '';

    const numUnits = parseFloat(units);
    if (isNaN(numUnits)) return units.toString();

    return `${numUnits.toFixed(2)} kWh`;
  },

  /**
   * Format electricity token for display
   * @param {string} token - Electricity token
   * @returns {string} Formatted token
   */
  formatElectricityToken(token) {
    if (!token) return '';

    const cleaned = token.toString().replace(/[^0-9]/g, '');

    // Format as groups of 4 digits
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  }
};