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

  // State
  const [cardType, setCardType] = useState(initialCardType);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, data, message }
  const [error, setError] = useState(null);

  // Extracted data for easy access
  const data = result?.data ?? null;

  // Derived state
  const countries = useMemo(() => {
    return data?.countries ?? [];
  }, [data]);

  const totalCountries = useMemo(() => {
    return data?.totalCountries ?? 0;
  }, [data]);

  const cardTypeDisplay = useMemo(() => {
    return data?.cardTypeDisplay ?? cardType ?? '';
  }, [data, cardType]);

  const hasCountries = useMemo(() => {
    return countries.length > 0;
  }, [countries]);

  // Country lookup helpers
  const getCountryByCode = useCallback((code) => {
    if (!code || !countries.length) return null;
    return countries.find(c => c.code === code) || null;
  }, [countries]);

  const getCountryByName = useCallback((name) => {
    if (!name || !countries.length) return null;
    const normalizedName = name.toLowerCase().trim();
    return countries.find(c => 
      c.name.toLowerCase().includes(normalizedName) ||
      c.code.toLowerCase() === normalizedName
    ) || null;
  }, [countries]);

  // Main fetch function
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
      console.error('Fetch countries error:', err);
      const errorMsg = 'Network error occurred';
      setResult(null);
      setError(errorMsg);
      setLoading(false);
      return { success: false, message: errorMsg };
    }
  }, [cardType]);

  // Refresh function (refetch current card type)
  const refresh = useCallback(() => {
    return fetchCountries();
  }, [fetchCountries]);

  // Reset function
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCardType(null);
  }, []);

  // Update card type and optionally fetch
  const updateCardType = useCallback((newCardType, shouldFetch = false) => {
    setCardType(newCardType);
    
    if (shouldFetch && newCardType) {
      fetchCountries(newCardType);
    }
  }, [fetchCountries]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && cardType && !loading && !result) {
      fetchCountries();
    }
  }, [autoFetch, cardType, loading, result, fetchCountries]);

  // Validation helpers
  const isValidCardType = useCallback((type) => {
    return giftcardCountriesService.isValidCardType(type);
  }, []);

  const getSupportedCardTypes = useCallback(() => {
    return giftcardCountriesService.getSupportedCardTypes();
  }, []);

  // Debug logging
  if (process.env.NODE_ENV === 'development' && result) {
    console.log('useGiftcardCountries - Result:', result);
    console.log('useGiftcardCountries - Countries:', countries);
    console.log('useGiftcardCountries - Card Type:', cardType);
  }

  return {
    // Input state
    cardType,
    setCardType,
    updateCardType,

    // Loading & error state
    loading,
    error,
    result, // full API response

    // Extracted data
    data,
    countries, // array of country objects
    totalCountries,
    cardTypeDisplay,
    hasCountries,

    // Helper functions
    getCountryByCode,
    getCountryByName,
    isValidCardType,
    getSupportedCardTypes,

    // Actions
    fetchCountries,
    refresh,
    reset,
  };
}

/**
 * Simplified hook for just fetching countries for a specific card type
 */
export function useCardCountries(cardType) {
  const {
    countries,
    loading,
    error,
    hasCountries,
    fetchCountries,
  } = useGiftcardCountries({ 
    cardType, 
    autoFetch: true 
  });

  return {
    countries,
    loading,
    error,
    hasCountries,
    refetch: fetchCountries,
  };
}