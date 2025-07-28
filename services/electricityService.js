// services/electricityService.js
import { apiClient } from './apiClient';

export const electricityService = {
  /**
   * Purchase electricity
   * @param {Object} purchaseData - Electricity purchase data
   * @param {string} purchaseData.meterNumber - Meter/account number
   * @param {string} purchaseData.service_id - Electricity provider
   * @param {string} purchaseData.variation_id - Meter type (prepaid/postpaid)
   * @param {number} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseElectricity(purchaseData) {
    try {
      console.log('⚡ Starting electricity purchase:', {
        customer_id: purchaseData.meterNumber,
        service_id: purchaseData.service_id,
        variation_id: purchaseData.variation_id,
        amount: purchaseData.amount,
        provider: this.getProviderDisplayName(purchaseData.service_id)
      });

      const response = await apiClient.post('/electricity/purchase', {
        customer_id: purchaseData.meterNumber,
        service_id: purchaseData.service_id.toLowerCase(),
        variation_id: purchaseData.variation_id.toLowerCase(),
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNB',
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Electricity purchase successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          customer_id: response.data.customer_id,
          customer_name: response.data.customer_name,
          amount: response.data.amount,
          service_name: response.data.service_name,
          token: response.data.token,
          units: response.data.units
        });

        return {
          success: true,
          data: {
            orderId: response.data.order_id,
            status: response.data.status,
            customerId: response.data.customer_id,
            customerName: response.data.customer_name,
            customerAddress: response.data.customer_address,
            amount: response.data.amount,
            amountCharged: response.data.amount_charged,
            serviceName: response.data.service_name,
            token: response.data.token,
            units: response.data.units,
            band: response.data.band,
            discount: response.data.discount,
            requestId: response.data.request_id,
            balanceAction: response.data.balance_action,
            paymentDetails: response.data.payment_details,
            securityInfo: response.data.security_info,
            message: response.message || 'Electricity purchase successful'
          }
        };
      } 
      
      // Handle error response - apiClient puts backend message in response.error
      else {
        // The actual backend error message is in response.error
        const backendMessage = response.error || 'Electricity purchase failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ Electricity purchase failed:', {
          backend_message: backendMessage,
          error_code: errorCode,
          requires_action: requiresAction,
          status: statusCode
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          status: statusCode,
          requiresAction: requiresAction
        };
      }

    } catch (error) {
      console.error('❌ Electricity service network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
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
   * Generate standardized error code from backend error message
   * @param {string} errorMessage - Error message from backend
   * @returns {string} Standardized error code
   */
  generateErrorCode(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'PURCHASE_FAILED';
    }
    
    const message = errorMessage.toLowerCase().trim();
    
    // 2FA related errors
    if (message.includes('two-factor authentication')) {
      if (message.includes('not set up') || message.includes('not enabled')) {
        return 'SETUP_2FA_REQUIRED';
      }
      if (message.includes('invalid') || message.includes('incorrect')) {
        return 'INVALID_2FA_CODE';
      }
    }
    
    // PIN related errors
    if (message.includes('password pin') || message.includes('passwordpin')) {
      if (message.includes('not set up') || message.includes('not enabled')) {
        return 'SETUP_PIN_REQUIRED';
      }
      if (message.includes('invalid') || message.includes('incorrect')) {
        return 'INVALID_PASSWORDPIN';
      }
    }
    
    // Balance related errors
    if (message.includes('insufficient balance') || 
        message.includes('not enough funds') || 
        message.includes('balance too low')) {
      return 'INSUFFICIENT_BALANCE';
    }
    
    // KYC and limit related errors
    if (message.includes('kyc limit') || 
        message.includes('transaction limit') || 
        message.includes('limit exceeded') ||
        message.includes('exceeds') && message.includes('limit')) {
      return 'KYC_LIMIT_EXCEEDED';
    }
    
    // Meter number specific errors
    if (message.includes('customer_id') || 
        message.includes('meter number') ||
        message.includes('account number') ||
        message.includes('invalid meter') ||
        message.includes('invalid customer')) {
      return 'INVALID_METER_NUMBER';
    }
    
    // Provider specific errors
    if (message.includes('service_id') || 
        message.includes('invalid service') ||
        message.includes('provider not found') ||
        message.includes('invalid provider')) {
      return 'INVALID_PROVIDER';
    }
    
    // Meter type errors
    if (message.includes('variation_id') || 
        message.includes('meter type') ||
        message.includes('invalid variation') ||
        message.includes('prepaid') || 
        message.includes('postpaid')) {
      return 'INVALID_METER_TYPE';
    }
    
    // Amount related errors
    if (message.includes('amount below minimum') || 
        message.includes('minimum is')) {
      return 'AMOUNT_TOO_LOW';
    }
    
    if (message.includes('amount above maximum') || 
        message.includes('maximum is')) {
      return 'AMOUNT_TOO_HIGH';
    }
    
    // Pending transaction errors
    if (message.includes('pending transaction') || 
        message.includes('already have a pending') ||
        message.includes('transaction is being processed')) {
      return 'PENDING_TRANSACTION_EXISTS';
    }
    
    // Validation related errors
    if (message.includes('validation failed') || 
        message.includes('invalid amount') ||
        message.includes('invalid service') ||
        message.includes('required field')) {
      return 'VALIDATION_ERROR';
    }
    
    // Service/API related errors
    if (message.includes('ebills') || 
        message.includes('service unavailable') ||
        message.includes('temporarily unavailable') ||
        message.includes('api error')) {
      return 'SERVICE_ERROR';
    }
    
    // Default fallback
    return 'PURCHASE_FAILED';
  },

  /**
   * Determine required user action based on error
   * @param {string} errorCode - Generated error code
   * @param {string} errorMessage - Original error message
   * @returns {string|null} Required action type
   */
  getRequiredAction(errorCode, errorMessage) {
    const actionMap = {
      'SETUP_2FA_REQUIRED': 'SETUP_2FA',
      'SETUP_PIN_REQUIRED': 'SETUP_PIN',
      'INVALID_2FA_CODE': 'RETRY_2FA',
      'INVALID_PASSWORDPIN': 'RETRY_PIN',
      'KYC_LIMIT_EXCEEDED': 'UPGRADE_KYC',
      'INSUFFICIENT_BALANCE': 'ADD_FUNDS',
      'INVALID_METER_NUMBER': 'CHECK_METER',
      'INVALID_PROVIDER': 'SELECT_PROVIDER',
      'INVALID_METER_TYPE': 'SELECT_METER_TYPE',
      'AMOUNT_TOO_LOW': 'INCREASE_AMOUNT',
      'AMOUNT_TOO_HIGH': 'REDUCE_AMOUNT',
      'PENDING_TRANSACTION_EXISTS': 'WAIT_PENDING',
      'VALIDATION_ERROR': 'FIX_INPUT',
      'SERVICE_ERROR': 'RETRY_LATER',
      'PURCHASE_FAILED': 'CONTACT_SUPPORT'
    };

    return actionMap[errorCode] || null;
  },

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Generated error code
   * @param {string} originalMessage - Original backend message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorCode, originalMessage) {
    const friendlyMessages = {
      'SETUP_2FA_REQUIRED': 'Two-factor authentication is required for transactions. Please set it up in your security settings.',
      'SETUP_PIN_REQUIRED': 'A password PIN is required for transactions. Please set it up in your security settings.',
      'INVALID_2FA_CODE': 'The 2FA code you entered is incorrect. Please check your authenticator app and try again.',
      'INVALID_PASSWORDPIN': 'The password PIN you entered is incorrect. Please try again.',
      'KYC_LIMIT_EXCEEDED': 'This transaction exceeds your account limit. Please upgrade your verification level.',
      'INSUFFICIENT_BALANCE': 'You don\'t have enough NGNB balance for this transaction. Please add funds to your account.',
      'INVALID_METER_NUMBER': 'The meter/account number you entered is invalid. Please check and try again.',
      'INVALID_PROVIDER': 'Please select a valid electricity provider.',
      'INVALID_METER_TYPE': 'Please select a valid meter type (Prepaid or Postpaid).',
      'AMOUNT_TOO_LOW': 'Minimum electricity purchase amount is ₦1,000.',
      'AMOUNT_TOO_HIGH': 'Maximum electricity purchase amount is ₦100,000.',
      'PENDING_TRANSACTION_EXISTS': 'You have a pending electricity transaction. Please wait for it to complete.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVICE_ERROR': 'The electricity service is temporarily unavailable. Please try again later.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'PURCHASE_FAILED': 'Electricity purchase failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with your electricity purchase. Please try again.');
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
      const validProviders = this.getElectricityProviders().map(p => p.id);
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
      errors: errors
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
      p => p.id.toLowerCase() === providerId?.toLowerCase()
    );
    
    return provider?.name || (providerId || 'Unknown Provider');
  },

  /**
   * Get provider region
   * @param {string} providerId - Provider ID
   * @returns {string} Provider region
   */
  getProviderRegion(providerId) {
    const provider = this.getElectricityProviders().find(
      p => p.id.toLowerCase() === providerId?.toLowerCase()
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
      t => t.id.toLowerCase() === meterTypeId?.toLowerCase()
    );
    
    return meterType?.name || (meterTypeId || 'Unknown');
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
      currency: 'NGNB',
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