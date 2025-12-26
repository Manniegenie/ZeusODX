// hooks/userestart.js
import { useEffect, useRef } from 'react';
import RNRestart from 'react-native-restart';
import { Platform } from 'react-native';

/**
 * Auto-restarts the app after a timeout.
 * @param enabled Whether the timer is active (default true)
 * @param timeoutMs Timeout in milliseconds (default 15 minutes)
 */
export function useAutoRestartAfterTimeout(enabled = true, timeoutMs = 15 * 60 * 1000) {
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) return;

    // Start new timer
    timerRef.current = setTimeout(() => {
      console.log('🔄 15 minutes reached — restarting app...');
      try {
        RNRestart.restart();
      } catch (e) {
        console.error('Failed to restart app:', e);
        if (Platform.OS === 'android') {
          const { BackHandler } = require('react-native');
          BackHandler.exitApp();
        }
      }
    }, timeoutMs);

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, timeoutMs]);
}
