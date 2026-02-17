import { useCallback, useState } from 'react';
import { bettingService } from '../services/bettingService';

export const useBetting = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearErrors = useCallback(() => setError(null), []);

  const fundBettingAccount = useCallback(async (fundingData) => {
    setLoading(true);
    clearErrors();
    try {
      const validation = bettingService.validateFundingData?.(fundingData);
      if (validation && !validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        setError(errorMessage);
        return { success: false, error: 'VALIDATION_ERROR', message: errorMessage };
      }

      const result = await bettingService.fundBettingAccount(fundingData);

      if (!result.success) {
        setError(result.message); // Backend message directly
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const validateBettingCustomer = useCallback(async (validationData) => {
    setLoading(true);
    clearErrors();
    try {
      const result = await bettingService.validateBettingCustomer(validationData);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const getBettingProviders = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const providers = await bettingService.getBettingProviders();
      return Array.isArray(providers) ? providers : bettingService.getStaticBettingProviders();
    } catch (err) {
      setError(err.message);
      return bettingService.getStaticBettingProviders();
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const getStaticBettingProviders = useCallback(() => bettingService.getStaticBettingProviders(), []);

  return {
    loading,
    error,
    fundBettingAccount,
    validateBettingCustomer,
    getBettingProviders,
    getStaticBettingProviders,
    clearErrors
  };
};
