import { useState, useEffect, useCallback } from 'react';

export function useApi(apiCall, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 useApi: Starting API call');
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success && response.data) {
        console.log('✅ useApi: API call successful');
        setData(response.data);
      } else {
        console.log('❌ useApi: API call failed', response.error);
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.log('💥 useApi: Exception caught', err.message);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}