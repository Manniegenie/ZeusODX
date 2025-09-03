// hooks/useGiftcardRate.js

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  giftcardRateService,
  GIFT_CARD_TYPES,
  GIFT_CARD_COUNTRIES,
  CARD_FORMATS,
} from '../services/giftcardRateService';

// Hook consumes the normalized service shape: { success, data, message }
export function useGiftcardRate(params = {}) {
  const {
    defaultGiftcard = 'AMAZON',
    defaultCountry = 'US',
    defaultCardFormat = null,
    autoCalculate = false, // optional
    amount = 0,
  } = params;

  // Inputs
  const [giftcard, setGiftcard] = useState(defaultGiftcard);
  const [country, setCountry] = useState(defaultCountry);
  const [cardFormat, setCardFormat] = useState(defaultCardFormat);
  const [inputAmount, setInputAmount] = useState(amount);

  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);   // normalized body
  const [error, setError] = useState(null);
  const lastReqRef = useRef(null);

  // Safely grab inner data - result.data contains the actual API response data
  const data = result?.data ?? null;

  // === Derived numbers ===
  const exchangeRate = useMemo(() => {
    if (!result?.success || !data) return null;
    
    // Extract from normalized data structure
    return data.calculation?.exchangeRate ?? null;
  }, [result, data]);

  const amountToReceive = useMemo(() => {
    if (!result?.success || !data) return 0;
    
    // Extract from normalized data structure  
    return Number(data.amountToReceive ?? 0);
  }, [result, data]);

  // === Derived formatted ===
  const exchangeRateDisplay = useMemo(() => {
    if (loading) return 'Calculating…';
    if (exchangeRate == null) return '';
    
    // Use the rate string from API if available, otherwise format the number
    if (data?.rate && typeof data.rate === 'string') {
      return data.rate; // e.g., "1,430/USD"
    }
    
    try {
      const pretty = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(exchangeRate);
      return `${pretty}/USD`;
    } catch {
      return `${exchangeRate}/USD`;
    }
  }, [loading, exchangeRate, data]);

  const payoutDisplay = useMemo(() => {
    if (!result?.success || !data) return '';
    
    const targetCurrency = data.calculation?.targetCurrency || 'NGN';
    return giftcardRateService.formatCurrency(amountToReceive, targetCurrency);
  }, [result, data, amountToReceive]);

  // Limits if backend rejects
  const minAmount = useMemo(
    () => (result && !result.success && result.limits ? result.limits.minAmount : null),
    [result]
  );
  const maxAmount = useMemo(
    () => (result && !result.success && result.limits ? result.limits.maxAmount : null),
    [result]
  );

  const supported = useMemo(
    () => ({ giftcards: GIFT_CARD_TYPES, countries: GIFT_CARD_COUNTRIES, formats: CARD_FORMATS }),
    []
  );

  // === Actions ===
  const calculate = useCallback(
    async (opts = {}) => {
      setError(null);
      setLoading(true);

      const req = {
        amount: typeof opts.amount === 'number' ? opts.amount : inputAmount,
        giftcard: opts.giftcard ?? giftcard,
        country: opts.country ?? country,
        cardFormat: (opts.cardFormat ?? cardFormat) ?? undefined,
      };

      lastReqRef.current = req;

      try {
        const resp = await giftcardRateService.calculateRate(req);
        setResult(resp);
        
        if (!resp?.success) {
          setError(resp?.message || 'Failed to calculate gift card rate');
        }
        
        setLoading(false);
        return resp;
      } catch (err) {
        console.error('Calculate rate error:', err);
        setResult(null);
        setError('Network error occurred');
        setLoading(false);
        return { success: false, message: 'Network error occurred' };
      }
    },
    [inputAmount, giftcard, country, cardFormat]
  );

  const previewBothFormats = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const base = { amount: inputAmount, giftcard, country };
      const out = await giftcardRateService.previewBothFormats(base);
      setLoading(false);

      const phys = out.physical;
      const code = out.ecode;

      if (phys?.success && code?.success) {
        const physicalAmount = phys.data?.amountToReceive ?? 0;
        const ecodeAmount = code.data?.amountToReceive ?? 0;
        const better = physicalAmount >= ecodeAmount ? phys : code;
        setResult(better);
      } else if (phys?.success) {
        setResult(phys);
      } else if (code?.success) {
        setResult(code);
      } else {
        setResult(null);
        setError('Failed to preview both formats');
      }

      return out;
    } catch (err) {
      console.error('Preview formats error:', err);
      setLoading(false);
      setResult(null);
      setError('Network error occurred');
      return { physical: { success: false }, ecode: { success: false } };
    }
  }, [inputAmount, giftcard, country]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // Debug logging to help identify issues
  if (process.env.NODE_ENV === 'development' && result) {
    console.log('useGiftcardRate - Result:', result);
    console.log('useGiftcardRate - Data:', data);
    console.log('useGiftcardRate - Exchange Rate:', exchangeRate);
    console.log('useGiftcardRate - Amount to Receive:', amountToReceive);
  }

  return {
    // inputs
    giftcard, setGiftcard,
    country, setCountry,
    cardFormat, setCardFormat,
    inputAmount, setInputAmount,

    // state
    loading,
    error,
    result,                  // { success, data, message }
    lastRequest: lastReqRef.current,

    // numbers
    exchangeRate,            // e.g. 1430
    amountToReceive,         // e.g. 143000

    // formatted
    exchangeRateDisplay,     // e.g. "1,430/USD"
    payoutDisplay,           // e.g. "₦143,000.00"

    // actions
    calculate,
    previewBothFormats,
    reset,

    // options
    supported,

    // limits (when rejected)
    minAmount,
    maxAmount,
  };
}