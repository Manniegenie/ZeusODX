import { apiClient } from './apiClient';

export const withdrawalService = {
  // Active withdrawals tracking
  activeWithdrawals: new Map(),

  /**
   * Calculate withdrawal fee and receiver amount
   */
  async calculateWithdrawalFee(amount, currency, network) {
    try {
      console.log('🔄 Calculating withdrawal fee:', { amount, currency, network });

      // Client-side validation
      const validation = this.validateFeeCalculationRequest({ amount, currency, network });
      if (!validation.success) {
        console.log('❌ Fee calculation validation failed:', validation.errors);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          errors: validation.errors
        };
      }

      // Prepare request payload
      const payload = {
        amount: Number(amount),
        currency: currency.toUpperCase(),
        network: network?.toUpperCase()
      };

      // Make API request to initiate endpoint (fee preview)
      const response = await apiClient.post('/withdraw/initiate', payload);

      if (response.success) {
        // Access the nested data properly
        const feeData = (response.data && response.data.data) || response.data;
        const respMessage =
          (response.data && response.data.message) ||
          response.message ||
          'Fee calculated successfully';

        console.log('✅ Fee calculation successful:', {
          currency: feeData.currency,
          network: feeData.network,
          amount: feeData.amount,
          fee: feeData.fee,
          receiverAmount: feeData.receiverAmount,
          totalAmount: feeData.totalAmount
        });

        return {
          success: true,
          message: respMessage, // exact server message if present
          data: {
            ...feeData,
            feeFormatted: this.formatWithdrawalAmount(feeData.fee, currency),
            receiverAmountFormatted: this.formatWithdrawalAmount(feeData.receiverAmount, currency),
            totalAmountFormatted: this.formatWithdrawalAmount(feeData.totalAmount, currency),
            feeUsdFormatted: this.formatCurrency(feeData.feeUsd, 'USD')
          }
        };
      } else {
        console.log('❌ Fee calculation API error:', response.error || response.message);
        return this.handleWithdrawalError(response);
      }
    } catch (error) {
      console.log('❌ Fee calculation service error:', error);
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * Initiate crypto withdrawal
   */
  async initiateWithdrawal(withdrawalData) {
    try {
      const {
        destination,
        amount,
        currency,
        twoFactorCode,
        passwordpin,
        memo,
        narration
      } = withdrawalData;

      console.log('🔄 Initiating crypto withdrawal:', {
        currency,
        amount,
        network: destination?.network,
        address: destination?.address?.substring(0, 10) + '...'
      });

      // Client-side validation
      const validation = this.validateWithdrawalRequest(withdrawalData);
      if (!validation.success) {
        console.log('❌ Withdrawal validation failed:', validation.errors);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          errors: validation.errors
        };
      }

      // Prepare request payload
      const payload = {
        destination: {
          address: destination.address.trim(),
          network: destination.network?.toUpperCase(),
          memo: destination.memo?.trim()
        },
        amount: Number(amount),
        currency: currency.toUpperCase(),
        twoFactorCode: twoFactorCode.trim(),
        passwordpin: String(passwordpin).trim(),
        memo: memo?.trim() || null,
        narration: narration?.trim() || null
      };

      // Make API request
      const response = await apiClient.post('/withdraw/crypto', payload);

      if (response.success) {
        // Access the nested data properly
        const wdData = (response.data && response.data.data) || response.data;
        const respMessage =
          (response.data && response.data.message) ||
          response.message ||
          'Crypto withdrawal initiated successfully';

        // Track active withdrawal
        this.trackActiveWithdrawal(wdData.transactionId, {
          ...wdData,
          initiatedAt: new Date().toISOString()
        });

        console.log('✅ Crypto withdrawal initiated successfully:', {
          transactionId: wdData.transactionId,
          obiexTransactionId: wdData.obiexTransactionId,
          currency: wdData.currency,
          network: wdData.network,
          amount: wdData.amount,
          fee: wdData.fee,
          totalAmount: wdData.totalAmount
        });

        return {
          success: true,
          message: respMessage, // exact server message if present
          data: {
            ...wdData
          }
        };
      } else {
        console.log('❌ Withdrawal API error:', response.error || response.message);
        return this.handleWithdrawalError(response);
      }
    } catch (error) {
      console.log('❌ Withdrawal service error:', error);
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * Get withdrawal status by transaction ID
   */
  async getWithdrawalStatus(transactionId) {
    try {
      console.log('📊 Fetching withdrawal status for:', transactionId);

      if (!transactionId) {
        return {
          success: false,
          error: 'INVALID_TRANSACTION_ID',
          message: 'Transaction ID is required'
        };
      }

      const response = await apiClient.get(`/withdraw/status/${transactionId}`);

      if (response.success) {
        // Access the nested data properly
        const statusData = (response.data && response.data.data) || response.data;
        const respMessage =
          (response.data && response.data.message) ||
          response.message ||
          'Withdrawal status retrieved';

        // Update tracked withdrawal if exists
        if (this.activeWithdrawals.has(transactionId)) {
          const existing = this.activeWithdrawals.get(transactionId);
          this.activeWithdrawals.set(transactionId, {
            ...existing,
            ...statusData,
            lastUpdated: new Date().toISOString()
          });
        }

        console.log('✅ Withdrawal status retrieved:', {
          transactionId,
          status: statusData.status,
          currency: statusData.currency,
          network: statusData.network,
          amount: statusData.amount,
          obiexTransactionId: statusData.obiexTransactionId
        });

        return {
          success: true,
          message: respMessage, // exact server message if present
          data: {
            ...statusData,
            statusDescription: this.getStatusDescription(statusData.status),
            isCompleted: ['COMPLETED', 'SUCCESS'].includes(statusData.status),
            isFailed: ['FAILED', 'CANCELLED', 'REJECTED'].includes(statusData.status),
            isPending: ['PENDING', 'PROCESSING'].includes(statusData.status),
            amountFormatted: this.formatWithdrawalAmount(statusData.amount, statusData.currency),
            feeFormatted: this.formatWithdrawalAmount(statusData.fee, statusData.currency)
          }
        };
      } else {
        console.log('❌ Failed to fetch withdrawal status:', response.error || response.message);
        return this.handleWithdrawalError(response);
      }
    } catch (error) {
      console.log('❌ Error fetching withdrawal status:', error);
      return this.handleWithdrawalError(error);
    }
  },

  /**
   * Validate fee calculation request client-side
   */
  validateFeeCalculationRequest(data) {
    const { amount, currency, network } = data;
    const errors = [];

    if (!amount) {
      errors.push('Amount is required');
    }
    if (!currency?.trim()) {
      errors.push('Currency is required');
    }
    if (!network?.trim()) {
      errors.push('Network is required');
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        message: errors.join('; ')
      };
    }

    return { success: true };
  },

  /**
   * Validate withdrawal request client-side
   */
  validateWithdrawalRequest(withdrawalData) {
    const {
      destination,
      amount,
      currency,
      twoFactorCode,
      passwordpin,
      memo
    } = withdrawalData;

    const errors = [];

    if (!destination?.address?.trim()) {
      errors.push('Withdrawal address is required');
    }
    if (!destination?.network?.trim()) {
      errors.push('Network is required');
    }
    if (!amount) {
      errors.push('Withdrawal amount is required');
    }
    if (!currency?.trim()) {
      errors.push('Currency is required');
    }
    if (!twoFactorCode?.trim()) {
      errors.push('Two-factor authentication code is required');
    }
    if (!passwordpin?.trim()) {
      errors.push('Password PIN is required');
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (passwordpin) {
      const pinStr = String(passwordpin).trim();
      if (!/^\d{6}$/.test(pinStr)) {
        errors.push('Password PIN must be exactly 6 digits');
      }
    }

    if (twoFactorCode) {
      const codeStr = String(twoFactorCode).trim();
      if (!/^\d{6}$/.test(codeStr)) {
        errors.push('Two-factor code must be exactly 6 digits');
      }
    }

    if (destination?.address && destination.address.length < 10) {
      errors.push('Invalid withdrawal address format');
    }

    if (memo && memo.length > 200) {
      errors.push('Memo cannot exceed 200 characters');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        message: errors.join('; ')
      };
    }

    return { success: true };
  },

  /**
   * Handle withdrawal errors — preserve exact server message,
   * provide a friendly fallback, and pass through details.
   */
  handleWithdrawalError(errorResponse) {
    // HTTP status
    const statusCode = errorResponse.status || errorResponse.statusCode || 500;

    // Prefer server-provided human text as "raw"
    const raw =
      (typeof errorResponse.message === 'string' && errorResponse.message) ||
      (typeof errorResponse.error === 'string' && errorResponse.error) ||
      null;

    // Try to find a machine-readable code
    const codeFromResponse =
      errorResponse.code ||
      (typeof errorResponse.error === 'string' && /^[A-Z0-9_]+$/.test(errorResponse.error)
        ? errorResponse.error
        : null);

    const errorCode = codeFromResponse || 'SERVICE_ERROR';

    const errorMessages = {
      VALIDATION_ERROR: 'Please check your input and try again',
      INSUFFICIENT_BALANCE: 'Insufficient balance for this withdrawal',
      KYC_LIMIT_EXCEEDED: 'Withdrawal exceeds your KYC limits',
      DUPLICATE_WITHDRAWAL: 'Similar withdrawal is already pending',
      FEE_CALCULATION_ERROR: 'Unable to calculate withdrawal fee',
      PRICE_DATA_ERROR: 'Unable to fetch current price data',
      OBIEX_API_ERROR: 'Withdrawal service temporarily unavailable',
      BALANCE_RESERVATION_ERROR: 'Failed to reserve balance for withdrawal',
      INTERNAL_SERVER_ERROR: 'Withdrawal service temporarily unavailable',
      STATUS_FETCH_ERROR: 'Failed to fetch withdrawal status',
      SERVICE_ERROR: 'Withdrawal failed. Please try again.'
    };

    // message shows the EXACT server message when present; friendlyMessage is your UI-safe fallback
    const friendlyMessage = errorMessages[errorCode] || errorMessages.SERVICE_ERROR;
    const message = raw || friendlyMessage;

    // Pass through any structured details (e.g., KYC)
    const details =
      errorResponse.details ||
      errorResponse.kycDetails ||
      (errorResponse.data && errorResponse.data.kycDetails) ||
      null;

    console.log('❌ Handling withdrawal error:', {
      errorCode,
      statusCode,
      rawMessage: raw,
      friendlyMessage,
      details
    });

    return {
      success: false,
      error: errorCode,     // machine-readable code
      message,              // exact server text when available
      friendlyMessage,      // fallback copy
      rawMessage: raw,      // exact text for UI/debug
      statusCode,
      details               // e.g., { kycLevel, limitType, upgradeRecommendation, ... }
    };
  },

  /**
   * Get human-readable status description
   */
  getStatusDescription(status) {
    const descriptions = {
      PENDING: 'Withdrawal is being processed',
      PROCESSING: 'Withdrawal in progress',
      COMPLETED: 'Withdrawal completed successfully',
      SUCCESS: 'Withdrawal completed successfully',
      FAILED: 'Withdrawal failed',
      CANCELLED: 'Withdrawal was cancelled',
      REJECTED: 'Withdrawal was rejected'
    };
    return descriptions[status] || 'Unknown status';
  },

  /**
   * Track active withdrawal
   */
  trackActiveWithdrawal(transactionId, data) {
    this.activeWithdrawals.set(transactionId, {
      ...data,
      trackedAt: new Date().toISOString()
    });

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, withdrawal] of this.activeWithdrawals.entries()) {
      if (new Date(withdrawal.trackedAt).getTime() < oneDayAgo) {
        this.activeWithdrawals.delete(id);
      }
    }
  },

  /**
   * Get all active tracked withdrawals
   */
  getActiveWithdrawals() {
    return Array.from(this.activeWithdrawals.entries()).map(([id, data]) => ({
      transactionId: id,
      ...data
    }));
  },

  /**
   * Format withdrawal amount with proper decimals
   */
  formatWithdrawalAmount(amount, currency) {
    const formatters = {
      BTC: (amt) => amt.toFixed(8),
      ETH: (amt) => amt.toFixed(6),
      SOL: (amt) => amt.toFixed(6),
      USDT: (amt) => amt.toFixed(2),
      USDC: (amt) => amt.toFixed(2),
      BNB: (amt) => amt.toFixed(4),
      MATIC: (amt) => amt.toFixed(4),
      AVAX: (amt) => amt.toFixed(4)
    };

    const formatter = formatters[currency?.toUpperCase()];
    return formatter ? formatter(amount) : amount.toFixed(4);
  },

  /**
   * Format currency amount
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    }).format(amount);
  },

  /**
   * Clear all withdrawal data
   */
  async clearAllData() {
    console.log('🧹 Clearing all withdrawal data...');
    this.activeWithdrawals.clear();
    console.log('✅ All withdrawal data cleared');
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    return {
      activeWithdrawalsCount: this.activeWithdrawals.size
    };
  }
};
