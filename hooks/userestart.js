// hooks/useSecurityLock.js
import { useEffect, useRef, useState } from 'react';
import { AppState, PanResponder } from 'react-native';
import { usePathname } from 'expo-router';

export function useSecurityLock(enabled = true, timeoutMs = 120000) {
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const isExcluded = pathname === '/' || pathname.includes('login') || pathname.includes('onboarding');

  const activateSession = () => {
    if (!isSessionActive) {
      console.log('Session activated - lock can now engage');
      setIsSessionActive(true);
    }
  };

  const lockApp = () => {
    try {
      // CRITICAL: Won't lock if user hasn't reached protected content yet
      if (!isSessionActive || isExcluded || isLocked) {
        if (__DEV__) {
          console.log('Lock prevented:', { isSessionActive, isExcluded, isLocked });
        }
        return;
      }
      if (__DEV__) {
        console.log('Locking app');
      }
      setIsLocked(true);
    } catch (error) {
      if (__DEV__) {
        console.error('Error locking app:', error);
      }
      // Don't lock if there's an error
    }
  };

  const unlockApp = () => {
    try {
      console.log('Unlocking app');
      setIsLocked(false);
      resetTimer();
    } catch (error) {
      console.error('Error unlocking app:', error);
      // Try to unlock anyway to prevent permanent lock
      setIsLocked(false);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!enabled || !isSessionActive || isExcluded || isLocked) {
      return;
    }
    timerRef.current = setTimeout(() => {
      console.log('Inactivity timeout - locking app');
      lockApp();
    }, timeoutMs);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
    })
  ).current;

  // Handle app state changes (background/foreground)
  // DISABLED: Auto-lock on background causes issues with share dialogs
  // Only inactivity timer will lock the app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      try {
        appState.current = nextAppState;

        // Just track state changes, don't auto-lock
        // User will be locked out only after inactivity timeout
        if (__DEV__) {
          console.log('App state changed to:', nextAppState);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error in AppState change handler:', error);
        }
      }
    });

    return () => {
      try {
        subscription.remove();
      } catch (error) {
        if (__DEV__) {
          console.error('Error removing AppState listener:', error);
        }
      }
    };
  }, [pathname]);

  // Reset timer when dependencies change
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, pathname, isLocked, isSessionActive]);

  return { panHandlers: panResponder.panHandlers, isLocked, unlockApp, activateSession };
}