// services/bettingService.js
import { apiClient } from './apiClient';

export const bettingService = {
  /**
   * Fund betting account
   * @param {Object} fundingData - Betting funding data
   * @param {string} fundingData.userId - Betting account user ID
   * @param {string} fundingData.service_id - Betting provider
   * @param {number} fundingData.amount - Amount to fund
   * @param {string} fundingData.twoFactorCode - 2FA code
   * @param {string} fundingData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Funding response
   */
  async fundBettingAccount(fundingData) {
    try {
      console.log('🎰 Starting betting account funding:', {
        customer_id: fundingData.userId,
        service_id: fundingData.service_id,
        amount: fundingData.amount,
        provider: this.getProviderDisplayName(fundingData.service_id)
      });

      const response = await apiClient.post('/betting/fund', {
        customer_id: fundingData.userId,
        service_id: fundingData.service_id,
        amount: parseFloat(fundingData.amount),
        payment_currency: 'NGNZ',
        twoFactorCode: fundingData.twoFactorCode,
        passwordpin: fundingData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Betting funding successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          customer_id: response.data.customer_id,
          customer_name: response.data.customer_name,
          amount: response.data.amount,
          service_name: response.data.service_name,
          customer_username: response.data.customer_username
        });

        return {
          success: true,
          data: {
            orderId: response.data.order_id,
            status: response.data.status,
            customerId: response.data.customer_id,
            customerName: response.data.customer_name,
            customerUsername: response.data.customer_username,
            customerEmail: response.data.customer_email_address,
            customerPhone: response.data.customer_phone_number,
            amount: response.data.amount,
            amountCharged: response.data.amount_charged,
            serviceName: response.data.service_name,
            discount: response.data.discount,
            requestId: response.data.request_id,
            balanceAction: response.data.balance_action,
            paymentDetails: response.data.payment_details,
            securityInfo: response.data.security_info,
            message: response.message || 'Betting account funding successful'
          }
        };
      } 
      
      // Handle error response - apiClient puts backend message in response.error
      else {
        // The actual backend error message is in response.error
        const backendMessage = response.error || 'Betting funding failed';
        const statusCode = response.status || 400;
        const errorCode = this.generateErrorCode(backendMessage);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);
        
        console.log('❌ Betting funding failed:', {
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
      console.error('❌ Betting service network error:', {
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
   * Get available betting providers
   * @returns {Array} Available betting providers
   */
  getBettingProviders() {
    return [
      { id: '1xBet', name: '1xBet', displayName: '1xBet', category: 'Sports Betting' },
      { id: 'BangBet', name: 'BangBet', displayName: 'BangBet', category: 'Sports Betting' },
      { id: 'Bet9ja', name: 'Bet9ja', displayName: 'Bet9ja', category: 'Sports Betting' },
      { id: 'BetKing', name: 'BetKing', displayName: 'BetKing', category: 'Sports Betting' },
      { id: 'BetLand', name: 'BetLand', displayName: 'BetLand', category: 'Sports Betting' },
      { id: 'BetLion', name: 'BetLion', displayName: 'BetLion', category: 'Sports Betting' },
      { id: 'BetWay', name: 'BetWay', displayName: 'Betway', category: 'Sports Betting' },
      { id: 'CloudBet', name: 'CloudBet', displayName: 'CloudBet', category: 'Crypto Betting' },
      { id: 'LiveScoreBet', name: 'LiveScoreBet', displayName: 'LiveScore Bet', category: 'Sports Betting' },
      { id: 'MerryBet', name: 'MerryBet', displayName: 'MerryBet', category: 'Sports Betting' },
      { id: 'NaijaBet', name: 'NaijaBet', displayName: 'NaijaBet', category: 'Sports Betting' },
      { id: 'NairaBet', name: 'NairaBet', displayName: 'NairaBet', category: 'Sports Betting' },
      { id: 'SupaBet', name: 'SupaBet', displayName: 'SupaBet', category: 'Sports Betting' }
    ];
  },

  /**
   * Generate standardized error code from backend error message
   * @param {string} errorMessage - Error message from backend
   * @returns {string} Standardized error code
   */
  generateErrorCode(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'FUNDING_FAILED';
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
    
    // User ID specific errors
    if (message.includes('customer_id') || 
        message.includes('user id') ||
        message.includes('account id') ||
        message.includes('invalid customer') ||
        message.includes('customer not found')) {
      return 'INVALID_USER_ID';
    }
    
    // Provider specific errors
    if (message.includes('service_id') || 
        message.includes('invalid service') ||
        message.includes('provider not found') ||
        message.includes('invalid provider') ||
        message.includes('betting provider')) {
      return 'INVALID_PROVIDER';
    }
    
    // Amount related errors
    if (message.includes('amount below minimum') || 
        message.includes('minimum is') ||
        message.includes('minimum amount')) {
      return 'AMOUNT_TOO_LOW';
    }
    
    if (message.includes('amount above maximum') || 
        message.includes('maximum is') ||
        message.includes('maximum amount')) {
      return 'AMOUNT_TOO_HIGH';
    }
    
    // Pending transaction errors
    if (message.includes('pending transaction') || 
        message.includes('already have a pending') ||
        message.includes('transaction is being processed') ||
        message.includes('duplicate')) {
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
        message.includes('api error') ||
        message.includes('betting api')) {
      return 'SERVICE_ERROR';
    }
    
    // Account verification errors
    if (message.includes('account verification') ||
        message.includes('verify account') ||
        message.includes('account not verified')) {
      return 'ACCOUNT_VERIFICATION_REQUIRED';
    }
    
    // Default fallback
    return 'FUNDING_FAILED';
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
      'INVALID_USER_ID': 'CHECK_USER_ID',
      'INVALID_PROVIDER': 'SELECT_PROVIDER',
      'AMOUNT_TOO_LOW': 'INCREASE_AMOUNT',
      'AMOUNT_TOO_HIGH': 'REDUCE_AMOUNT',
      'PENDING_TRANSACTION_EXISTS': 'WAIT_PENDING',
      'VALIDATION_ERROR': 'FIX_INPUT',
      'SERVICE_ERROR': 'RETRY_LATER',
      'ACCOUNT_VERIFICATION_REQUIRED': 'VERIFY_ACCOUNT',
      'FUNDING_FAILED': 'CONTACT_SUPPORT'
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
      'SETUP_2FA_REQUIRED': 'Two-factor authentication is required for betting transactions. Please set it up in your security settings.',
      'SETUP_PIN_REQUIRED': 'A password PIN is required for betting transactions. Please set it up in your security settings.',
      'INVALID_2FA_CODE': 'The 2FA code you entered is incorrect. Please check your authenticator app and try again.',
      'INVALID_PASSWORDPIN': 'The password PIN you entered is incorrect. Please try again.',
      'KYC_LIMIT_EXCEEDED': 'This transaction exceeds your account limit. Please upgrade your verification level.',
      'INSUFFICIENT_BALANCE': 'You don\'t have enough NGNZ balance for this transaction. Please add funds to your account.',
      'INVALID_USER_ID': 'The User ID you entered is invalid. Please check your betting account details and try again.',
      'INVALID_PROVIDER': 'Please select a valid betting provider.',
      'AMOUNT_TOO_LOW': 'Minimum betting funding amount is ₦1,000.',
      'AMOUNT_TOO_HIGH': 'Maximum betting funding amount is ₦100,000.',
      'PENDING_TRANSACTION_EXISTS': 'You have a pending betting transaction. Please wait for it to complete.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVICE_ERROR': 'The betting service is temporarily unavailable. Please try again later.',
      'ACCOUNT_VERIFICATION_REQUIRED': 'Your betting account needs to be verified. Please contact the betting provider.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'FUNDING_FAILED': 'Betting account funding failed. Please try again.'
    };

    // Return friendly message or fall back to original if it's informative
    return friendlyMessages[errorCode] || 
           (originalMessage && originalMessage.length > 10 ? originalMessage : 
            'Something went wrong with your betting account funding. Please try again.');
  },

  /**
   * Validate betting funding data
   * @param {Object} data - Funding data to validate
   * @returns {Object} Validation result with errors array
   */
  validateFundingData(data) {
    const errors = [];

    // User ID validation
    if (!data.userId?.trim()) {
      errors.push('User ID is required');
    } else {
      const userId = data.userId.trim();
      if (userId.length < 3) {
        errors.push('User ID must be at least 3 characters');
      } else if (userId.length > 50) {
        errors.push('User ID must not exceed 50 characters');
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(userId)) {
        errors.push('User ID can only contain letters, numbers, underscores, periods, and hyphens');
      }
    }

    // Provider validation
    if (!data.service_id?.trim()) {
      errors.push('Betting provider is required');
    } else {
      const validProviders = this.getBettingProviders().map(p => p.id);
      if (!validProviders.includes(data.service_id)) {
        errors.push('Please select a valid betting provider');
      }
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 1000) {
      errors.push('Minimum betting funding amount is ₦1,000');
    } else if (amount > 100000) {
      errors.push('Maximum betting funding amount is ₦100,000');
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
   * Validate user ID format
   * @param {string} userId - User ID to validate
   * @returns {boolean} True if valid user ID format
   */
  validateUserId(userId) {
    if (!userId || typeof userId !== 'string') return false;
    
    const cleaned = userId.trim();
    
    // Basic validation: 3-50 characters, alphanumeric with special chars
    if (cleaned.length < 3 || cleaned.length > 50) return false;
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleaned)) return false;
    
    return true;
  },

  /**
   * Format user ID for display
   * @param {string} userId - User ID to format
   * @returns {string} Formatted user ID
   */
  formatUserId(userId) {
    if (!userId) return '';
    
    // Keep original case and trim whitespace
    return userId.toString().trim();
  },

  /**
   * Get provider display name
   * @param {string} providerId - Provider ID
   * @returns {string} Provider display name
   */
  getProviderDisplayName(providerId) {
    const provider = this.getBettingProviders().find(
      p => p.id === providerId
    );
    
    return provider?.displayName || (providerId || 'Unknown Provider');
  },

  /**
   * Get provider category
   * @param {string} providerId - Provider ID
   * @returns {string} Provider category
   */
  getProviderCategory(providerId) {
    const provider = this.getBettingProviders().find(
      p => p.id === providerId
    );
    
    return provider?.category || 'Sports Betting';
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
   * Get betting funding limits
   * @returns {Object} Funding limits
   */
  getFundingLimits() {
    return {
      minimum: 1000,
      maximum: 100000,
      currency: 'NGNZ',
      formattedMinimum: this.formatAmount(1000),
      formattedMaximum: this.formatAmount(100000)
    };
  },

  /**
   * Get popular betting amounts
   * @returns {Array} Popular betting amounts
   */
  getPopularAmounts() {
    return [
      { amount: 1000, label: '₦1,000', popular: true },
      { amount: 2000, label: '₦2,000', popular: true },
      { amount: 5000, label: '₦5,000', popular: true },
      { amount: 10000, label: '₦10,000', popular: true },
      { amount: 20000, label: '₦20,000', popular: true },
      { amount: 50000, label: '₦50,000', popular: false }
    ];
  },

  /**
   * Check if provider is valid
   * @param {string} providerId - Provider ID to check
   * @returns {boolean} True if provider is valid
   */
  isValidProvider(providerId) {
    const providers = this.getBettingProviders();
    return providers.some(provider => provider.id === providerId);
  },

  /**
   * Get providers by category
   * @param {string} category - Provider category
   * @returns {Array} Providers in the specified category
   */
  getProvidersByCategory(category) {
    return this.getBettingProviders().filter(
      provider => provider.category === category
    );
  },

  /**
   * Format betting transaction status
   * @param {string} status - Transaction status
   * @returns {Object} Formatted status with display info
   */
  formatTransactionStatus(status) {
    const statusMap = {
      'completed-api': {
        display: 'Completed',
        color: '#10B981',
        icon: '✅',
        description: 'Your betting account has been funded successfully'
      },
      'initiated-api': {
        display: 'Initiated',
        color: '#F59E0B',
        icon: '🔄',
        description: 'Your funding request has been initiated'
      },
      'processing-api': {
        display: 'Processing',
        color: '#3B82F6',
        icon: '⏳',
        description: 'Your betting account funding is being processed'
      },
      'failed': {
        display: 'Failed',
        color: '#EF4444',
        icon: '❌',
        description: 'Your betting account funding failed'
      },
      'refunded': {
        display: 'Refunded',
        color: '#6B7280',
        icon: '💰',
        description: 'Your funding has been refunded'
      }
    };

    return statusMap[status] || {
      display: status || 'Unknown',
      color: '#6B7280',
      icon: '❓',
      description: 'Status unknown'
    };
  },

  /**
   * Generate transaction reference
   * @param {string} orderId - Order ID
   * @param {string} providerId - Provider ID
   * @returns {string} Transaction reference
   */
  generateTransactionReference(orderId, providerId) {
    if (!orderId) return '';
    
    const providerCode = providerId ? providerId.substring(0, 3).toUpperCase() : 'BET';
    const shortOrderId = orderId.toString().slice(-8);
    
    return `${providerCode}-${shortOrderId}`;
  },

  /**
   * Calculate estimated funding time
   * @param {string} providerId - Provider ID
   * @returns {string} Estimated time
   */
  getEstimatedFundingTime(providerId) {
    // Most betting providers process instantly or within minutes
    const timeMap = {
      'Bet9ja': '1-2 minutes',
      'BetWay': '1-2 minutes',
      'NairaBet': '1-3 minutes',
      'MerryBet': '1-3 minutes',
      'CloudBet': '2-5 minutes'
    };

    return timeMap[providerId] || '1-5 minutes';
  },

  /**
   * Validate user ID for specific provider
   * @param {string} userId - User ID to validate
   * @param {string} providerId - Provider ID
   * @returns {Object} Validation result with provider-specific rules
   */
  validateUserIdForProvider(userId, providerId) {
    if (!this.validateUserId(userId)) {
      return {
        isValid: false,
        error: 'Invalid User ID format'
      };
    }

    // Provider-specific validation rules
    const providerRules = {
      'Bet9ja': {
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9]+$/,
        hint: 'Bet9ja User ID should be alphanumeric'
      },
      'BetWay': {
        minLength: 5,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9._-]+$/,
        hint: 'Betway User ID can contain letters, numbers, dots, underscores, and hyphens'
      },
      'NairaBet': {
        minLength: 4,
        maxLength: 25,
        pattern: /^[a-zA-Z0-9]+$/,
        hint: 'NairaBet User ID should be alphanumeric'
      }
    };

    const rules = providerRules[providerId];
    if (!rules) {
      return { isValid: true }; // No specific rules, use general validation
    }

    const cleanUserId = userId.trim();

    if (cleanUserId.length < rules.minLength) {
      return {
        isValid: false,
        error: `User ID must be at least ${rules.minLength} characters for ${this.getProviderDisplayName(providerId)}`
      };
    }

    if (cleanUserId.length > rules.maxLength) {
      return {
        isValid: false,
        error: `User ID must not exceed ${rules.maxLength} characters for ${this.getProviderDisplayName(providerId)}`
      };
    }

    if (!rules.pattern.test(cleanUserId)) {
      return {
        isValid: false,
        error: rules.hint
      };
    }

    return { isValid: true };
  },

  /**
   * Get funding fee information
   * @param {number} amount - Funding amount
   * @param {string} providerId - Provider ID
   * @returns {Object} Fee information
   */
  getFundingFeeInfo(amount, providerId) {
    // Most betting providers don't charge fees, but some might
    const feeStructure = {
      'CloudBet': { percentage: 0.01, minimum: 10 }, // 1% fee, min ₦10
      // Other providers have no fees
    };

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        fee: 0,
        total: 0,
        hasFee: false
      };
    }

    const providerFee = feeStructure[providerId];
    if (!providerFee) {
      return {
        fee: 0,
        total: numAmount,
        hasFee: false,
        message: 'No fees charged'
      };
    }

    const calculatedFee = Math.max(
      numAmount * providerFee.percentage,
      providerFee.minimum
    );

    return {
      fee: calculatedFee,
      total: numAmount + calculatedFee,
      hasFee: true,
      feePercentage: providerFee.percentage * 100,
      message: `${providerFee.percentage * 100}% fee (minimum ₦${providerFee.minimum})`
    };
  },

  /**
   * Search providers by name or category
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered providers
   */
  searchProviders(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return this.getBettingProviders();
    }

    const term = searchTerm.toLowerCase().trim();
    return this.getBettingProviders().filter(provider =>
      provider.name.toLowerCase().includes(term) ||
      provider.displayName.toLowerCase().includes(term) ||
      provider.category.toLowerCase().includes(term)
    );
  },

  /**
   * Get betting categories
   * @returns {Array} Unique categories
   */
  getBettingCategories() {
    const providers = this.getBettingProviders();
    const categories = [...new Set(providers.map(p => p.category))];
    return categories.sort();
  },

  /**
   * Format user ID hint for provider
   * @param {string} providerId - Provider ID
   * @returns {string} User ID format hint
   */
  getUserIdHint(providerId) {
    const hints = {
      'Bet9ja': 'Enter your Bet9ja username or phone number',
      'BetWay': 'Enter your Betway username or email address',
      'NairaBet': 'Enter your NairaBet username',
      'MerryBet': 'Enter your MerryBet username or phone number',
      'CloudBet': 'Enter your CloudBet username',
      'LiveScoreBet': 'Enter your LiveScore Bet username'
    };

    return hints[providerId] || 'Enter your betting account username or ID';
  }
};