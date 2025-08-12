// hooks/useUsernameTransfer.js
import { useState, useCallback, useRef } from 'react';
import { usernameTransferService } from '../services/internalTransferService';

export const useUsernameTransfer = () => {
  // State management
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastTransferData, setLastTransferData] = useState(null);

  // Ref to track the current transfer to prevent duplicate requests
  const currentTransferRef = useRef(null);

  /**
   * Reset all states to initial values
   */
  const resetTransfer = useCallback(() => {
    setIsTransferring(false);
    setTransferResult(null);
    setError(null);
    setLastTransferData(null);
    currentTransferRef.current = null;
  }, []);

  /**
   * Clear only error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear only success result
   */
  const clearResult = useCallback(() => {
    setTransferResult(null);
  }, []);

  /**
   * Validate transfer data before making request
   * @param {Object} transferData - Transfer data to validate
   * @returns {Object} Validation result
   */
  const validateTransferData = useCallback((transferData) => {
    return usernameTransferService.validateTransferData(transferData);
  }, []);

  /**
   * Execute username transfer
   * @param {Object} transferData - Transfer parameters
   * @param {string} transferData.recipientUsername - Recipient's username
   * @param {number} transferData.amount - Amount to transfer
   * @param {string} transferData.currency - Currency code
   * @param {string} transferData.twoFactorCode - 2FA code
   * @param {string} transferData.passwordpin - 6-digit password PIN
   * @param {string} [transferData.memo] - Optional memo
   * @returns {Promise<Object>} Transfer result
   */
  const executeTransfer = useCallback(async (transferData) => {
    // Prevent multiple simultaneous transfers
    if (isTransferring || currentTransferRef.current) {
      console.warn('Transfer already in progress, ignoring duplicate request');
      return {
        success: false,
        error: 'TRANSFER_IN_PROGRESS',
        message: 'A transfer is already in progress. Please wait.'
      };
    }

    // Validate transfer data
    const validation = validateTransferData(transferData);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('; ');
      setError({
        code: 'VALIDATION_ERROR',
        message: errorMessage,
        errors: validation.errors,
        requiresAction: 'FIX_INPUT'
      });
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: errorMessage,
        errors: validation.errors
      };
    }

    // Check minimum amount
    const minAmountCheck = usernameTransferService.validateMinimumAmount(
      transferData.amount, 
      transferData.currency
    );
    if (!minAmountCheck.isValid) {
      setError({
        code: 'MINIMUM_AMOUNT_ERROR',
        message: minAmountCheck.message,
        requiresAction: 'FIX_INPUT'
      });
      return {
        success: false,
        error: 'MINIMUM_AMOUNT_ERROR',
        message: minAmountCheck.message
      };
    }

    // Set loading state and clear previous states
    setIsTransferring(true);
    setError(null);
    setTransferResult(null);
    setLastTransferData(transferData);

    // Create transfer identifier for duplicate prevention
    const transferId = `${transferData.recipientUsername}_${transferData.amount}_${transferData.currency}_${Date.now()}`;
    currentTransferRef.current = transferId;

    try {
      console.log('🚀 Initiating username transfer:', {
        recipientUsername: transferData.recipientUsername,
        amount: transferData.amount,
        currency: transferData.currency,
        transferId: transferId
      });

      // Execute the transfer
      const result = await usernameTransferService.transferToUsername(transferData);

      // Check if this is still the current transfer
      if (currentTransferRef.current !== transferId) {
        console.warn('Transfer response received for outdated request, ignoring');
        return {
          success: false,
          error: 'OUTDATED_REQUEST',
          message: 'This transfer request is no longer current'
        };
      }

      if (result.success) {
        // Success case
        setTransferResult({
          ...result.data,
          timestamp: new Date().toISOString(),
          userFriendlyMessage: result.data.message || 'Transfer completed successfully!'
        });
        
        console.log('✅ Username transfer completed successfully:', {
          transactionId: result.data.transactionId,
          transferReference: result.data.transferReference,
          recipient: result.data.recipient.username,
          amount: result.data.amount,
          currency: result.data.currency
        });

        // Clear transfer data after successful transfer
        setLastTransferData(null);
        
        return result;
      } else {
        // Error case
        const userFriendlyMessage = usernameTransferService.getUserFriendlyMessage(
          result.error, 
          result.message
        );

        setError({
          code: result.error,
          message: userFriendlyMessage,
          originalMessage: result.message,
          requiresAction: result.requiresAction,
          details: result.details,
          timestamp: new Date().toISOString()
        });

        console.log('❌ Username transfer failed:', {
          error: result.error,
          message: result.message,
          requiresAction: result.requiresAction
        });

        return result;
      }
    } catch (error) {
      // Network or unexpected error
      if (currentTransferRef.current !== transferId) {
        console.warn('Transfer error received for outdated request, ignoring');
        return {
          success: false,
          error: 'OUTDATED_REQUEST',
          message: 'This transfer request is no longer current'
        };
      }

      console.error('💥 Username transfer service error:', error);

      const errorResult = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.',
        originalMessage: error.message,
        requiresAction: 'RETRY_LATER',
        timestamp: new Date().toISOString()
      };

      setError(errorResult);

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errorResult.message
      };
    } finally {
      setIsTransferring(false);
      currentTransferRef.current = null;
    }
  }, [isTransferring, validateTransferData]);

  /**
   * Retry the last transfer with the same data
   * @returns {Promise<Object>} Transfer result
   */
  const retryTransfer = useCallback(async () => {
    if (!lastTransferData) {
      const errorMessage = 'No previous transfer data available to retry';
      setError({
        code: 'NO_RETRY_DATA',
        message: errorMessage,
        requiresAction: null
      });
      return {
        success: false,
        error: 'NO_RETRY_DATA',
        message: errorMessage
      };
    }

    console.log('🔄 Retrying username transfer');
    return executeTransfer(lastTransferData);
  }, [lastTransferData, executeTransfer]);

  /**
   * Get formatted minimum amount for a currency
   * @param {string} currency - Currency code
   * @returns {string} Formatted minimum amount
   */
  const getMinimumAmount = useCallback((currency) => {
    const minimums = usernameTransferService.getMinimumTransferAmounts();
    const minAmount = minimums[currency?.toUpperCase()] || 0;
    return usernameTransferService.formatAmount(minAmount, currency);
  }, []);

  /**
   * Get supported currencies
   * @returns {Array} Array of supported currencies
   */
  const getSupportedCurrencies = useCallback(() => {
    return usernameTransferService.getSupportedCurrencies();
  }, []);

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  const formatAmount = useCallback((amount, currency) => {
    return usernameTransferService.formatAmount(amount, currency);
  }, []);

  /**
   * Format username for display
   * @param {string} username - Username to format
   * @returns {string} Formatted username with @ prefix
   */
  const formatUsername = useCallback((username) => {
    return usernameTransferService.formatUsername(username);
  }, []);

  /**
   * Get currency information
   * @param {string} currencyCode - Currency code
   * @returns {Object} Currency information
   */
  const getCurrencyInfo = useCallback((currencyCode) => {
    return usernameTransferService.getCurrencyInfo(currencyCode);
  }, []);

  /**
   * Check if a retry is possible
   * @returns {boolean} True if retry is possible
   */
  const canRetry = useCallback(() => {
    return !isTransferring && !!lastTransferData && !!error;
  }, [isTransferring, lastTransferData, error]);

  /**
   * Get transfer status summary
   * @returns {Object} Status summary
   */
  const getStatusSummary = useCallback(() => {
    return {
      isLoading: isTransferring,
      hasError: !!error,
      hasResult: !!transferResult,
      canRetry: canRetry(),
      isIdle: !isTransferring && !error && !transferResult
    };
  }, [isTransferring, error, transferResult, canRetry]);

  // Return the hook interface
  return {
    // State
    isTransferring,
    transferResult,
    error,
    lastTransferData,

    // Actions
    executeTransfer,
    retryTransfer,
    resetTransfer,
    clearError,
    clearResult,

    // Validation and utilities
    validateTransferData,
    getMinimumAmount,
    getSupportedCurrencies,
    formatAmount,
    formatUsername,
    getCurrencyInfo,

    // Status helpers
    canRetry,
    getStatusSummary,

    // Computed states
    hasError: !!error,
    hasResult: !!transferResult,
    isIdle: !isTransferring && !error && !transferResult,
    requiresAction: error?.requiresAction || null,
    errorCode: error?.code || null,
    resultData: transferResult || null
  };
};

export default useUsernameTransfer;