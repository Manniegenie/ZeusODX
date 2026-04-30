import { useCallback, useEffect, useState } from 'react';
import { referralService } from '../services/referralService';

export function useReferral() {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReferral = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await referralService.getReferralInfo();
      if (result.success) {
        setReferralData(result.data?.data ?? result.data);
      } else {
        setError(result.error || 'Failed to load referral data');
      }
    } catch (err) {
      setError('Unable to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  return { referralData, loading, error, refetch: fetchReferral };
}
