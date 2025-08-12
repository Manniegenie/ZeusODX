import { useState, useEffect, useCallback, useRef } from 'react';
import { internalTransferService } from '../services/internalTransferService';

export const useInternalTransfer = () => {
  // Loading states
  const [isInitiating, setIsInitiating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Data states
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [currentTransfer, setCurrentTransfer] = useState(null);

  // Error states
  const [error, setError] = useState(null);
  const [statusError, setStatusError] = useState(null);

  // Refs for cleanup and polling
  const statusPollingRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setStatusError(null);
  }, []);

  /**
   * Clear specific error
   */
  const clearError = useCallback((errorType) => {
    switch (errorType) {
      case 'transfer':
        setError(null);
        break;
      case 'status':
        setStatusError(null);
        break;
      default:
        clearErrors();
    }
  }, [clearErrors]);

  /**
   * Map API error messages to action codes and error types
   */
  const mapErrorToAction = useCallback((result) => {
    if (!result) return result;

    // Check both message and error fields for the actual error content
    // The service layer may transform the original message, so check error field first
    let errorText = '';
    if (result.error && typeof result.error === 'string') {
      errorText = result.error.toLowerCase();
    } else if (result.message) {
      errorText = result.message.toLowerCase();
    }

    if (!errorText) return result;

    console.log('🔍 Hook: Analyzing error text:', errorText);

    let requiresAction = null;
    let errorCode = 'GENERAL_ERROR';

    // Check for specific error patterns
    if (errorText.includes('two-factor authentication is not set up') || 
        errorText.includes('2fa') && errorText.includes('not enabled') ||
        errorText.includes('please enable 2fa first')) {
      requiresAction = 'SETUP_2FA_REQUIRED';
      errorCode = 'SETUP_2FA_REQUIRED';
    } else if (errorText.includes('password pin') && errorText.includes('not set up')) {
      requiresAction = 'SETUP_PIN_REQUIRED';
      errorCode = 'SETUP_PIN_REQUIRED';
    } else if (errorText.includes('password pin') && errorText.includes('invalid')) {
      requiresAction = 'RETRY_PIN';
      errorCode = 'INVALID_PASSWORDPIN';
    } else if (errorText.includes('two-factor') && (errorText.includes('invalid') || errorText.includes('incorrect'))) {
      requiresAction = 'RETRY_2FA';
      errorCode = 'INVALID_2FA_CODE';
    } else if (errorText.includes('insufficient balance')) {
      errorCode = 'INSUFFICIENT_BALANCE';
    } else if (errorText.includes('limit exceeded') || errorText.includes('daily limit')) {
      errorCode = 'KYC_LIMIT_EXCEEDED';
    } else if (errorText.includes('network') || errorText.includes('connection')) {
      errorCode = 'NETWORK_ERROR';
    } else if (errorText.includes('validation') || errorText.includes('invalid')) {
      errorCode = 'VALIDATION_ERROR';
    } else {
      errorCode = 'SERVICE_ERROR';
    }

    console.log('🎯 Hook: Mapped to action code:', errorCode, 'requiresAction:', requiresAction);

    return {
      ...result,
      error: errorCode,
      requiresAction: requiresAction,
      originalMessage: result.error || result.message // Preserve original message
    };
  }, []);

  /**
   * Get error action configuration
   */
  const getErrorAction = useCallback((actionCode) => {
    switch (actionCode) {
      case 'SETUP_2FA_REQUIRED':
        return {
          title: '2FA Setup Required',
          message: 'Two-factor authentication is required for transfers. Please set up 2FA to continue.',
          actionText: 'Setup 2FA',
          route: '/settings/security/2fa',
          priority: 'high'
        };

      case 'SETUP_PIN_REQUIRED':
        return {
          title: 'PIN Setup Required',
          message: 'A password PIN is required for transfers. Please set up your PIN to continue.',
          actionText: 'Setup PIN',
          route: '/settings/security/pin',
          priority: 'high'
        };

      case 'RETRY_PIN':
        return {
          title: 'Invalid PIN',
          message: 'The password PIN you entered is incorrect. Please try again.',
          actionText: 'Retry PIN',
          priority: 'medium'
        };

      case 'RETRY_2FA':
        return {
          title: 'Invalid 2FA Code',
          message: 'The two-factor authentication code is incorrect. Please try again.',
          actionText: 'Retry 2FA',
          priority: 'medium'
        };

      default:
        return null;
    }
  }, []);

  /**
   * Initiate internal transfer
   */
  const initiateTransfer = useCallback(async (transferData) => {
    if (!mountedRef.current) return null;

    try {
      setIsInitiating(true);
      setError(null);
      
      console.log('🔄 Hook: Initiating internal transfer...');
      
      const result = await internalTransferService.initiateInternalTransfer(transferData);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setCurrentTransfer(result.data);
        
        // Update active transfers
        const updatedTransfers = internalTransferService.getActiveTransfers();
        setActiveTransfers(updatedTransfers);

        console.log('✅ Hook: Internal transfer initiated successfully');
        return result;
      } else {
        // Map the error to include action codes
        const mappedResult = mapErrorToAction(result);
        setError(mappedResult);
        
        console.log('❌ Hook: Internal transfer initiation failed');
        console.log('❌ Mapped result:', {
          error: mappedResult.error,
          requiresAction: mappedResult.requiresAction,
          message: mappedResult.message
        });
        
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to initiate internal transfer. Please check your connection.',
        requiresAction: null
      };
      
      setError(errorResult);
      console.log('❌ Hook: Internal transfer error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsInitiating(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Check internal transfer status
   */
  const checkTransferStatus = useCallback(async (transactionId) => {
    if (!mountedRef.current || !transactionId) return null;

    try {
      setIsCheckingStatus(true);
      setStatusError(null);

      console.log('🔄 Hook: Checking internal transfer status...');
      
      const result = await internalTransferService.getInternalTransferStatus(transactionId);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        // Update current transfer if it matches
        if (currentTransfer?.transactionId === transactionId) {
          setCurrentTransfer(prev => ({ ...prev, ...result.data }));
        }

        // Update active transfers
        const updatedTransfers = internalTransferService.getActiveTransfers();
        setActiveTransfers(updatedTransfers);

        console.log('✅ Hook: Status check completed');
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setStatusError(mappedResult);
        console.log('❌ Hook: Status check failed');
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to check internal transfer status',
        requiresAction: null
      };
      
      setStatusError(errorResult);
      console.log('❌ Hook: Status check error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsCheckingStatus(false);
      }
    }
  }, [currentTransfer, mapErrorToAction]);

  /**
   * Start polling transfer status
   */
  const startStatusPolling = useCallback((transactionId, interval = 15000) => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    console.log('🔄 Hook: Starting status polling for:', transactionId);

    statusPollingRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        clearInterval(statusPollingRef.current);
        return;
      }

      const result = await checkTransferStatus(transactionId);
      
      if (result?.success && result.data) {
        const { isCompleted, isFailed } = result.data;
        
        // Stop polling if transfer is completed or failed
        if (isCompleted || isFailed) {
          console.log('🛑 Hook: Stopping status polling - transfer finished');
          stopStatusPolling();
        }
      }
    }, interval);
  }, [checkTransferStatus]);

  /**
   * Stop status polling
   */
  const stopStatusPolling = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
      console.log('🛑 Hook: Status polling stopped');
    }
  }, []);

  /**
   * Format transfer amount for display
   */
  const formatAmount = useCallback((amount, currency) => {
    return internalTransferService.formatTransferAmount(amount, currency);
  }, []);

  /**
   * Format currency amount for display
   */
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    return internalTransferService.formatCurrency(amount, currency);
  }, []);

  /**
   * Validate transfer data
   */
  const validateTransfer = useCallback((transferData) => {
    return internalTransferService.validateInternalTransferRequest(transferData);
  }, []);

  /**
   * Reset current transfer
   */
  const resetCurrentTransfer = useCallback(() => {
    setCurrentTransfer(null);
    stopStatusPolling();
    clearErrors();
  }, [stopStatusPolling, clearErrors]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    console.log('🔄 Hook: Refreshing all transfer data...');
    
    // Update active transfers
    const updatedTransfers = internalTransferService.getActiveTransfers();
    setActiveTransfers(updatedTransfers);
    
    // Check current transfer status if exists
    if (currentTransfer?.transactionId) {
      await checkTransferStatus(currentTransfer.transactionId);
    }
    
    console.log('✅ Hook: All data refreshed');
  }, [currentTransfer, checkTransferStatus]);

  /**
   * Get transfer by transaction ID from active transfers
   */
  const getTransferById = useCallback((transactionId) => {
    return activeTransfers.find(t => t.transactionId === transactionId);
  }, [activeTransfers]);

  /**
   * Check if transfer is retryable
   */
  const isTransferRetryable = useCallback((transferError) => {
    return internalTransferService.isErrorRetryable(transferError?.error);
  }, []);

  // Auto-update active transfers periodically
  useEffect(() => {
    const updateActiveTransfers = () => {
      if (mountedRef.current) {
        const updated = internalTransferService.getActiveTransfers();
        setActiveTransfers(updated);
      }
    };

    const interval = setInterval(updateActiveTransfers, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // Loading states
    isInitiating,
    isCheckingStatus,
    isLoading: isInitiating || isCheckingStatus,

    // Data states
    activeTransfers,
    currentTransfer,

    // Error states
    error,
    statusError,
    hasError: !!(error || statusError),

    // Main actions
    initiateTransfer,
    checkTransferStatus,

    // Status polling
    startStatusPolling,
    stopStatusPolling,
    isPolling: !!statusPollingRef.current,

    // Utility functions
    formatAmount,
    formatCurrency,
    validateTransfer,
    getTransferById,
    isTransferRetryable,
    getErrorAction, // Added this export

    // Management functions
    resetCurrentTransfer,
    refreshAll,
    clearErrors,
    clearError,

    // Status helpers
    hasActiveTransfers: activeTransfers.length > 0,
    
    // Cache info (for debugging)
    cacheStatus: internalTransferService.getCacheStatus()
  };
};