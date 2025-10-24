// hooks/useElectricity.js
import { useCallback, useState } from 'react';
import { electricityService } from '../services/electricityService';

/**
 * Custom hook for electricity purchases
 * Works with RAW backend response: { code, message, data }
 */
export const useElectricity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [meterTypes, setMeterTypes] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedMeterType, setSelectedMeterType] = useState(null);

  /** Clear all errors */
  const clearErrors = useCallback(() => setError(null), []);

  /**
   * Purchase electricity
   * @param {Object} purchaseData - Electricity purchase details
   * @returns {Promise<{code:string, message:string, data:any}>} RAW backend response
   */
  const purchaseElectricity = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);

    try {
      // Local validation first (returns app-style validation errors)
      const validation = electricityService.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        const rawError = {
          code: 'error',
          message: validation.errors[0] || 'Validation failed',
          data: { errors: validation.errors }
        };
        setError(rawError.message);
        return rawError;
      }

      // Call service → returns RAW backend payload or backend error body
      const res = await electricityService.purchaseElectricity(purchaseData);

      // Normalize hook state only (do not change the returned payload)
      if (!res || res.code !== 'success') {
        // Optionally derive a UI action using our helper maps
        const errorCode = electricityService.generateErrorCode(res?.message || '');
        setError(res?.message || errorCode || 'Purchase failed');
      }

      return res; // return RAW response unchanged
    } catch (err) {
      console.error('❌ Electricity purchase hook error:', err);
      const fallback = {
        code: 'error',
        message: 'An unexpected error occurred. Please try again.',
        data: null
      };
      setError(fallback.message);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Get available electricity providers */
  const getElectricityProviders = useCallback(async () => {
    try {
      const providersList = await electricityService.getElectricityProviders();
      setProviders(providersList);
      return providersList;
    } catch (error) {
      console.error('❌ useElectricity: Error getting providers:', error);
      const staticProviders = electricityService.getStaticElectricityProviders();
      setProviders(staticProviders);
      return staticProviders;
    }
  }, []);

  /** Validate electricity customer using PayBeta */
  const validateElectricityCustomer = useCallback(async (validationData) => {
    try {
      return await electricityService.validateElectricityCustomer(validationData);
    } catch (error) {
      console.error('❌ useElectricity: Error validating customer:', error);
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Customer validation failed'
      };
    }
  }, []);

  /** Get available meter types */
  const getMeterTypes = useCallback(() => {
    const meterTypesList = electricityService.getMeterTypes();
    setMeterTypes(meterTypesList);
    return meterTypesList;
  }, []);

  /** Provider selectors */
  const selectProvider = useCallback((provider) => setSelectedProvider(provider), []);
  const clearSelectedProvider = useCallback(() => setSelectedProvider(null), []);

  /** Meter type selectors */
  const selectMeterType = useCallback((meterType) => setSelectedMeterType(meterType), []);
  const clearSelectedMeterType = useCallback(() => setSelectedMeterType(null), []);

  /** Utilities passthrough */
  const validateMeterNumber = useCallback((meterNumber) => electricityService.validateMeterNumber(meterNumber), []);
  const formatMeterNumber = useCallback((meterNumber) => electricityService.formatMeterNumber(meterNumber), []);
  const getProviderDisplayName = useCallback((providerId) => electricityService.getProviderDisplayName(providerId), []);
  const getProviderRegion = useCallback((providerId) => electricityService.getProviderRegion(providerId), []);
  const getMeterTypeDisplayName = useCallback((meterTypeId) => electricityService.getMeterTypeDisplayName(meterTypeId), []);
  const formatAmount = useCallback((amount) => electricityService.formatAmount(amount), []);
  const getPurchaseLimits = useCallback(() => electricityService.getPurchaseLimits(), []);
  const getPopularAmounts = useCallback(() => electricityService.getPopularAmounts(), []);
  const formatElectricityUnits = useCallback((units) => electricityService.formatElectricityUnits(units), []);
  const formatElectricityToken = useCallback((token) => electricityService.formatElectricityToken(token), []);

  /**
   * Error action mapping for UI
   * Accepts a requiresAction string from your own mapping helpers (if you use them)
   */
  const getErrorAction = useCallback((requiresAction) => {
    const errorActions = {
      RETRY_2FA: {
        title: 'Invalid 2FA Code',
        message: 'The two-factor authentication code you entered is invalid. Please check your authenticator app and try again.',
        actionText: 'Retry 2FA',
        priority: 'high'
      },
      RETRY_PIN: {
        title: 'Invalid Password PIN',
        message: 'The password PIN you entered is incorrect. Please check and try again.',
        actionText: 'Retry PIN',
        priority: 'high'
      },
      UPGRADE_KYC: {
        title: 'KYC Limit Exceeded',
        message: 'This transaction exceeds your current KYC limits. Please upgrade your verification level to continue.',
        actionText: 'Upgrade KYC',
        route: '/kyc/upgrade',
        priority: 'high'
      },
      ADD_FUNDS: {
        title: 'Insufficient Balance',
        message: "You don't have enough NGNZ balance for this purchase. Please top up your wallet.",
        actionText: 'Add Funds',
        route: '/wallet/deposit',
        priority: 'high'
      },
      CHECK_METER: {
        title: 'Invalid Meter Number',
        message: 'The meter/account number you entered is invalid. Please check and try again.',
        actionText: 'Check Meter Number',
        priority: 'medium'
      },
      SELECT_PROVIDER: {
        title: 'Select Provider',
        message: 'Please select a valid electricity provider to continue.',
        actionText: 'Select Provider',
        priority: 'medium'
      },
      SELECT_METER_TYPE: {
        title: 'Select Meter Type',
        message: 'Please select whether your meter is Prepaid or Postpaid.',
        actionText: 'Select Meter Type',
        priority: 'medium'
      },
      INCREASE_AMOUNT: {
        title: 'Amount Too Low',
        message: 'Minimum electricity purchase amount is ₦1,000. Please increase your amount.',
        actionText: 'Increase Amount',
        priority: 'medium'
      },
      REDUCE_AMOUNT: {
        title: 'Amount Too High',
        message: 'Maximum electricity purchase amount is ₦100,000. Please reduce your amount.',
        actionText: 'Reduce Amount',
        priority: 'medium'
      },
      WAIT_PENDING: {
        title: 'Pending Transaction',
        message: 'You have a pending electricity transaction. Please wait a few minutes before trying again.',
        actionText: 'Try Again Later',
        priority: 'medium'
      },
      FIX_INPUT: {
        title: 'Invalid Details',
        message: 'Please check your meter number, provider selection, and amount, then try again.',
        actionText: 'Check Details',
        priority: 'medium'
      },
      SETUP_2FA: {
        title: '2FA Setup Required',
        message: 'Two-factor authentication is required for transactions. Please set it up in your security settings.',
        actionText: 'Setup 2FA',
        route: '/security/2fa',
        priority: 'high'
      },
      SETUP_PIN: {
        title: 'PIN Setup Required',
        message: 'A password PIN is required for transactions. Please set it up in your security settings.',
        actionText: 'Setup PIN',
        route: '/security/pin',
        priority: 'high'
      },
      CONTACT_SUPPORT: {
        title: 'Service Issue',
        message: "There's an issue with the electricity service. Please contact support for assistance.",
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high'
      },
      RETRY_LATER: {
        title: 'Service Unavailable',
        message: 'The electricity service is temporarily unavailable. Please try again later.',
        actionText: 'Try Later',
        priority: 'medium'
      }
    };

    return errorActions[requiresAction] || null;
  }, []);

  /** Friendly message passthrough */
  const getUserFriendlyMessage = useCallback(
    (errorCode, originalMessage) =>
      electricityService.getUserFriendlyMessage(errorCode, originalMessage),
    []
  );

  /** Amount validation using service limits */
  const validatePurchaseAmount = useCallback(
    (amount) => {
      const limits = getPurchaseLimits();
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        return { isValid: false, error: 'INVALID_AMOUNT', message: 'Please enter a valid amount' };
      }
      if (numAmount < limits.minimum) {
        return { isValid: false, error: 'AMOUNT_TOO_LOW', message: `Minimum amount is ${limits.formattedMinimum}` };
      }
      if (numAmount > limits.maximum) {
        return { isValid: false, error: 'AMOUNT_TOO_HIGH', message: `Maximum amount is ${limits.formattedMaximum}` };
      }
      return { isValid: true, amount: numAmount };
    },
    [getPurchaseLimits]
  );

  /** Simple state checks & lookups */
  const hasSelectedProvider = useCallback(() => !!selectedProvider, [selectedProvider]);
  const hasSelectedMeterType = useCallback(() => !!selectedMeterType, [selectedMeterType]);
  const getProviderById = useCallback((providerId) => providers.find((p) => p.id === providerId) || null, [providers]);
  const getMeterTypeById = useCallback((meterTypeId) => meterTypes.find((t) => t.id === meterTypeId) || null, [meterTypes]);

  /** Reset & init */
  const resetSelections = useCallback(() => {
    setSelectedProvider(null);
    setSelectedMeterType(null);
    setError(null);
  }, []);
  const initialize = useCallback(() => {
    getElectricityProviders();
    getMeterTypes();
  }, [getElectricityProviders, getMeterTypes]);

  return {
    // State
    loading,
    error,
    providers,
    meterTypes,
    selectedProvider,
    selectedMeterType,

    // Actions
    purchaseElectricity,
    getElectricityProviders,
    validateElectricityCustomer,
    getMeterTypes,
    selectProvider,
    clearSelectedProvider,
    selectMeterType,
    clearSelectedMeterType,
    clearErrors,
    resetSelections,
    initialize,

    // Utilities
    validateMeterNumber,
    formatMeterNumber,
    getProviderDisplayName,
    getProviderRegion,
    getMeterTypeDisplayName,
    formatAmount,
    getPurchaseLimits,
    getPopularAmounts,
    formatElectricityUnits,
    formatElectricityToken,
    validatePurchaseAmount,

    // State checks
    hasSelectedProvider,
    hasSelectedMeterType,
    getProviderById,
    getMeterTypeById,
    isFormComplete: useCallback(
      (meterNumber, amount) =>
        !!(
          selectedProvider &&
          selectedMeterType &&
          validateMeterNumber(meterNumber) &&
          validatePurchaseAmount(amount).isValid
        ),
      [selectedProvider, selectedMeterType, validateMeterNumber, validatePurchaseAmount]
    ),

    // Error helpers
    getErrorAction,
    getUserFriendlyMessage
  };
};
