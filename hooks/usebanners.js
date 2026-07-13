// hooks/useBanners.js
import { useCallback, useState, useEffect } from 'react';
import { bannerService } from '../services/bannerService';

// Module-level cache so banners are fetched once in the background at app
// startup (see prefetchBanners in app/_layout.tsx) and every screen mount
// afterwards renders instantly from cache — no spinner in the banner slot
// while the dashboard is busy with its own load (KYC check, balances, etc).
let cachedBanners = null;       // null = never fetched; [] = fetched, none live
let inFlight = null;            // de-dupes concurrent fetches

async function fetchBannersOnce() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await bannerService.getBanners();
      let list = [];
      if (response.success && Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      }
      cachedBanners = list;
      return { banners: list, error: null };
    } catch (err) {
      // Keep any previous cache on failure
      return { banners: cachedBanners || [], error: 'An unexpected error occurred' };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// Fire-and-forget warm-up. Call as early as possible (root layout) so the
// banner data is already sitting in cache before the dashboard mounts.
export function prefetchBanners() {
  fetchBannersOnce().catch(() => {});
}

export const useBanners = () => {
  const [banners, setBanners] = useState(cachedBanners || []);
  // Only show a loading state when there is no cache at all
  const [loading, setLoading] = useState(cachedBanners === null);
  const [error, setError] = useState(null);

  const fetchBanners = useCallback(async () => {
    if (cachedBanners === null) setLoading(true);
    setError(null);
    const result = await fetchBannersOnce();
    setBanners(result.banners);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Serve cache instantly (state already initialized from it), then refresh
    // silently in the background so promo changes still show up.
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners: Array.isArray(banners) ? banners : [],
    loading,
    error,
    refreshBanners: fetchBanners
  };
};

export default useBanners;
