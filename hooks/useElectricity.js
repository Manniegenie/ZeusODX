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
        const validationError = validation.errors[0] || 'Validation failed';
        const rawError = {
          code: 'error',
          message: validationError, // Client-side validation error
          data: { errors: validation.errors }
        };
        setError(validationError);
        return rawError;
      }

      // Call service → returns RAW backend payload or backend error body
      const result = await electricityService.purchaseElectricity(purchaseData);

      // Normalize hook state only (do not change the returned payload)
      if (!result || result.code !== 'success') {
        // Set error state with backend message directly
        setError(result?.message || 'Purchase failed');
      }

      return result; // return RAW response unchanged
    } catch (err) {
      console.error('❌ Electricity purchase hook error:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      const fallback = {
        code: 'error',
        message: errorMessage,
        data: null
      };
      setError(errorMessage);
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
      const result = await electricityService.validateElectricityCustomer(validationData);
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (error) {
      console.error('❌ useElectricity: Error validating customer:', error);
      const errorMessage = error.message || 'Customer validation failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
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
    error, // This now holds the exact backend message (or client-side validation error)
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
    )
  };
};