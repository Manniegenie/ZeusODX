import { useState, useCallback } from 'react';
import { airtimeService } from '../services/airtimeService';

export function useAirtime() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [purchaseResult, setPurchaseResult] = useState(null);

  const clearErrors = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  const purchaseAirtime = useCallback(async (purchaseData) => {
    setLoading(true);
    clearErrors();
    setPurchaseResult(null);

    try {
      // Client-side validation
      const validation = airtimeService.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Please fix the validation errors',
          validationErrors: validation.errors
        };
      }

      const result = await airtimeService.purchaseAirtime(purchaseData);

      if (!result.success) setError(result.message);

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const validateForm = useCallback((formData) => {
    const validation = airtimeService.validatePurchaseData(formData);
    setValidationErrors(validation.errors);
    return validation;
  }, []);

  const clearValidationErrors = useCallback(() => setValidationErrors([]), []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setValidationErrors([]);
    setPurchaseResult(null);
  }, []);

  const hasFieldError = useCallback((fieldName) =>
    validationErrors.some(e => e.toLowerCase().includes(fieldName.toLowerCase())),
    [validationErrors]
  );

  const getFieldErrors = useCallback((fieldName) =>
    validationErrors.filter(e => e.toLowerCase().includes(fieldName.toLowerCase())),
    [validationErrors]
  );

  return {
    loading,
    error,
    validationErrors,
    purchaseResult,
    purchaseAirtime,
    validateForm,
    clearValidationErrors,
    clearErrors,
    reset,
    hasFieldError,
    getFieldErrors,
    formatPhoneNumber: airtimeService.formatPhoneNumber,
    getNetworkDisplayName: airtimeService.getNetworkDisplayName,
    hasErrors: !!(error || validationErrors.length > 0),
    isValid: validationErrors.length === 0,
    canPurchase: !loading && validationErrors.length === 0
  };
}
