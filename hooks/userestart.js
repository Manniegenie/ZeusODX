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
    // CRITICAL: Won't lock if user hasn't reached protected content yet
    if (!isSessionActive || isExcluded || isLocked) {
      console.log('Lock prevented:', { isSessionActive, isExcluded, isLocked });
      return;
    }
    console.log('Locking app');
    setIsLocked(true);
  };

  const unlockApp = () => {
    console.log('Unlocking app');
    setIsLocked(false);
    resetTimer();
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
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App going to background - locking');
        lockApp();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isLocked, isSessionActive, pathname]);

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