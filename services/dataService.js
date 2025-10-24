// services/dataService.js
import { apiClient } from './apiClient';

export const dataService = {
  /**
   * Purchase data
   * @param {Object} purchaseData - Data purchase data
   * @param {string} purchaseData.phone - Phone number
   * @param {string} purchaseData.service_id - Network provider (mtn, airtel, glo, 9mobile)
   * @param {string} purchaseData.variation_id - Data plan variation ID
   * @param {number} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseData(purchaseData) {
    try {
      console.log('📊 Starting data purchase:', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id,
        variation_id: purchaseData.variation_id,
        amount: purchaseData.amount,
        network: this.getNetworkDisplayName(purchaseData.service_id)
      });

      // FIXED: Use same field names as airtime and electricity endpoints
      const response = await apiClient.post('/data/purchase', {
        phone: purchaseData.phone,                                    // FIXED: Changed from phone_number to phone
        service_id: purchaseData.service_id.toLowerCase(),
        variation_id: purchaseData.variation_id,                      // FIXED: Removed service_type field
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNZ',                                     // FIXED: Changed from NGNB to NGNZ
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Data purchase successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          phone: response.data.phone,
          amount: response.data.amount,
          service_name: response.data.service_name,
          plan_details: response.data.plan_details
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
            planDetails: response.data.plan_details,
            paymentDetails: response.data.payment_details,
            securityInfo: response.data.security_info,
            message: response.message || 'Data purchase successful'
          }
        };
      } 
      
      // Handle error response - apiClient puts backend message in response.error
      else {
        // The actual backend error message is in response.error
        const backendMessage = response.error || 'Data purchase failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ Data purchase failed:', {
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
      console.error('❌ Data service network error:', {
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
   * Get available data plans for a network
   * @param {string} serviceId - Network provider (mtn, airtel, glo, 9mobile)
   * @returns {Promise<Object>} Available data plans
   */
  async getDataPlans(serviceId) {
    try {
      console.log('📋 Fetching data plans for:', this.getNetworkDisplayName(serviceId));

      // FIXED: Use correct endpoint and payload format to match your backend
      const response = await apiClient.post('/plans/plans', {
        service_id: `${serviceId.toLowerCase()}_data`
      });

      if (response.success && response.data) {
        // Handle the nested data structure from the backend
        const apiData = response.data.data || response.data;
        
        console.log('✅ Data plans fetched successfully:', {
          network: this.getNetworkDisplayName(serviceId),
          plans_count: apiData.plans_by_provider?.[`${serviceId.toLowerCase()}_data`]?.length || 0
        });

        // Extract plans for the specific service from the grouped response
        const servicePlans = apiData.plans_by_provider?.[`${serviceId.toLowerCase()}_data`] || [];

        return {
          success: true,
          data: servicePlans.map(plan => ({
            variationId: plan.variation_id,
            name: plan.data_plan,
            description: plan.data_plan,
            price: parseFloat(plan.price),
            dataAllowance: this.formatDataAllowance(plan.data_plan),
            validity: this.extractValidityFromDataPlan(plan.data_plan),
            network: serviceId.toLowerCase(),
            formattedPrice: plan.price_formatted,
            formattedData: this.formatDataAllowance(plan.data_plan)
          })),
          message: response.message || 'Data plans loaded successfully'
        };
      } else {
        const backendMessage = response.error || 'Failed to load data plans';
        const errorCode = this.generateErrorCode(backendMessage);
        
        console.log('❌ Failed to fetch data plans:', {
          backend_message: backendMessage,
          error_code: errorCode,
          network: serviceId
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Data plans fetch network error:', {
        error: error.message,
        network: serviceId
      });
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to load data plans. Please check your connection.',
        data: []
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
    
    // Data plan specific errors
    if (message.includes('variation_id') || 
        message.includes('data plan') ||
        message.includes('plan not found') ||
        message.includes('invalid plan')) {
      return 'INVALID_DATA_PLAN';
    }
    
    // Amount mismatch errors
    if (message.includes('amount mismatch') || 
        message.includes('amount does not match') ||
        message.includes('price mismatch')) {
      return 'AMOUNT_PLAN_MISMATCH';
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
      'INVALID_DATA_PLAN': 'SELECT_PLAN',
      'AMOUNT_PLAN_MISMATCH': 'CHECK_AMOUNT',
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
      'INSUFFICIENT_BALANCE': 'You don\'t have enough NGNZ balance for this transaction. Please add funds to your account.',
      'INVALID_DATA_PLAN': 'The selected data plan is invalid or no longer available. Please select a different plan.',
      'AMOUNT_PLAN_MISMATCH': 'The amount you entered doesn\'t match the selected data plan price. Please check and try again.',
      'PENDING_TRANSACTION_EXISTS': 'You have a pending data transaction. Please wait for it to complete.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVICE_ERROR': 'The data service is temporarily unavailable. Please try again later.',
      'PROVIDER_ERROR': 'There\'s an issue with the network provider. Please try again or contact support.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'PURCHASE_FAILED': 'Data purchase failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with your data purchase. Please try again.');
  },

  /**
   * Validate data purchase data
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

    // Data plan validation
    if (!data.variation_id?.trim()) {
      errors.push('Data plan selection is required');
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 99) {
      errors.push('Minimum data purchase is ₦99');
    } else if (amount > 50000) {
      errors.push('Maximum data purchase is ₦50,000');
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
   * Format data allowance for display
   * @param {string} dataAllowance - Data allowance (e.g., "1GB", "500MB")
   * @returns {string} Formatted data allowance
   */
  formatDataAllowance(dataAllowance) {
    if (!dataAllowance) return '';
    
    // Clean up the data allowance string
    const cleaned = dataAllowance.toString().toUpperCase().trim();
    
    // Add space between number and unit if missing
    return cleaned.replace(/(\d)([A-Z])/g, '$1 $2');
  },

  /**
   * Parse data allowance to get numeric value for sorting
   * @param {string} dataAllowance - Data allowance (e.g., "1GB", "500MB")
   * @returns {number} Numeric value in MB for comparison
   */
  parseDataAllowanceToMB(dataAllowance) {
    if (!dataAllowance) return 0;
    
    const cleaned = dataAllowance.toString().toUpperCase().trim();
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB|TB)/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'TB': return value * 1024 * 1024;
      case 'GB': return value * 1024;
      case 'MB': return value;
      case 'KB': return value / 1024;
      default: return 0;
    }
  },

  /**
   * Sort data plans by price (ascending)
   * @param {Array} plans - Array of data plans
   * @returns {Array} Sorted data plans
   */
  sortPlansByPrice(plans) {
    return [...plans].sort((a, b) => a.price - b.price);
  },

  /**
   * Sort data plans by data allowance (ascending)
   * @param {Array} plans - Array of data plans
   * @returns {Array} Sorted data plans
   */
  sortPlansByData(plans) {
    return [...plans].sort((a, b) => {
      const aValue = this.parseDataAllowanceToMB(a.dataAllowance);
      const bValue = this.parseDataAllowanceToMB(b.dataAllowance);
      return aValue - bValue;
    });
  },

  /**
   * Filter data plans by price range
   * @param {Array} plans - Array of data plans
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} Filtered data plans
   */
  filterPlansByPriceRange(plans, minPrice, maxPrice) {
    return plans.filter(plan => plan.price >= minPrice && plan.price <= maxPrice);
  },

  /**
   * Get popular data plan amounts/ranges
   * @returns {Array} Array of popular data plan ranges
   */
  getPopularDataRanges() {
    return [
      { id: 'daily', label: 'Daily Plans', priceRange: [50, 500], popular: true },
      { id: 'weekly', label: 'Weekly Plans', priceRange: [300, 1500], popular: true },
      { id: 'monthly', label: 'Monthly Plans', priceRange: [1000, 15000], popular: true },
      { id: 'premium', label: 'Premium Plans', priceRange: [10000, 50000], popular: false }
    ];
  },

  /**
   * Get validity period display text
   * @param {string} validity - Validity period from API
   * @returns {string} Formatted validity text
   */
  formatValidityPeriod(validity) {
    if (!validity) return '';
    
    // Common validity patterns
    const patterns = {
      '1 day': '24 hours',
      '7 days': '1 week',
      '30 days': '1 month',
      '90 days': '3 months',
      '365 days': '1 year'
    };
    
    const cleaned = validity.toString().toLowerCase().trim();
    return patterns[cleaned] || validity;
  }
};