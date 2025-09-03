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
  const clearError = useCallback(
    (errorType) => {
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
    },
    [clearErrors]
  );

  /**
   * Map API error messages to action codes and error types
   * NOTE: does NOT overwrite result.message. Adds displayMessage.
   */
  const mapErrorToAction = useCallback((result) => {
    if (!result) return result;

    // Prefer rawMessage/error/message as the basis for parsing and display
    const basis =
      (typeof result.rawMessage === 'string' && result.rawMessage) ||
      (typeof result.error === 'string' && result.error) ||
      (typeof result.message === 'string' && result.message) ||
      '';
    const errorText = basis.toLowerCase();

    if (!errorText) {
      return { ...result, displayMessage: result.rawMessage || result.message || null };
    }

    console.log('🔍 Hook: Analyzing error text:', errorText);

    let requiresAction = null;
    let code = result.error || 'GENERAL_ERROR';

    if (
      errorText.includes('two-factor authentication is not set up') ||
      (errorText.includes('2fa') && errorText.includes('not enabled')) ||
      errorText.includes('please enable 2fa first')
    ) {
      requiresAction = 'SETUP_2FA_REQUIRED';
      code = 'SETUP_2FA_REQUIRED';
    } else if (errorText.includes('password pin') && errorText.includes('not set up')) {
      requiresAction = 'SETUP_PIN_REQUIRED';
      code = 'SETUP_PIN_REQUIRED';
    } else if (errorText.includes('password pin') && errorText.includes('invalid')) {
      requiresAction = 'RETRY_PIN';
      code = 'INVALID_PASSWORDPIN';
    } else if (errorText.includes('two-factor') && (errorText.includes('invalid') || errorText.includes('incorrect'))) {
      requiresAction = 'RETRY_2FA';
      code = 'INVALID_2FA_CODE';
    } else if (errorText.includes('insufficient balance')) {
      code = 'INSUFFICIENT_BALANCE';
    } else if (
      errorText.includes('limit exceeded') ||
      errorText.includes('daily limit') ||
      errorText.includes('exceeds your kyc limits')
    ) {
      code = 'KYC_LIMIT_EXCEEDED';
      requiresAction = 'UPGRADE_KYC'; // explicit CTA to upgrade KYC
    } else if (errorText.includes('network') || errorText.includes('connection')) {
      code = 'NETWORK_ERROR';
    } else if (errorText.includes('validation') || errorText.includes('invalid')) {
      code = 'VALIDATION_ERROR';
    } else if (errorText.includes('duplicate') || errorText.includes('pending')) {
      code = 'DUPLICATE_WITHDRAWAL';
    } else if (errorText.includes('fee calculation')) {
      code = 'FEE_CALCULATION_ERROR';
    } else if (errorText.includes('price data')) {
      code = 'PRICE_DATA_ERROR';
    } else {
      code = 'SERVICE_ERROR';
    }

    console.log('🎯 Hook: Mapped to action code:', code, 'requiresAction:', requiresAction);

    return {
      ...result,
      code,                     // mapped code for UI logic
      requiresAction,           // for CTA handling
      originalMessage: result.rawMessage || result.message || null,
      displayMessage: result.rawMessage || result.message || null // <- show EXACT server text by default
    };
  }, []);

  /**
   * Get error action configuration (includes KYC upgrade CTA)
   */
  const getErrorAction = useCallback((actionCode, details) => {
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
      case 'UPGRADE_KYC':
        return {
          title: 'Increase Your Limits',
          message:
            details?.upgradeRecommendation ||
            'Upgrade your KYC to increase your daily withdrawal limits.',
          actionText: 'Upgrade KYC',
          route: '/settings/verification', // adjust to your route
          priority: 'high',
          meta: details || null
        };
      default:
        return null;
    }
  }, []);

  /**
   * Calculate withdrawal fee and receiver amount
   */
  const calculateFee = useCallback(
    async (amount, currency, network) => {
      if (!mountedRef.current) return null;

      try {
        setIsCalculatingFee(true);
        setFeeError(null);

        console.log('🔄 Hook: Calculating withdrawal fee...');

        const result = await withdrawalService.calculateWithdrawalFee(amount, currency, network);

        if (!mountedRef.current) return null;

        if (result.success) {
          // keep service message in state so UI can show it directly
          setFeeCalculation({ ...result.data, message: result.message });
          console.log('✅ Hook: Fee calculation successful');
          return result;
        } else {
          const mappedResult = mapErrorToAction(result);
          setFeeError(mappedResult);
          console.log('❌ Hook: Fee calculation failed');
          return mappedResult;
        }
      } catch (err) {
        if (!mountedRef.current) return null;

        const errorResult = {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Failed to calculate withdrawal fee. Please check your connection.',
          requiresAction: null,
          displayMessage: 'Failed to calculate withdrawal fee. Please check your connection.'
        };

        setFeeError(errorResult);
        console.log('❌ Hook: Fee calculation error:', err);
        return errorResult;
      } finally {
        if (mountedRef.current) {
          setIsCalculatingFee(false);
        }
      }
    },
    [mapErrorToAction]
  );

  /**
   * Initiate crypto withdrawal
   */
  const initiateWithdrawal = useCallback(
    async (withdrawalData) => {
      if (!mountedRef.current) return null;

      try {
        setIsInitiating(true);
        setError(null);

        console.log('🔄 Hook: Initiating crypto withdrawal...');

        const result = await withdrawalService.initiateWithdrawal(withdrawalData);

        if (!mountedRef.current) return null;

        if (result.success) {
          // keep service message
          setCurrentWithdrawal({ ...result.data, message: result.message });

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
      } catch (err) {
        if (!mountedRef.current) return null;

        const errorResult = {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Failed to initiate crypto withdrawal. Please check your connection.',
          requiresAction: null,
          displayMessage: 'Failed to initiate crypto withdrawal. Please check your connection.'
        };

        setError(errorResult);
        console.log('❌ Hook: Crypto withdrawal error:', err);
        return errorResult;
      } finally {
        if (mountedRef.current) {
          setIsInitiating(false);
        }
      }
    },
    [mapErrorToAction]
  );

  /**
   * Check withdrawal status
   */
  const checkWithdrawalStatus = useCallback(
    async (transactionId) => {
      if (!mountedRef.current || !transactionId) return null;

      try {
        setIsCheckingStatus(true);
        setStatusError(null);

        console.log('🔄 Hook: Checking withdrawal status...');

        const result = await withdrawalService.getWithdrawalStatus(transactionId);

        if (!mountedRef.current) return null;

        if (result.success) {
          if (currentWithdrawal?.transactionId === transactionId) {
            setCurrentWithdrawal((prev) => ({
              ...prev,
              ...result.data,
              message: result.message
            }));
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
      } catch (err) {
        if (!mountedRef.current) return null;

        const errorResult = {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Failed to check withdrawal status',
          requiresAction: null,
          displayMessage: 'Failed to check withdrawal status'
        };

        setStatusError(errorResult);
        console.log('❌ Hook: Status check error:', err);
        return errorResult;
      } finally {
        if (mountedRef.current) {
          setIsCheckingStatus(false);
        }
      }
    },
    [currentWithdrawal, mapErrorToAction]
  );

  /**
   * Start polling withdrawal status
   */
  const startStatusPolling = useCallback(
    (transactionId, interval = 15000) => {
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
    },
    [checkWithdrawalStatus]
  );

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
  const getWithdrawalById = useCallback(
    (transactionId) => {
      return activeWithdrawals.find((w) => w.transactionId === transactionId);
    },
    [activeWithdrawals]
  );

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
