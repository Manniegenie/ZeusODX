import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { userProfileService } from '../services/profileService';
import { useAuth } from './useAuth';

export function useUserProfile(options = {}) {
  const { auto = true, onSuccess, onError } = options;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const abortRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ refreshingRun = false } = {}) => {
    // Guard: Don't fetch if not authenticated
    if (!isAuthenticated) {
      console.log('⏸️ Skipping profile fetch - not authenticated');
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      refreshingRun ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await userProfileService.getProfile({ signal: controller.signal });

      if (res.success) {
        setProfile(res.data);
        onSuccess?.(res.data);
      } else {
        const err = { error: res.error || 'FETCH_FAILED', message: res.message || 'Failed to load profile' };
        setError(err);
        onError?.(err);
      }
    } finally {
      refreshingRun ? setRefreshing(false) : setLoading(false);
    }
  }, [isAuthenticated, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await load({ refreshingRun: true });
  }, [load]);

  useEffect(() => {
    // Only auto-fetch if authenticated and auth is done loading
    if (auto && !authLoading && isAuthenticated) {
      load();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [auto, authLoading, isAuthenticated, load]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    return profile.fullName || profile.username || profile.email || '';
  }, [profile]);

  const avatarUrl = useMemo(() => {
    if (!profile?.avatar?.url) return null;
    const t = profile?.avatar?.cacheKey ? `?t=${profile.avatar.cacheKey}` : '';
    return `${profile.avatar.url}${t}`;
  }, [profile]);

  const hasAvatar = Boolean(profile?.avatar?.url);

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