// hooks/useLogout.js
import { useCallback, useRef, useState } from 'react';
import logoutService from '../services/logoutService';

/**
 * Hook to handle logout flow.
 * 
 * @param {{
 *   onSuccess?: (res:{success:boolean,message:string})=>void,
 *   onError?: (err:{error:string,message:string})=>void,
 *   clearStorage?: ()=>Promise<void>|void  // optional: clear tokens/local state
 * }} opts
 */
export function useLogout(opts = {}) {
  const { onSuccess, onError, clearStorage } = opts;

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const logout = useCallback(
    async ({ userId, refreshToken } = {}) => {
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoggingOut(true);
      setError(null);

      try {
        const res = await logoutService.logout({
          userId,
          refreshToken,
          signal: controller.signal,
        });

        if (res?.success) {
          try {
            await clearStorage?.(); // optional
          } catch { /* ignore storage errors */ }
          onSuccess?.(res);
        } else {
          const err = {
            error: res?.error || 'FETCH_FAILED',
            message: res?.message || 'Logout failed',
          };
          setError(err);
          onError?.(err);
        }
        return res;
      } finally {
        setLoggingOut(false);
      }
    },
    [onSuccess, onError, clearStorage]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort?.();
  }, []);

  const reset = useCallback(() => setError(null), []);

  return {
    logout,     // call with { userId, refreshToken }
    loggingOut, // boolean
    error,      // { error, message } | null
    cancel,     // abort inflight request
    reset,      // clear local error
  };
}

export default useLogout;
