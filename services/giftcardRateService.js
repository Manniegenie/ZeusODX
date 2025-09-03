// services/giftcardRateService.js

import { apiClient } from './apiClient';

export const CARD_FORMATS = ['PHYSICAL', 'E_CODE'];
export const GIFT_CARD_TYPES = [
  'APPLE','STEAM','NORDSTROM','MACY','NIKE','GOOGLE_PLAY',
  'AMAZON','VISA','RAZOR_GOLD','AMERICAN_EXPRESS','SEPHORA',
  'FOOTLOCKER','XBOX','EBAY'
];
export const GIFT_CARD_COUNTRIES = ['US','CANADA','AUSTRALIA','SWITZERLAND'];

// Your server route per logs
const ENDPOINT = '/giftcardrates/calculate-rate';

/* ───────── helpers ───────── */
function normalizeStr(s) {
  return (s ?? '').toString().trim().toUpperCase();
}
function toNumber(n) {
  if (typeof n === 'number') return Number.isFinite(n) ? n : NaN;
  if (typeof n === 'string') {
    const num = parseFloat(n.replace(/,/g, ''));
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}
function formatRateDisplay(rate) {
  try {
    const pretty = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(rate);
    return `${pretty}/USD`;
  } catch {
    return `${rate}/USD`;
  }
}

/** 
 * Extract API response based on your exact API structure:
 * { success: true, data: {...}, message: "..." }
 */
function extractApiResponse(apiResponse) {
  // Handle null/undefined response
  if (!apiResponse) {
    return { success: false, message: 'Empty response', data: null };
  }

  // Direct axios response: apiResponse.data contains the actual API response
  if (apiResponse.data && typeof apiResponse.data === 'object') {
    const actualResponse = apiResponse.data;
    
    // Your API structure: { success: boolean, data: {...}, message: string }
    if (typeof actualResponse.success === 'boolean') {
      return {
        success: actualResponse.success,
        data: actualResponse.data || null,
        message: actualResponse.message || ''
      };
    }
  }

  // Fallback: if response is already in the expected format
  if (typeof apiResponse.success === 'boolean') {
    return {
      success: apiResponse.success,
      data: apiResponse.data || null,
      message: apiResponse.message || ''
    };
  }

  // Last resort: treat the whole response as data
  return {
    success: false,
    message: 'Unknown response format',
    data: apiResponse
  };
}

/** Ensure stable data shape for UI & hook */
function normalizeResponseData(data) {
  if (!data || typeof data !== 'object') {
    return {
      giftcard: '',
      country: '',
      rate: '',
      amountToReceive: 0,
      calculation: {
        exchangeRate: null,
        outputAmount: 0,
        sourceCurrency: 'USD',
        targetCurrency: 'NGN'
      }
    };
  }

  const gc = normalizeStr(data.giftcard);
  const ctry = normalizeStr(data.country);

  // Extract exchange rate from multiple possible locations
  let exchangeRate = toNumber(
    data.calculation?.exchangeRate ??
    data.exchangeRate ??
    data.rateNumeric
  );
  if (!Number.isFinite(exchangeRate)) exchangeRate = null;

  // Extract amount to receive
  let amountToReceive = toNumber(
    data.amountToReceive ??
    data.calculation?.outputAmount ??
    data.outputAmount
  );
  if (!Number.isFinite(amountToReceive)) amountToReceive = 0;

  const sourceCurrency = data.calculation?.sourceCurrency || 'USD';
  const targetCurrency = data.calculation?.targetCurrency || 'NGN';

  // Use provided rate string or format from exchange rate
  const rateDisplay =
    typeof data.rate === 'string' && data.rate.length
      ? data.rate
      : exchangeRate != null
      ? formatRateDisplay(exchangeRate)
      : '';

  return {
    giftcard: gc,
    country: ctry,
    rate: rateDisplay,               // string like "1,430/USD"
    amountToReceive,                 // number
    calculation: {
      cardFormat: data.calculation?.cardFormat || null,
      country: ctry,
      exchangeRate,                  // number | null
      inputAmount: data.calculation?.inputAmount || 0,
      outputAmount: amountToReceive, // keep in sync
      sourceCurrency,
      targetCurrency,
    },
  };
}

/* ───────── validation ───────── */
export function validateRateInput(body) {
  const errors = [];
  const { amount, giftcard, country, cardFormat } = body || {};

  const amt = toNumber(amount);
  if (!Number.isFinite(amt)) {
    errors.push('Amount is required');
  } else if (amt <= 0) {
    errors.push('Amount must be a positive number');
  } else if (amt < 5 || amt > 2000) {
    errors.push('Amount must be between $5 and $2000');
  }

  const gc = normalizeStr(giftcard);
  if (!gc) errors.push('Giftcard type is required');
  else if (!GIFT_CARD_TYPES.includes(gc)) {
    errors.push(`Giftcard must be one of: ${GIFT_CARD_TYPES.join(', ')}`);
  }

  const ctry = normalizeStr(country);
  if (!ctry) errors.push('Country is required');
  else if (!GIFT_CARD_COUNTRIES.includes(ctry)) {
    errors.push('Country must be one of: US, CANADA, AUSTRALIA, SWITZERLAND');
  }

  if (cardFormat) {
    const cf = normalizeStr(cardFormat);
    if (!CARD_FORMATS.includes(cf)) {
      errors.push('Card format must be either PHYSICAL or E_CODE');
    }
  }

  if (errors.length) {
    return { success: false, message: errors.join('; '), errors };
  }

  return {
    success: true,
    validated: {
      amount: amt,
      giftcard: gc,
      country: ctry,
      cardFormat: cardFormat ? normalizeStr(cardFormat) : null,
    },
  };
}

/* ───────── service ───────── */
export const giftcardRateService = {
  async calculateRate(req) {
    const validation = validateRateInput(req);
    if (!validation.success) return validation;

    try {
      const payload = {
        amount: validation.validated.amount,
        giftcard: validation.validated.giftcard,
        country: validation.validated.country,
      };
      if (validation.validated.cardFormat) {
        payload.cardFormat = validation.validated.cardFormat;
      }

      // Make API call
      const apiResponse = await apiClient.post(ENDPOINT, payload);
      
      // Extract response using your exact API structure
      const response = extractApiResponse(apiResponse);

      if (response.success && response.data) {
        const normalizedData = normalizeResponseData(response.data);
        return { 
          success: true, 
          data: normalizedData, 
          message: response.message 
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to calculate gift card rate',
        data: null
      };
    } catch (error) {
      console.error('API Error:', error);
      
      // Extract error message from various possible locations
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to calculate gift card rate';
      
      const limits = error?.response?.data?.limits;

      return { 
        success: false, 
        message: errorMessage, 
        data: null,
        ...(limits ? { limits } : {})
      };
    }
  },

  async previewBothFormats(base) {
    const [physical, ecode] = await Promise.allSettled([
      this.calculateRate({ ...base, cardFormat: 'PHYSICAL' }),
      this.calculateRate({ ...base, cardFormat: 'E_CODE' }),
    ]);

    return {
      physical: physical.status === 'fulfilled' ? physical.value : { success: false, message: 'Failed' },
      ecode: ecode.status === 'fulfilled' ? ecode.value : { success: false, message: 'Failed' },
    };
  },

  formatCurrency(amount, currency = 'NGN') {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency === 'USD' ? '$' : '₦'}${Number(amount || 0).toFixed(2)}`;
    }
  },

  getSupportedOptions() {
    return {
      cards: GIFT_CARD_TYPES,
      countries: GIFT_CARD_COUNTRIES,
      formats: CARD_FORMATS,
    };
  },
};