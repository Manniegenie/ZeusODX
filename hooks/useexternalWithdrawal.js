import { useState, useEffect, useCallback, useRef } from 'react';
import { withdrawalService } from '../services/externalwithdrawalService';

export const useWithdrawal = () => {
  // Loading states
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Data states
  const [activeWithdrawals, setActiveWithdrawals] = useState([]);
  const [currentWithdrawal, setCurrentWithdrawal] = useState(null);
  const [feeCalculation, setFeeCalculation] = useState(null);

  // Error states
  const [error, setError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [feeError, setFeeError] = useState(null);

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
    setFeeError(null);
  }, []);

  /**
   * Clear specific error
   */
  const clearError = useCallback((errorType) => {
    switch (errorType) {
      case 'withdrawal':
        setError(null);
        break;
      case 'status':
        setStatusError(null);
        break;
      case 'fee':
        setFeeError(null);
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
    } else if (errorText.includes('duplicate') || errorText.includes('pending')) {
      errorCode = 'DUPLICATE_WITHDRAWAL';
    } else if (errorText.includes('fee calculation')) {
      errorCode = 'FEE_CALCULATION_ERROR';
    } else if (errorText.includes('price data')) {
      errorCode = 'PRICE_DATA_ERROR';
    } else {
      errorCode = 'SERVICE_ERROR';
    }

    console.log('🎯 Hook: Mapped to action code:', errorCode, 'requiresAction:', requiresAction);

    return {
      ...result,
      error: errorCode,
      requiresAction: requiresAction,
      originalMessage: result.error || result.message
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
          message: 'Two-factor authentication is required for withdrawals. Please set up 2FA to continue.',
          actionText: 'Setup 2FA',
          route: '/settings/security/2fa',
          priority: 'high'
        };

      case 'SETUP_PIN_REQUIRED':
        return {
          title: 'PIN Setup Required',
          message: 'A password PIN is required for withdrawals. Please set up your PIN to continue.',
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
   * Calculate withdrawal fee and receiver amount
   */
  const calculateFee = useCallback(async (amount, currency, network) => {
    if (!mountedRef.current) return null;

    try {
      setIsCalculatingFee(true);
      setFeeError(null);
      
      console.log('🔄 Hook: Calculating withdrawal fee...');
      
      const result = await withdrawalService.calculateWithdrawalFee(amount, currency, network);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setFeeCalculation(result.data);
        console.log('✅ Hook: Fee calculation successful');
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setFeeError(mappedResult);
        console.log('❌ Hook: Fee calculation failed');
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to calculate withdrawal fee. Please check your connection.',
        requiresAction: null
      };
      
      setFeeError(errorResult);
      console.log('❌ Hook: Fee calculation error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsCalculatingFee(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Initiate crypto withdrawal
   */
  const initiateWithdrawal = useCallback(async (withdrawalData) => {
    if (!mountedRef.current) return null;

    try {
      setIsInitiating(true);
      setError(null);
      
      console.log('🔄 Hook: Initiating crypto withdrawal...');
      
      const result = await withdrawalService.initiateWithdrawal(withdrawalData);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        setCurrentWithdrawal(result.data);
        
        const updatedWithdrawals = withdrawalService.getActiveWithdrawals();
        setActiveWithdrawals(updatedWithdrawals);

        setFeeCalculation(null);

        console.log('✅ Hook: Crypto withdrawal initiated successfully');
        return result;
      } else {
        const mappedResult = mapErrorToAction(result);
        setError(mappedResult);
        console.log('❌ Hook: Crypto withdrawal initiation failed');
        return mappedResult;
      }
    } catch (error) {
      if (!mountedRef.current) return null;

      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to initiate crypto withdrawal. Please check your connection.',
        requiresAction: null
      };
      
      setError(errorResult);
      console.log('❌ Hook: Crypto withdrawal error:', error);
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsInitiating(false);
      }
    }
  }, [mapErrorToAction]);

  /**
   * Check withdrawal status
   */
  const checkWithdrawalStatus = useCallback(async (transactionId) => {
    if (!mountedRef.current || !transactionId) return null;

    try {
      setIsCheckingStatus(true);
      setStatusError(null);

      console.log('🔄 Hook: Checking withdrawal status...');
      
      const result = await withdrawalService.getWithdrawalStatus(transactionId);
      
      if (!mountedRef.current) return null;

      if (result.success) {
        if (currentWithdrawal?.transactionId === transactionId) {
          setCurrentWithdrawal(prev => ({ ...prev, ...result.data }));
        }

        const updatedWithdrawals = withdrawalService.getActiveWithdrawals();
        setActiveWithdrawals(updatedWithdrawals);

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
        message: 'Failed to check withdrawal status',
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
  }, [currentWithdrawal, mapErrorToAction]);

  /**
   * Start polling withdrawal status
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

      const result = await checkWithdrawalStatus(transactionId);
      
      if (result?.success && result.data) {
        const { isCompleted, isFailed } = result.data;
        
        if (isCompleted || isFailed) {
          console.log('🛑 Hook: Stopping status polling - withdrawal finished');
          stopStatusPolling();
        }
      }
    }, interval);
  }, [checkWithdrawalStatus]);

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
   * Reset fee calculation
   */
  const resetFeeCalculation = useCallback(() => {
    setFeeCalculation(null);
    setFeeError(null);
  }, []);

  /**
   * Reset current withdrawal
   */
  const resetCurrentWithdrawal = useCallback(() => {
    setCurrentWithdrawal(null);
    stopStatusPolling();
    clearErrors();
  }, [stopStatusPolling, clearErrors]);

  /**
   * Get withdrawal by transaction ID from active withdrawals
   */
  const getWithdrawalById = useCallback((transactionId) => {
    return activeWithdrawals.find(w => w.transactionId === transactionId);
  }, [activeWithdrawals]);

  // Auto-update active withdrawals periodically
  useEffect(() => {
    const updateActiveWithdrawals = () => {
      if (mountedRef.current) {
        const updated = withdrawalService.getActiveWithdrawals();
        setActiveWithdrawals(updated);
      }
    };

    const interval = setInterval(updateActiveWithdrawals, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    // Loading states
    isCalculatingFee,
    isInitiating,
    isCheckingStatus,
    isLoading: isCalculatingFee || isInitiating || isCheckingStatus,

    // Data states
    activeWithdrawals,
    currentWithdrawal,
    feeCalculation,

    // Error states
    error,
    statusError,
    feeError,
    hasError: !!(error || statusError || feeError),

    // Main actions
    calculateFee,
    initiateWithdrawal,
    checkWithdrawalStatus,

    // Status polling
    startStatusPolling,
    stopStatusPolling,
    isPolling: !!statusPollingRef.current,

    // Utility functions
    getWithdrawalById,
    getErrorAction,

    // Management functions
    resetCurrentWithdrawal,
    resetFeeCalculation,
    clearErrors,
    clearError,

    // Status helpers
    hasActiveWithdrawals: activeWithdrawals.length > 0,
    hasFeeCalculation: !!feeCalculation,
    
    // Cache info (for debugging)
    cacheStatus: withdrawalService.getCacheStatus()
  };
};