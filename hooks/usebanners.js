// hooks/useBanners.js
import { useCallback, useState, useEffect } from 'react';
import { bannerService } from '../services/bannerService';

export const useBanners = () => {
  // 1. Keep the initial state as an empty array
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await bannerService.getBanners();
      
      // 2. Check if response.data is the actual array
      // If your backend returns { success: true, data: [...] }
      // then response.data is the array we want.
      if (response.success && Array.isArray(response.data)) {
        setBanners(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        // Fallback in case your apiClient wraps the data twice
        setBanners(response.data.data);
      } else {
        setBanners([]); // Fallback to empty array to prevent crashes
        setError(response.error || 'Invalid data format');
      }
    } catch (err) {
      setBanners([]); // Ensure it stays an array on error
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners: Array.isArray(banners) ? banners : [], // Safety return
    loading,
    error,
    refreshBanners: fetchBanners 
  };
};

export default useBanners;