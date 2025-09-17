// services/giftcardCountriesService.js
import { apiClient } from './apiClient';

const ENDPOINT = '/giftcardcountry';

/**
 * Map many common client-side variants to canonical backend card types.
 * Returns object: { cardType: 'AMAZON'|'APPLE'|'VANILLA'|..., vanillaType: '4097'|'4118'|undefined, raw: '<original>' }
 */
function normalizeCardTypeInput(raw) {
  if (!raw) return { cardType: '', vanillaType: undefined, raw: '' };
  const s = String(raw).trim().toLowerCase();

  // Helper checks
  const contains = (token) => s.indexOf(token) !== -1;

  // Vanilla explicit BIN detection
  if (contains('4097') || contains('4118')) {
    const vanillaType = contains('4097') ? '4097' : '4118';
    return { cardType: 'VANILLA', vanillaType, raw };
  }

  // Vanilla mention
  if (contains('vanilla')) {
    return { cardType: 'VANILLA', vanillaType: undefined, raw };
  }

  // Apple / iTunes
  if (contains('apple') || contains('itunes')) return { cardType: 'APPLE', vanillaType: undefined, raw };

  // Google Play variants
  if (contains('google') || contains('playstore') || contains('googleplay') || contains('google_play')) {
    return { cardType: 'GOOGLE_PLAY', vanillaType: undefined, raw };
  }

  // Amazon
  if (contains('amazon')) return { cardType: 'AMAZON', vanillaType: undefined, raw };

  // Steam
  if (contains('steam')) return { cardType: 'STEAM', vanillaType: undefined, raw };

  // Nordstrom / Nord
  if (contains('nord') || contains('nordstrom')) return { cardType: 'NORDSTROM', vanillaType: undefined, raw };

  // Macy's / Macy
  if (contains('macy')) return { cardType: 'MACY', vanillaType: undefined, raw };

  // Nike
  if (contains('nike')) return { cardType: 'NIKE', vanillaType: undefined, raw };

  // Visa (explicit "visa" -> VISA)
  if (contains('visa') && !contains('vanilla')) return { cardType: 'VISA', vanillaType: undefined, raw };

  // American Express / Amex / Amex variants
  if (contains('american') || contains('amex') || contains('american-express') || contains('american_express')) {
    return { cardType: 'AMERICAN_EXPRESS', vanillaType: undefined, raw };
  }

  // Razorgold / Razer terms
  if (contains('razor') || contains('razer') || contains('razor_gold') || contains('razor-gold')) {
    return { cardType: 'RAZOR_GOLD', vanillaType: undefined, raw };
  }

  // Sephora
  if (contains('sephora')) return { cardType: 'SEPHORA', vanillaType: undefined, raw };

  // Footlocker
  if (contains('foot') || contains('footlocker')) return { cardType: 'FOOTLOCKER', vanillaType: undefined, raw };

  // Xbox
  if (contains('xbox')) return { cardType: 'XBOX', vanillaType: undefined, raw };

  // eBay
  if (contains('ebay')) return { cardType: 'EBAY', vanillaType: undefined, raw };

  // Try to derive from an underscore/upper-case style token (VISA_CARD -> VISA)
  const token = s.replace(/[^a-z0-9]/g, '').toUpperCase();
  const tokenMap = {
    'APPLE': 'APPLE',
    'STEAM': 'STEAM',
    'NORDSTROM': 'NORDSTROM',
    'MACY': 'MACY',
    'NIKE': 'NIKE',
    'GOOGLEPLAY': 'GOOGLE_PLAY',
    'GOOGLE_PLAY': 'GOOGLE_PLAY',
    'AMAZON': 'AMAZON',
    'VISA': 'VISA',
    'VANILLA': 'VANILLA',
    'RAZORGOLD': 'RAZOR_GOLD',
    'AMERICANEXPRESS': 'AMERICAN_EXpress',
    'AMERICAN_EXPRESS': 'AMERICAN_EXPRESS',
    'SEPHORA': 'SEPHORA',
    'FOOTLOCKER': 'FOOTLOCKER',
    'XBOX': 'XBOX',
    'EBAY': 'EBAY'
  };
  if (token && tokenMap[token]) {
    return { cardType: tokenMap[token], vanillaType: undefined, raw };
  }

  // Nothing matched
  return { cardType: '', vanillaType: undefined, raw };
}

/**
 * Robustly extract meaningful message/structure from API errors/responses.
 */
