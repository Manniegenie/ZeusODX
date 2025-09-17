// hooks/useGiftcardCountries.js
import { useCallback, useMemo, useState, useEffect } from 'react';
import { giftcardCountriesService } from '../services/giftcardcountryService';

/**
 * Hook for managing gift card countries data
 */
export function useGiftcardCountries(params = {}) {
  const {
    autoFetch = false,
    cardType: initialCardType = null,
  } = params;

  const [cardType, setCardType] = useState(initialCardType);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, data, message }
  const [error, setError] = useState(null);

  const data = result?.data ?? null;

  const countries = useMemo(() => data?.countries ?? [], [data]);
  const totalCountries = useMemo(() => data?.totalCountries ?? 0, [data]);
  const cardTypeDisplay = useMemo(() => data?.cardTypeDisplay ?? cardType ?? '', [data, cardType]);
  const hasCountries = useMemo(() => countries.length > 0, [countries]);

  const getCountryByCode = useCallback((code) => {
    if (!code || !countries.length) return null;
    return countries.find(c => String(c.code).toLowerCase() === String(code).toLowerCase()) || null;
  }, [countries]);

  const getCountryByName = useCallback((name) => {
    if (!name || !countries.length) return null;
    const normalizedName = String(name).toLowerCase().trim();
    return countries.find(c => (c.name || '').toLowerCase().includes(normalizedName) || (c.code || '').toLowerCase() === normalizedName) || null;
  }, [countries]);

  const fetchCountries = useCallback(async (targetCardType = null) => {
    const cardTypeToFetch = targetCardType || cardType;
    if (!cardTypeToFetch) {
      setError('Card type is required');
      return { success: false, message: 'Card type is required' };
    }

    setError(null);
    setLoading(true);

    try {
      const response = await giftcardCountriesService.getCountriesForCard(cardTypeToFetch);
      setResult(response);
      if (!response.success) {
        setError(response.message || 'Failed to fetch countries');
      }
      setLoading(false);
      return response;
    } catch (err) {
      console.error('fetchCountries error:', err);
      const errorMsg = 'Network error occurred';
      setResult(null);
      setError(errorMsg);
      setLoading(false);
      return { success: false, message: errorMsg };
    }
  }, [cardType]);

  const refresh = useCallback(() => fetchCountries(), [fetchCountries]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCardType(null);
  }, []);

  const updateCardType = useCallback((newCardType, shouldFetch = false) => {
    setCardType(newCardType);
    if (shouldFetch && newCardType) {
      fetchCountries(newCardType);
    }
  }, [fetchCountries]);

  useEffect(() => {
    if (autoFetch && cardType && !loading && !result) {
      fetchCountries();
    }
  }, [autoFetch, cardType, loading, result, fetchCountries]);

  const isValidCardType = useCallback((type) => giftcardCountriesService.isValidCardType(type), []);
  const getSupportedCardTypes = useCallback(() => giftcardCountriesService.getSupportedCardTypes(), []);

  if (process.env.NODE_ENV === 'development' && result) {
    console.log('useGiftcardCountries - Result:', result);
    console.log('useGiftcardCountries - Countries:', countries);
    console.log('useGiftcardCountries - Card Type:', cardType);
  }

  return {
    cardType,
    setCardType,
    updateCardType,
    loading,
    error,
    result,
    data,
    countries,
    totalCountries,
    cardTypeDisplay,
    hasCountries,
    getCountryByCode,
    getCountryByName,
    isValidCardType,
    getSupportedCardTypes,
    fetchCountries,
    refresh,
    reset,
  };
}

/**
 * Convenience wrapper for auto-fetching a single card type
 */
export function useCardCountries(cardType) {
  const { countries, loading, error, hasCountries, fetchCountries } = useGiftcardCountries({
    cardType,
    autoFetch: true
  });

  return { countries, loading, error, hasCountries, refetch: fetchCountries };
}
