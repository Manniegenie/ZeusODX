import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { userProfileService } from '../services/profileService';
import { useAuth } from './useAuth';

/**
 * Custom hook for managing user profile data
 * @param {Object} options - Hook options
 * @param {boolean} options.auto - Auto-fetch on mount (default: true)
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @returns {Object} Profile state and methods
 */
export function useUserProfile(options = {}) {
  const { auto = true, onSuccess, onError } = options;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const abortRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Keep refs updated without causing re-renders
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  /**
   * Load profile data from API
   * @param {Object} opts - Load options
   * @param {boolean} opts.refreshingRun - Is this a refresh operation
   */
  const load = useCallback(async ({ refreshingRun = false } = {}) => {
    // Guard: Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }

    // Abort previous request if exists
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      refreshingRun ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await userProfileService.getProfile({ signal: controller.signal });

      if (res.success && res.data) {
        setProfile(res.data);
        onSuccessRef.current?.(res.data);
      } else {
        const err = { 
          error: res.error || 'FETCH_FAILED', 
          message: res.message || 'Failed to load profile' 
        };
        setError(err);
        onErrorRef.current?.(err);
      }
    } catch (error) {
      // Only handle non-abort errors
      if (error?.name !== 'AbortError') {
        const err = { 
          error: 'EXCEPTION', 
          message: error?.message || 'An error occurred while loading profile' 
        };
        setError(err);
        onErrorRef.current?.(err);
      }
    } finally {
      refreshingRun ? setRefreshing(false) : setLoading(false);
      abortRef.current = null;
    }
  }, [isAuthenticated]);

  /**
   * Refetch profile data (refresh operation)
   */
  const refetch = useCallback(async () => {
    await load({ refreshingRun: true });
  }, [load]);

  // Auto-fetch on mount and when auth state changes
  useEffect(() => {
    if (auto && !authLoading && isAuthenticated && !loading && !profile) {
      load();
    }
    
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [auto, authLoading, isAuthenticated, load]);

  // Memoized computed values
  const displayName = useMemo(() => {
    if (!profile) return '';
    return profile.fullName || profile.username || profile.email || '';
  }, [profile?.fullName, profile?.username, profile?.email]);

  const avatarUrl = useMemo(() => {
    if (!profile?.avatar?.url) return null;
    const cacheKey = profile.avatar.cacheKey;
    return cacheKey ? `${profile.avatar.url}?t=${cacheKey}` : profile.avatar.url;
  }, [profile?.avatar?.url, profile?.avatar?.cacheKey]);

  const hasAvatar = useMemo(() => Boolean(profile?.avatar?.url), [profile?.avatar?.url]);

  return {
    profile,
    loading,
    refreshing,
    error,
    refetch,
    displayName,
    avatarUrl,
    hasAvatar,
  };
}
