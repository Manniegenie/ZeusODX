// hooks/usegiftcard.js
import { useState, useCallback } from 'react';
import { giftcardService } from '../services/giftcardService';

export function useGiftCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitGiftCard = useCallback(async (giftCardData) => {
    setLoading(true);
    setError(null);
    try {
      // Normalize the data to match API expectations
      const normalizedData = {
        ...giftCardData,
        // Ensure cardValue is sent as string for FormData (service will handle)
        cardValue: String(giftCardData.cardValue || '0'),
        // Ensure cardRange follows the expected format (e.g., "25-100")
        cardRange: giftCardData.cardRange || `${giftCardData.cardRangeMin || 0}-${giftCardData.cardRangeMax || 0}`,
        // Ensure country is in the expected format (should already be correct from the screen)
        country: giftCardData.country,
        // Ensure cardType is in uppercase format (should already be correct from the screen)
        cardType: giftCardData.cardType,
        // Ensure cardFormat is in the expected format (E_CODE or PHYSICAL)
        cardFormat: giftCardData.cardFormat,
        // Remove cardRangeMin/Max since we're using cardRange
        cardRangeMin: undefined,
        cardRangeMax: undefined,
      };

      console.log('Normalized gift card data:', {
        ...normalizedData,
        images: `${normalizedData.images?.length || 0} images`
      });

      const result = await giftcardService.submitGiftCard(normalizedData);
      if (!result.success) setError(result.error || 'Failed to submit gift card');
      return result;
    } catch (err) {
      const msg = err?.message || 'Failed to submit gift card';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, submitGiftCard, clearError };
}