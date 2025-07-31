// services/cableTVService.js
import { apiClient } from './apiClient';

export const cableTVService = {
  /**
   * Purchase cable TV subscription
   * @param {Object} purchaseData - Cable TV purchase data
   * @param {string} purchaseData.customer_id - Smartcard/IUC number
   * @param {string} purchaseData.service_id - Cable TV provider
   * @param {string} purchaseData.variation_id - Package/bouquet ID
   * @param {string} purchaseData.subscription_type - Subscription type (change/renew)
   * @param {number} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseCableTV(purchaseData) {
    try {
      console.log('📺 Starting cable TV purchase:', {
        customer_id: purchaseData.customer_id,
        service_id: purchaseData.service_id,
        variation_id: purchaseData.variation_id,
        subscription_type: purchaseData.subscription_type || 'change',
        amount: purchaseData.amount,
        provider: this.getProviderDisplayName(purchaseData.service_id)
      });

      const response = await apiClient.post('/cabletv/purchase', {
        customer_id: purchaseData.customer_id,
        service_id: purchaseData.service_id.toLowerCase(),
        variation_id: purchaseData.variation_id,
        subscription_type: purchaseData.subscription_type || 'change',
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNZ',
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Cable TV purchase successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          customer_id: response.data.customer_id,
          customer_name: response.data.customer_name,
          amount: response.data.amount,
          service_name: response.data.service_name,
          subscription_type: response.data.subscription_type,
          package_variation: response.data.package_variation
        });

        return {
          success: true,
          data: {
            orderId: response.data.order_id,
            status: response.data.status,
            customerId: response.data.customer_id,
            customerName: response.data.customer_name,
            amount: response.data.amount,
            amountCharged: response.data.amount_charged,
            serviceName: response.data.service_name,
            subscriptionType: response.data.subscription_type,
            packageVariation: response.data.package_variation,
            discount: response.data.discount,
            requestId: response.data.request_id,
            balanceAction: response.data.balance_action,
            paymentDetails: response.data.payment_details,
            securityInfo: response.data.security_info,
            message: response.message || 'Cable TV purchase successful'
          }
        };
      } 
      
      // Handle error response - apiClient puts backend message in response.error
      else {
        // The actual backend error message is in response.error
        const backendMessage = response.error || 'Cable TV purchase failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ Cable TV purchase failed:', {
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
      console.error('❌ Cable TV service network error:', {
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
   * Get available cable TV providers
   * @returns {Array} Available cable TV providers
   */
  getCableTVProviders() {
    return [
      { id: 'dstv', name: 'DStv', description: 'Digital Satellite Television' },
      { id: 'gotv', name: 'GOtv', description: 'Digital Terrestrial Television' },
      { id: 'startimes', name: 'StarTimes', description: 'Digital TV Entertainment' },
      { id: 'showmax', name: 'Showmax', description: 'Video Streaming Service' }
    ];
  },

  /**
   * Get available subscription types
   * @returns {Array} Available subscription types
   */
  getSubscriptionTypes() {
    return [
      { 
        id: 'change', 
        name: 'Change Package', 
        description: 'Switch to a different package/bouquet' 
      },
      { 
        id: 'renew', 
        name: 'Renew Subscription', 
        description: 'Renew current package/bouquet' 
      }
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
    
    // Customer ID specific errors
    if (message.includes('customer_id') || 
        message.includes('smartcard') ||
        message.includes('iuc number') ||
        message.includes('invalid customer') ||
        message.includes('customer validation failed')) {
      return 'INVALID_CUSTOMER_ID';
    }
    
    // Provider specific errors
    if (message.includes('service_id') || 
        message.includes('invalid service') ||
        message.includes('provider not found') ||
        message.includes('invalid provider')) {
      return 'INVALID_PROVIDER';
    }
    
    // Package/variation errors
    if (message.includes('variation_id') || 
        message.includes('package') ||
        message.includes('bouquet') ||
        message.includes('invalid variation') ||
        message.includes('package not found')) {
      return 'INVALID_PACKAGE';
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

    if (message.includes('amount mismatch') || 
        message.includes('price mismatch') ||
        message.includes('amount must match')) {
      return 'AMOUNT_PACKAGE_MISMATCH';
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
      'INVALID_CUSTOMER_ID': 'CHECK_CUSTOMER_ID',
      'INVALID_PROVIDER': 'SELECT_PROVIDER',
      'INVALID_PACKAGE': 'SELECT_PACKAGE',
      'AMOUNT_TOO_LOW': 'INCREASE_AMOUNT',
      'AMOUNT_TOO_HIGH': 'REDUCE_AMOUNT',
      'AMOUNT_PACKAGE_MISMATCH': 'VERIFY_AMOUNT',
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
      'INSUFFICIENT_BALANCE': 'You don\'t have enough NGNZ balance for this transaction. Please add funds to your account.',
      'INVALID_CUSTOMER_ID': 'The smartcard/IUC number you entered is invalid. Please check and try again.',
      'INVALID_PROVIDER': 'Please select a valid cable TV provider.',
      'INVALID_PACKAGE': 'Please select a valid package/bouquet.',
      'AMOUNT_TOO_LOW': 'Minimum cable TV purchase amount is ₦500.',
      'AMOUNT_TOO_HIGH': 'Maximum cable TV purchase amount is ₦50,000.',
      'AMOUNT_PACKAGE_MISMATCH': 'The amount doesn\'t match the selected package price. Please verify the amount.',
      'PENDING_TRANSACTION_EXISTS': 'You have a pending cable TV transaction. Please wait for it to complete.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVICE_ERROR': 'The cable TV service is temporarily unavailable. Please try again later.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'PURCHASE_FAILED': 'Cable TV purchase failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with your cable TV purchase. Please try again.');
  },

  /**
   * Validate cable TV purchase data
   * @param {Object} data - Purchase data to validate
   * @returns {Object} Validation result with errors array
   */
  validatePurchaseData(data) {
    const errors = [];

    // Customer ID (smartcard/IUC number) validation
    if (!data.customer_id?.trim()) {
      errors.push('Smartcard/IUC number is required');
    } else {
      const customerId = data.customer_id.trim();
      if (customerId.length < 8) {
        errors.push('Smartcard/IUC number must be at least 8 characters');
      } else if (customerId.length > 20) {
        errors.push('Smartcard/IUC number must not exceed 20 characters');
      } else if (!/^[a-zA-Z0-9]+$/.test(customerId)) {
        errors.push('Smartcard/IUC number can only contain letters and numbers');
      }
    }

    // Provider validation
    if (!data.service_id?.trim()) {
      errors.push('Cable TV provider is required');
    } else {
      const validProviders = this.getCableTVProviders().map(p => p.id);
      if (!validProviders.includes(data.service_id.toLowerCase())) {
        errors.push('Please select a valid cable TV provider');
      }
    }

    // Package/variation validation
    if (!data.variation_id?.trim()) {
      errors.push('Package/bouquet selection is required');
    } else {
      const variationId = data.variation_id.trim();
      if (variationId.length === 0) {
        errors.push('Package/bouquet must be selected');
      }
    }

    // Subscription type validation
    if (data.subscription_type) {
      const validTypes = ['change', 'renew'];
      if (!validTypes.includes(data.subscription_type.toLowerCase())) {
        errors.push('Subscription type must be "change" or "renew"');
      }
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 500) {
      errors.push('Minimum cable TV purchase amount is ₦500');
    } else if (amount > 50000) {
      errors.push('Maximum cable TV purchase amount is ₦50,000');
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
   * Validate customer ID format
   * @param {string} customerId - Customer ID to validate
   * @returns {boolean} True if valid customer ID format
   */
  validateCustomerId(customerId) {
    if (!customerId || typeof customerId !== 'string') return false;
    
    const cleaned = customerId.trim();
    
    // Basic validation: 8-20 characters, alphanumeric
    if (cleaned.length < 8 || cleaned.length > 20) return false;
    if (!/^[a-zA-Z0-9]+$/.test(cleaned)) return false;
    
    return true;
  },

  /**
   * Format customer ID for display
   * @param {string} customerId - Customer ID to format
   * @returns {string} Formatted customer ID
   */
  formatCustomerId(customerId) {
    if (!customerId) return '';
    
    const cleaned = customerId.toString().trim().replace(/[^a-zA-Z0-9]/g, '');
    
    // Add spaces every 4 characters for readability
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  },

  /**
   * Get provider display name
   * @param {string} providerId - Provider ID
   * @returns {string} Provider display name
   */
  getProviderDisplayName(providerId) {
    const provider = this.getCableTVProviders().find(
      p => p.id.toLowerCase() === providerId?.toLowerCase()
    );
    
    return provider?.name || (providerId || 'Unknown Provider');
  },

  /**
   * Get provider description
   * @param {string} providerId - Provider ID
   * @returns {string} Provider description
   */
  getProviderDescription(providerId) {
    const provider = this.getCableTVProviders().find(
      p => p.id.toLowerCase() === providerId?.toLowerCase()
    );
    
    return provider?.description || '';
  },

  /**
   * Get subscription type display name
   * @param {string} subscriptionTypeId - Subscription type ID
   * @returns {string} Subscription type display name
   */
  getSubscriptionTypeDisplayName(subscriptionTypeId) {
    const subscriptionType = this.getSubscriptionTypes().find(
      t => t.id.toLowerCase() === subscriptionTypeId?.toLowerCase()
    );
    
    return subscriptionType?.name || (subscriptionTypeId || 'Unknown');
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
   * Get cable TV purchase limits
   * @returns {Object} Purchase limits
   */
  getPurchaseLimits() {
    return {
      minimum: 500,
      maximum: 50000,
      currency: 'NGNZ',
      formattedMinimum: this.formatAmount(500),
      formattedMaximum: this.formatAmount(50000)
    };
  },

  /**
   * Get popular cable TV amounts
   * @returns {Array} Popular cable TV amounts
   */
  getPopularAmounts() {
    return [
      { amount: 2500, label: '₦2,500', popular: true },
      { amount: 4000, label: '₦4,000', popular: true },
      { amount: 6300, label: '₦6,300', popular: true },
      { amount: 9000, label: '₦9,000', popular: true },
      { amount: 15700, label: '₦15,700', popular: true },
      { amount: 21000, label: '₦21,000', popular: false }
    ];
  },

  /**
   * Format customer name for display
   * @param {string} customerName - Customer name
   * @returns {string} Formatted customer name
   */
  formatCustomerName(customerName) {
    if (!customerName) return '';
    
    return customerName.toString().trim();
  },

  /**
   * Get provider icon
   * @param {string} providerId - Provider ID
   * @returns {string} Provider icon name or path
   */
  getProviderIcon(providerId) {
    const iconMap = {
      'dstv': 'dstv-icon',
      'gotv': 'gotv-icon', 
      'startimes': 'startimes-icon',
      'showmax': 'showmax-icon'
    };
    
    return iconMap[providerId?.toLowerCase()] || 'default-tv-icon';
  },

  /**
   * Check if provider supports packages
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if provider supports package selection
   */
  providerSupportsPackages(providerId) {
    // All cable TV providers support package selection
    const validProviders = this.getCableTVProviders().map(p => p.id);
    return validProviders.includes(providerId?.toLowerCase());
  },

  /**
   * Get default subscription type
   * @returns {string} Default subscription type
   */
  getDefaultSubscriptionType() {
    return 'change';
  }
};