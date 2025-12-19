import { useCallback, useEffect, useMemo, useState } from 'react';
import { userProfileService } from '../services/profileService';

/**
 * Simple hook for fetching user profile data
 * Just call refetch() when you need fresh data (e.g., in useFocusEffect)
 */
export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await userProfileService.getProfile();

      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    error,
    refetch: fetchProfile,
    displayName,
    avatarUrl,
    hasAvatar,
  };
}
