// hooks/useUserProfile.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { userProfileService } from '../services/profileService';

/**
 * React hook to load the authenticated user's profile.
 * @param {{ auto?: boolean, onSuccess?: (profile:any)=>void, onError?: (err:{error:string,message:string})=>void }} [options]
 * @returns {{
 *   profile: any,
 *   loading: boolean,
 *   refreshing: boolean,
 *   error: null | { error: string, message: string },
 *   refetch: () => Promise<void>,
 *   displayName: string,
 *   avatarUrl: string | null,
 *   hasAvatar: boolean
 * }}
 */
export function useUserProfile(options = {}) {
  const { auto = true, onSuccess, onError } = options;

  const abortRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(auto));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ refreshingRun = false } = {}) => {
    // Abort any in-flight request
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
  }, [onSuccess, onError]);

  const refetch = useCallback(async () => {
    await load({ refreshingRun: true });
  }, [load]);

  useEffect(() => {
    if (auto) load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [auto, load]);

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
