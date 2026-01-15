// services/giftcardRateService.js

import { apiClient } from './apiClient';

export const CARD_FORMATS = ['PHYSICAL', 'E_CODE'];
export const GIFT_CARD_TYPES = [
  'APPLE','STEAM','NORDSTROM','MACY','NIKE','GOOGLE_PLAY',
  'AMAZON','VISA','VANILLA','VANILLA_4097','VANILLA_4118','RAZOR_GOLD',
  'AMERICAN_EXPRESS','SEPHORA','FOOTLOCKER','XBOX','EBAY'
];
// canonical country keys we use internally
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
 * More forgiving mapping for giftcard names.
 * Returns canonical { name, variant } where variant is optional (e.g., vanilla 4097/4118)
 */
function normalizeGiftcard(input) {
  const raw = normalizeStr(input);
  if (!raw) return { name: '', variant: null };

  // common synonyms map
  const synonyms = {
    'ITUNES': 'APPLE',
    'APPLE_ITUNES': 'APPLE',
    'GOOGLEPLAY': 'GOOGLE_PLAY',
    'GOOGLE_PLAY_STORE': 'GOOGLE_PLAY',
    'GOOGLE PLAY': 'GOOGLE_PLAY',
    'AMEX': 'AMERICAN_EXPRESS',
    'AMERICANEXPRESS': 'AMERICAN_EXPRESS',
    'NORDSTROMS': 'NORDSTROM',
    'MACYS': 'MACY',
    'RAZORGOLD': 'RAZOR_GOLD',
    'XBOX': 'XBOX',
    'EBAY': 'EBAY',
    'STEAM': 'STEAM',
    'AMAZON': 'AMAZON',
    'NIKE': 'NIKE',
    // include identities for Visa/Vanilla variations
    'VISA_CARD': 'VISA',
    'VISA_4097': 'VISA',
    'VISA_4118': 'VISA',
    'VANILLA': 'VANILLA',
    'VANILLA_4097': 'VANILLA_4097',
    'VANILLA_4118': 'VANILLA_4118',
    // some clients might send "VANILLA 4097" etc
  };

  // detect exact vanilla 4097/4118 patterns
  if (raw.includes('VANILLA') && raw.includes('4097')) {
    return { name: 'VANILLA_4097', variant: '4097' };
  }
  if (raw.includes('VANILLA') && raw.includes('4118')) {
    return { name: 'VANILLA_4118', variant: '4118' };
  }

  // detect visa / vanilla numeric hints
  if (raw.startsWith('VISA') && /4097|4118/.test(raw)) {
    // if visa with 4097/4118, treat as VISA but expose variant if needed
    const match = raw.match(/(4097|4118)/);
    return { name: 'VISA', variant: match ? match[0] : null };
  }

  // direct map
  if (synonyms[raw]) {
    return { name: synonyms[raw], variant: null };
  }

  // try cleaning non-alphanumeric to find a match
  const cleaned = raw.replace(/[^A-Z0-9]/g, '_');
  if (synonyms[cleaned]) return { name: synonyms[cleaned], variant: null };

  // if input exactly matches one of canonical types, use it
  if (GIFT_CARD_TYPES.includes(raw)) return { name: raw, variant: null };

  // fallback: if startsWith a canonical type
  for (const t of GIFT_CARD_TYPES) {
    if (raw.startsWith(t)) return { name: t, variant: null };
  }

  // last resort: return raw as-is (validation will catch unsupported)
  return { name: raw, variant: null };
}

/**
 * More forgiving country normalization: accepts US, USA, UNITED STATES, CA, CANADA, etc.
 * Returns canonical country string as listed in GIFT_CARD_COUNTRIES
 */
function normalizeCountry(input) {
  const raw = normalizeStr(input);
  if (!raw) return '';
  const map = {
    'US': 'US', 'USA': 'US', 'UNITED STATES': 'US', 'UNITEDSTATES': 'US',
    'CA': 'CANADA', 'CAN': 'CANADA', 'CANADA': 'CANADA',
    'AU': 'AUSTRALIA', 'AUS': 'AUSTRALIA', 'AUSTRALIA': 'AUSTRALIA',
    'CH': 'SWITZERLAND', 'SWITZERLAND': 'SWITZERLAND', 'CHE': 'SWITZERLAND',
  };
  return map[raw] || raw;
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
    errors.push('Amount is required and must be a number');
  } else if (amt <= 0) {
    errors.push('Amount must be greater than zero');
  }
  // Backend enforces $25-$1000 range, no need to show frontend validation

  // Normalize giftcard with synonym handling
  const normalized = normalizeGiftcard(giftcard);
  if (!normalized.name) {
    errors.push('Giftcard type is required');
  } else {
    // Accept the normalized.name if it's one of our canonical types OR
    // accept 'VISA' and 'VANILLA' families (we included VANILLA_* in GIFT_CARD_TYPES)
    const validNames = GIFT_CARD_TYPES.slice(); // copy
    // also allow VISA even if not in list exactly (VISA is in list though)
    if (!validNames.includes(normalized.name)) {
      errors.push(`Giftcard must be one of our supported types (got: ${normalized.name})`);
    }
  }

  // Normalize country
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) {
    errors.push('Country is required');
  } else if (!GIFT_CARD_COUNTRIES.includes(normalizedCountry)) {
    errors.push(`Country must be one of: ${GIFT_CARD_COUNTRIES.join(', ')}`);
  }

  // cardFormat validation (optional)
  let normalizedCardFormat = null;
  if (cardFormat) {
    const cf = normalizeStr(cardFormat);
    if (!CARD_FORMATS.includes(cf)) {
      errors.push('Card format must be either PHYSICAL or E_CODE');
    } else {
      normalizedCardFormat = cf;
    }
  }

  if (errors.length) {
    return { success: false, message: errors.join('; '), errors };
  }

  // Success — return normalized validated object including variant if present
  return {
    success: true,
    validated: {
      amount: amt,
      giftcard: normalizeGiftcard(giftcard).name,
      variant: normalizeGiftcard(giftcard).variant || null,
      country: normalizeCountry(country),
      cardFormat: normalizedCardFormat,
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
      if (validation.validated.variant) {
        // include variant (e.g., '4097' or '4118' or 'VANILLA_4097') if available
        payload.variant = validation.validated.variant;
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
