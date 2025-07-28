// services/airtimeService.js
import { apiClient } from './apiClient';

export const airtimeService = {
  /**
   * Purchase airtime
   * @param {Object} purchaseData - Airtime purchase data
   * @param {string} purchaseData.phone - Phone number
   * @param {string} purchaseData.service_id - Network provider (mtn, airtel, glo, 9mobile)
   * @param {number} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseAirtime(purchaseData) {
    try {
      console.log('📱 Starting airtime purchase:', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id,
        amount: purchaseData.amount,
        network: this.getNetworkDisplayName(purchaseData.service_id)
      });

      const response = await apiClient.post('/airtime/purchase', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id.toLowerCase(),
        amount: parseFloat(purchaseData.amount),
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Airtime purchase successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          phone: response.data.phone,
          amount: response.data.amount,
          service_name: response.data.service_name
        });

        return {
          success: true,
          data: {
            orderId: response.data.order_id,
            status: response.data.status,
            phone: response.data.phone,
            amount: response.data.amount,
            serviceName: response.data.service_name,
            requestId: response.data.request_id,
            balanceAction: response.data.balance_action,
            message: response.message || 'Airtime purchase successful'
          }
        };
      } 
      
      // Handle error response - apiClient puts backend message in response.error
      else {
        // The actual backend error message is in response.error
        const backendMessage = response.error || 'Airtime purchase failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ Airtime purchase failed:', {
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
      console.error('❌ Airtime service network error:', {
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
    
    // Pending transaction errors
    if (message.includes('pending transaction') || 
        message.includes('already have a pending') ||
        message.includes('transaction is being processed')) {
      return 'PENDING_TRANSACTION_EXISTS';
    }
    
    // Validation related errors
    if (message.includes('validation failed') || 
        message.includes('invalid phone') || 
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
    
    // Network provider errors
    if (message.includes('network provider') || 
        message.includes('operator') ||
        message.includes('carrier')) {
      return 'PROVIDER_ERROR';
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
      'PENDING_TRANSACTION_EXISTS': 'WAIT_PENDING',
      'VALIDATION_ERROR': 'FIX_INPUT',
      'SERVICE_ERROR': 'RETRY_LATER',
      'PROVIDER_ERROR': 'CONTACT_SUPPORT'
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
      'INSUFFICIENT_BALANCE': 'You don\'t have enough balance for this transaction. Please add funds to your account.',
      'PENDING_TRANSACTION_EXISTS': 'You have a pending airtime transaction. Please wait for it to complete.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVICE_ERROR': 'The airtime service is temporarily unavailable. Please try again later.',
      'PROVIDER_ERROR': 'There\'s an issue with the network provider. Please try again or contact support.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'PURCHASE_FAILED': 'Airtime purchase failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with your airtime purchase. Please try again.');
  },

  /**
   * Validate airtime purchase data
   * @param {Object} data - Purchase data to validate
   * @returns {Object} Validation result with errors array
   */
  validatePurchaseData(data) {
    const errors = [];

    // Phone number validation
    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    } else {
      const phone = data.phone.replace(/\D/g, '');
      if (phone.length < 10) {
        errors.push('Phone number is too short');
      } else if (phone.length > 16) {
        errors.push('Phone number is too long');
      } else if (!this.isValidNigerianPhone(phone)) {
        errors.push('Please enter a valid Nigerian phone number');
      }
    }

    // Network provider validation
    if (!data.service_id?.trim()) {
      errors.push('Network provider is required');
    } else {
      const validNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
      if (!validNetworks.includes(data.service_id.toLowerCase())) {
        errors.push('Please select a valid network provider');
      }
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 100) {
      errors.push('Minimum airtime purchase is ₦100');
    } else if (amount > 50000) {
      errors.push('Maximum airtime purchase is ₦50,000');
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
   * Check if phone number is a valid Nigerian number
   * @param {string} phone - Phone number (digits only)
   * @returns {boolean} True if valid Nigerian number
   */
  isValidNigerianPhone(phone) {
    // Nigerian phone number patterns
    const patterns = [
      /^234[7-9]\d{9}$/,     // +234 format (234 + 7/8/9 + 9 digits)
      /^0[7-9]\d{9}$/,       // 0 format (0 + 7/8/9 + 9 digits)
      /^[7-9]\d{9}$/         // Raw format (7/8/9 + 9 digits)
    ];
    
    return patterns.some(pattern => pattern.test(phone));
  },

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to standard 0XXXXXXXXXX format for display
    if (cleaned.startsWith('234')) {
      return `0${cleaned.slice(3)}`;
    } else if (cleaned.startsWith('0')) {
      return cleaned;
    } else if (cleaned.length === 10 && /^[7-9]/.test(cleaned)) {
      return `0${cleaned}`;
    } else {
      return phone; // Return as-is if can't format
    }
  },

  /**
   * Get network provider display name
   * @param {string} serviceId - Service ID (mtn, airtel, glo, 9mobile)
   * @returns {string} Display name
   */
  getNetworkDisplayName(serviceId) {
    const networkNames = {
      'mtn': 'MTN',
      'airtel': 'Airtel',
      'glo': 'Glo',
      '9mobile': '9mobile'
    };
    
    return networkNames[serviceId?.toLowerCase()] || (serviceId || 'Unknown');
  },

  /**
   * Get network provider color theme
   * @param {string} serviceId - Service ID
   * @returns {string} Brand color
   */
  getNetworkColor(serviceId) {
    const networkColors = {
      'mtn': '#FFCC02',      // MTN Yellow
      'airtel': '#FF0000',   // Airtel Red
      'glo': '#00A651',      // Glo Green
      '9mobile': '#00AA4F'   // 9mobile Green
    };
    
    return networkColors[serviceId?.toLowerCase()] || '#6B7280';
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
   * Get quick pick amounts for airtime
   * @returns {Array} Array of quick pick options
   */
  getQuickPickAmounts() {
    return [
      { id: 'n100', value: 100, label: '₦100', popular: false },
      { id: 'n200', value: 200, label: '₦200', popular: true },
      { id: 'n500', value: 500, label: '₦500', popular: true },
      { id: 'n1000', value: 1000, label: '₦1000', popular: true },
      { id: 'n2000', value: 2000, label: '₦2000', popular: false },
      { id: 'n5000', value: 5000, label: '₦5000', popular: false }
    ];
  }
};