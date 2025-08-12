import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const internalTransferService = {
  // Active transfers tracking
  activeTransfers: new Map(),

  /**
   * Initiate internal transfer with comprehensive validation
   */
  async initiateInternalTransfer(transferData) {
    try {
      const {
        recipientUsername,
        amount,
        currency,
        twoFactorCode,
        passwordpin,
        memo
      } = transferData;

      console.log('🔄 Initiating internal transfer:', {
        recipientUsername,
        currency,
        amount
      });

      // Client-side validation
      const validation = this.validateInternalTransferRequest(transferData);
      if (!validation.success) {
        console.log('❌ Internal transfer validation failed:', validation.errors);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.message,
          errors: validation.errors
        };
      }

      // Prepare request payload
      const payload = {
        recipientUsername: recipientUsername.trim(),
        amount: Number(amount),
        currency: currency.toUpperCase(),
        twoFactorCode: twoFactorCode.trim(),
        passwordpin: String(passwordpin).trim(),
        memo: memo?.trim() || null
      };

      // Make API request
      const response = await apiClient.post('/username-withdraw/internal', payload);

      if (response.success) {
        const transferData = response.data;
        
        // Track active transfer
        this.trackActiveTransfer(transferData.transactionId, {
          ...transferData,
          initiatedAt: new Date().toISOString()
        });

        console.log('✅ Internal transfer initiated successfully:', {
          transactionId: transferData.transactionId,
          transferReference: transferData.transferReference,
          currency: transferData.currency,
          amount: transferData.amount,
          recipient: transferData.recipient.username,
          status: transferData.status
        });

        return {
          success: true,
          data: {
            ...transferData,
            message: 'Internal transfer completed successfully'
          }
        };
      } else {
        console.log('❌ Internal transfer API error:', response.error);
        return this.handleTransferError(response);
      }
    } catch (error) {
      console.log('❌ Internal transfer service error:', error);
      return this.handleTransferError(error);
    }
  },

  /**
   * Get internal transfer status by transaction ID
   */
  async getInternalTransferStatus(transactionId) {
    try {
      console.log('📊 Fetching internal transfer status for:', transactionId);

      if (!transactionId) {
        return {
          success: false,
          error: 'INVALID_TRANSACTION_ID',
          message: 'Transaction ID is required'
        };
      }

      const response = await apiClient.get(`/transfer/internal/status/${transactionId}`);

      if (response.success) {
        const statusData = response.data;
        
        // Update tracked transfer if exists
        if (this.activeTransfers.has(transactionId)) {
          const existing = this.activeTransfers.get(transactionId);
          this.activeTransfers.set(transactionId, {
            ...existing,
            ...statusData,
            lastUpdated: new Date().toISOString()
          });
        }

        console.log('✅ Internal transfer status retrieved:', {
          transactionId,
          type: statusData.type,
          status: statusData.status,
          currency: statusData.currency,
          amount: statusData.amount
        });

        return {
          success: true,
          data: {
            ...statusData,
            statusDescription: this.getStatusDescription(statusData.status),
            isCompleted: ['COMPLETED', 'SUCCESS'].includes(statusData.status),
            isFailed: ['FAILED', 'CANCELLED', 'REJECTED'].includes(statusData.status),
            isPending: ['PENDING', 'PROCESSING'].includes(statusData.status),
            isSent: statusData.type === 'INTERNAL_TRANSFER_SENT',
            isReceived: statusData.type === 'INTERNAL_TRANSFER_RECEIVED'
          }
        };
      } else {
        console.log('❌ Failed to fetch internal transfer status:', response.error);
        return {
          success: false,
          error: response.error || 'STATUS_FETCH_ERROR',
          message: 'Failed to fetch internal transfer status'
        };
      }
    } catch (error) {
      console.log('❌ Error fetching internal transfer status:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error occurred while fetching status'
      };
    }
  },

  /**
   * Validate internal transfer request client-side
   */
  validateInternalTransferRequest(transferData) {
    const {
      recipientUsername,
      amount,
      currency,
      twoFactorCode,
      passwordpin,
      memo
    } = transferData;

    const errors = [];

    // Required fields validation
    if (!recipientUsername?.trim()) {
      errors.push('Recipient username is required');
    }
    if (!amount) {
      errors.push('Transfer amount is required');
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

    // Amount validation
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.push('Amount must be a positive number');
    }

    // Password PIN format validation
    if (passwordpin) {
      const pinStr = String(passwordpin).trim();
      if (!/^\d{6}$/.test(pinStr)) {
        errors.push('Password PIN must be exactly 6 digits');
      }
    }

    // 2FA code format validation
    if (twoFactorCode) {
      const codeStr = String(twoFactorCode).trim();
      if (!/^\d{6}$/.test(codeStr)) {
        errors.push('Two-factor code must be exactly 6 digits');
      }
    }

    // Username format validation
    if (recipientUsername && recipientUsername.trim().length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    // Username format - only alphanumeric and underscore
    if (recipientUsername && !/^[a-zA-Z0-9_]+$/.test(recipientUsername.trim())) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Memo validation
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
   * Handle internal transfer errors with user-friendly messages
   */
  handleTransferError(errorResponse) {
    const error = errorResponse.error || errorResponse.message || 'Unknown error';
    const statusCode = errorResponse.status || errorResponse.statusCode || 500;

    // Map backend errors to user-friendly messages
    const errorMessages = {
      'VALIDATION_ERROR': 'Please check your input and try again',
      'INSUFFICIENT_BALANCE': 'Insufficient balance for this transfer',
      'KYC_LIMIT_EXCEEDED': 'Transfer exceeds your KYC limits',
      'DUPLICATE_TRANSFER': 'Similar transfer is already pending',
      'RECIPIENT_NOT_FOUND': 'Recipient user not found',
      'TRANSFER_EXECUTION_FAILED': 'Failed to complete transfer',
      'INTERNAL_SERVER_ERROR': 'Transfer service temporarily unavailable'
    };

    const userMessage = errorMessages[error] || 'Transfer failed. Please try again.';

    console.log('❌ Handling internal transfer error:', { error, statusCode, userMessage });

    return {
      success: false,
      error,
      message: userMessage,
      statusCode,
      isRetryable: this.isErrorRetryable(error)
    };
  },

  /**
   * Check if error is retryable
   */
  isErrorRetryable(error) {
    const retryableErrors = [
      'NETWORK_ERROR',
      'INTERNAL_SERVER_ERROR',
      'TRANSFER_EXECUTION_FAILED'
    ];
    return retryableErrors.includes(error);
  },

  /**
   * Get human-readable status description
   */
  getStatusDescription(status) {
    const descriptions = {
      'PENDING': 'Transfer is being processed',
      'PROCESSING': 'Transfer in progress',
      'COMPLETED': 'Transfer completed successfully',
      'SUCCESS': 'Transfer completed successfully',
      'FAILED': 'Transfer failed',
      'CANCELLED': 'Transfer was cancelled',
      'REJECTED': 'Transfer was rejected'
    };
    return descriptions[status] || 'Unknown status';
  },

  /**
   * Track active transfer
   */
  trackActiveTransfer(transactionId, data) {
    this.activeTransfers.set(transactionId, {
      ...data,
      trackedAt: new Date().toISOString()
    });

    // Clean up old tracked transfers (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [id, transfer] of this.activeTransfers.entries()) {
      if (new Date(transfer.trackedAt).getTime() < oneDayAgo) {
        this.activeTransfers.delete(id);
      }
    }
  },

  /**
   * Get all active tracked transfers
   */
  getActiveTransfers() {
    return Array.from(this.activeTransfers.entries()).map(([id, data]) => ({
      transactionId: id,
      ...data
    }));
  },

  /**
   * Format transfer amount with proper decimals
   */
  formatTransferAmount(amount, currency) {
    const formatters = {
      'BTC': (amt) => amt.toFixed(8),
      'ETH': (amt) => amt.toFixed(6),
      'SOL': (amt) => amt.toFixed(6),
      'USDT': (amt) => amt.toFixed(2),
      'USDC': (amt) => amt.toFixed(2),
      'BNB': (amt) => amt.toFixed(4),
      'DOGE': (amt) => amt.toFixed(4),
      'MATIC': (amt) => amt.toFixed(4),
      'AVAX': (amt) => amt.toFixed(4),
      'NGNZ': (amt) => amt.toFixed(0)
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
   * Clear all transfer data
   */
  async clearAllData() {
    console.log('🧹 Clearing all transfer data...');
    
    // Clear active transfers
    this.activeTransfers.clear();
    
    console.log('✅ All transfer data cleared');
  },

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    return {
      activeTransfersCount: this.activeTransfers.size
    };
  }
};