import { useCallback, useState } from 'react';
import { bettingService } from '../services/bettingService';

export const useBetting = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  const fundBettingAccount = useCallback(async (fundingData) => {
    setLoading(true);
    clearErrors();
    try {
      const validation = bettingService.validateFundingData(fundingData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        setError(errorMessage);
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: errorMessage,
          requiresAction: 'FIX_INPUT'
        };
      }

      const result = await bettingService.fundBettingAccount(fundingData);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errorMessage
      };
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
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during validation. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const getBettingProviders = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const providers = await bettingService.getBettingProviders();
      return providers;
    } catch (error) {
      const errorMessage = 'Failed to fetch betting providers. Please try again.';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearErrors]);

  const getStaticBettingProviders = useCallback(() => {
    return bettingService.getStaticBettingProviders();
  }, []);

  const validateUserId = useCallback((userId) => {
    return bettingService.validateUserId(userId);
  }, []);

  const formatUserId = useCallback((userId) => {
    return bettingService.formatUserId(userId);
  }, []);

  const getProviderDisplayName = useCallback((providerId) => {
    return bettingService.getProviderDisplayName(providerId);
  }, []);

  const getProviderCategory = useCallback((providerId) => {
    return bettingService.getProviderCategory(providerId);
  }, []);

  const formatAmount = useCallback((amount) => {
    return bettingService.formatAmount(amount);
  }, []);

  const getFundingLimits = useCallback(() => {
    return bettingService.getFundingLimits();
  }, []);

  const getPopularAmounts = useCallback(() => {
    return bettingService.getPopularAmounts();
  }, []);

  const isValidProvider = useCallback((providerId) => {
    return bettingService.isValidProvider(providerId);
  }, []);

  const getProvidersByCategory = useCallback((category) => {
    return bettingService.getProvidersByCategory(category);
  }, []);

  const formatTransactionStatus = useCallback((status) => {
    return bettingService.formatTransactionStatus(status);
  }, []);

  const generateTransactionReference = useCallback((orderId, providerId) => {
    return bettingService.generateTransactionReference(orderId, providerId);
  }, []);

  const getEstimatedFundingTime = useCallback((providerId) => {
    return bettingService.getEstimatedFundingTime(providerId);
  }, []);

  const getUserFriendlyMessage = useCallback((errorCode, originalMessage) => {
    return bettingService.getUserFriendlyMessage(errorCode, originalMessage);
  }, []);

  const getErrorAction = useCallback((requiresAction) => {
    return bettingService.getErrorAction(requiresAction);
  }, []);

  const validateFundingAmount = useCallback((amount, providerId) => {
    const numAmount = parseFloat(amount);
    const limits = getFundingLimits();
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }
    if (numAmount < limits.minimum) {
      return { isValid: false, error: `Minimum funding amount is ${limits.formattedMinimum}` };
    }
    if (numAmount > limits.maximum) {
      return { isValid: false, error: `Maximum funding amount is ${limits.formattedMaximum}` };
    }
    return { isValid: true };
  }, [getFundingLimits]);

  const searchProviders = useCallback(async (searchTerm) => {
    try {
      const providers = await getBettingProviders();
      if (!searchTerm || typeof searchTerm !== 'string') {
        return providers;
      }
      const term = searchTerm.toLowerCase().trim();
      return providers.filter(provider =>
        provider.name.toLowerCase().includes(term) ||
        provider.displayName.toLowerCase().includes(term) ||
        provider.category.toLowerCase().includes(term)
      );
    } catch (error) {
      return [];
    }
  }, [getBettingProviders]);

  const getBettingCategories = useCallback(async () => {
    try {
      const providers = await getBettingProviders();
      const categories = [...new Set(providers.map(p => p.category))];
      return categories.sort();
    } catch (error) {
      return [];
    }
  }, [getBettingProviders]);

  const isPopularAmount = useCallback((amount) => {
    const popularAmounts = getPopularAmounts();
    return popularAmounts.some(pa => pa.amount === parseFloat(amount) && pa.popular);
  }, [getPopularAmounts]);

  return {
    loading,
    error,
    fundBettingAccount,
    validateBettingCustomer,
    clearErrors,
    getBettingProviders,
    getStaticBettingProviders,
    getProviderDisplayName,
    getProviderCategory,
    isValidProvider,
    getProvidersByCategory,
    searchProviders,
    getBettingCategories,
    validateUserId,
    formatUserId,
    formatAmount,
    getFundingLimits,
    getPopularAmounts,
    validateFundingAmount,
    isPopularAmount,
    formatTransactionStatus,
    generateTransactionReference,
    getEstimatedFundingTime,
    getUserFriendlyMessage,
    getErrorAction
  };
};