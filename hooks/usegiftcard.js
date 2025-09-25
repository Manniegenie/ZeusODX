// hooks/usegiftcard.js (matches screen import path)
import { useState, useCallback } from 'react';
import { giftCardService } from '../services/giftcardService';

/**
 * Main hook for gift card operations - matches the screen's import expectations
 */
export const useGiftCard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submitGiftCard = useCallback(async (giftCardData) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('Hook: Starting gift card submission with data:', {
        ...giftCardData,
        images: giftCardData.images ? `${giftCardData.images.length} images` : 'no images',
        eCode: giftCardData.eCode ? '[HIDDEN]' : undefined,
      });

      const response = await giftCardService.submitGiftCard(giftCardData);
      
      console.log('Hook: Service response:', response);

      if (response.success) {
        setResult(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error, details: response.details };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to submit gift card';
      console.error('Hook: Unexpected error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    loading,
    error,
    result,
    submitGiftCard,
    clearError,
    reset
  };
};

// Additional hooks for other gift card operations
export const useGiftCardTypes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await giftCardService.getGiftCardTypes();
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gift card types');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchTypes
  };
};

export const useGiftCardRates = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRates = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await giftCardService.getGiftCardRates(params);
      
      if (response.success) {
        setRates(response.data || []);
      } else {
        setError(response.error);
        setRates([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gift card rates');
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rates,
    loading,
    error,
    fetchRates
  };
};

export const useUserGiftCards = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGiftCards = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await giftCardService.getUserGiftCards(params);
      
      if (response.success) {
        setGiftCards(response.data.giftCards || []);
        setPagination(response.data.pagination || null);
      } else {
        setError(response.error);
        setGiftCards([]);
        setPagination(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gift cards');
      setGiftCards([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchGiftCards({ page: 1, limit: 10 });
  }, [fetchGiftCards]);

  return {
    giftCards,
    pagination,
    loading,
    error,
    fetchGiftCards,
    refresh
  };
};

export const useAmountCalculation = () => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const calculateAmount = useCallback(async (calculationData) => {
    try {
      setCalculating(true);
      setError(null);
      
      const response = await giftCardService.calculateExpectedAmount(calculationData);
      
      if (response.success) {
        setResult(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to calculate amount';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCalculating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    calculating,
    result,
    error,
    calculateAmount,
    reset
  };
};