function extractApiResponse(apiResponse) {
  if (!apiResponse) {
    return { success: false, message: 'Empty response', data: null };
  }

  // axios-like wrapper: apiResponse.data
  if (apiResponse.data && typeof apiResponse.data === 'object') {
    const actual = apiResponse.data;
    if (typeof actual.success === 'boolean') {
      return { success: actual.success, data: actual.data ?? null, message: actual.message ?? '' };
    }
    // sometimes backend returns data as array/object directly
    return { success: true, data: actual, message: '' };
  }

  // if apiResponse is plain object with success flag
  if (typeof apiResponse === 'object' && typeof apiResponse.success === 'boolean') {
    return { success: apiResponse.success, data: apiResponse.data ?? null, message: apiResponse.message ?? '' };
  }

  // string (HTML or plain)
  if (typeof apiResponse === 'string') {
    // try to parse message from HTML (like "Cannot GET /foo")
    const match = apiResponse.match(/<pre>([\s\S]*?)<\/pre>/i);
    if (match) {
      return { success: false, message: match[1].trim(), data: null };
    }
    return { success: false, message: apiResponse.slice(0, 200), data: null };
  }

  // fallback
  return { success: false, message: 'Unknown API response format', data: null };
}

/**
 * Normalize the server payload into a consistent client shape
 */
function normalizeCountryData(payload) {
  if (!payload || !payload.countries || !Array.isArray(payload.countries)) {
    return {
      cardType: payload?.cardType ?? '',
      cardTypeDisplay: payload?.cardTypeDisplay ?? (payload?.cardType ?? ''),
      totalCountries: 0,
      countries: []
    };
  }

  const countries = payload.countries.map(c => ({
    code: c.code ?? c.country ?? '',
    name: c.name ?? c.country ?? c.code ?? '',
    rate: typeof c.rate === 'number' ? c.rate : (c.rate ? Number(c.rate) : 0),
    rateDisplay: c.rateDisplay ?? (c.rate ? `${c.rate}/${c.sourceCurrency ?? 'USD'}` : ''),
    sourceCurrency: c.sourceCurrency ?? c.sourcecurrency ?? 'USD',
    vanillaType: c.vanillaType ?? c.vanillatype ?? undefined
  }));

  return {
    cardType: payload.cardType ?? '',
    cardTypeDisplay: payload.cardTypeDisplay ?? payload.cardType ?? '',
    totalCountries: payload.totalCountries ?? countries.length,
    countries
  };
}

/**
 * Primary service object
 */
export const giftcardCountriesService = {
  async getCountriesForCard(cardType) {
    if (!cardType) {
      return { success: false, message: 'Card type is required', data: null };
    }

    // normalize many client-side variants to canonical
    const normalized = normalizeCardTypeInput(cardType);
    if (!normalized.cardType) {
      return { success: false, message: `Unsupported card type: ${cardType}`, data: null };
    }

    const { cardType: canonicalCardType, vanillaType, raw } = normalized;

    const url = `${ENDPOINT}/${canonicalCardType}/countries`;

    try {
      // Optionally pass vanillaType as query param (server may ignore)
      const params = vanillaType ? { vanillaType } : {};
      const apiResponse = await apiClient.get(url, { params });

      const extracted = extractApiResponse(apiResponse);
      if (!extracted.success) {
        return { success: false, message: extracted.message || 'Failed to fetch countries', data: null };
      }

      const normalizedData = normalizeCountryData(extracted.data ?? {});
      // include some extra metadata for debugging / client handling
      normalizedData.requestedRaw = raw;
      normalizedData.requestedCanonical = canonicalCardType;
      normalizedData.requestedVanillaType = vanillaType;

      return { success: true, message: extracted.message || '', data: normalizedData };
    } catch (err) {
      // try to extract message from axios error structure or HTML body
      const errMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? (err.response.data.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1] ?? err.response.data) : undefined) ||
        err?.response?.data ||
        err?.message ||
        'Failed to fetch available countries';
      console.error('giftcardCountriesService.getCountriesForCard error:', errMsg);
      return { success: false, message: String(errMsg), data: null };
    }
  },

  getSupportedCardTypes() {
    return [
      'APPLE', 'STEAM', 'NORDSTROM', 'MACY', 'NIKE', 'GOOGLE_PLAY',
      'AMAZON', 'VISA', 'VANILLA', 'RAZOR_GOLD', 'AMERICAN_EXPRESS', 'SEPHORA',
      'FOOTLOCKER', 'XBOX', 'EBAY'
    ];
  },

  isValidCardType(cardType) {
    if (!cardType) return false;
    const c = String(cardType).trim().toUpperCase();
    return this.getSupportedCardTypes().includes(c);
  }
};
