// IMPORTANT: This must be the first import!
import 'react-native-gesture-handler';

import {
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';
import { disableFontScaling } from '../constants/Typography';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import NotificationService from '../services/notificationService';
import { configureModernEdgeToEdge } from '../utils/edgeToEdgeConfig';
import { TawkPrefetcher } from '../components/TawkSupport';
import { useAutoRestartAfterTimeout } from '../hooks/userestart';

const TAWK_DIRECT_LINK =
  process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK ||
  'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  // Disable font scaling globally
  useEffect(() => {
    disableFontScaling();
    const { TextInput } = require('react-native');
    if (TextInput && TextInput.defaultProps == null) {
      (TextInput as any).defaultProps = { allowFontScaling: false };
    }
  }, []);

  // Fonts
  const [loaded, error] = useFonts({
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // App state
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Simulate async auth readiness
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setIsAuthReady(true);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // App ready when fonts and auth are ready
  useEffect(() => {
    if ((loaded || error) && isAuthReady) setIsAppReady(true);
  }, [loaded, error, isAuthReady]);

  // Configure modern edge-to-edge
  useEffect(() => {
    configureModernEdgeToEdge();
  }, []);

  // Initialize push token
  useEffect(() => {
    const initializePushTokenEarly = async () => {
      try {
        const Device = await import('expo-device');
        if (!Device.isDevice) {
          console.log('⚠️ [LAYOUT] Not a physical device, skipping token generation');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📱 [LAYOUT] Initializing push token on app boot...');
        const result = await NotificationService.initializePushNotifications();

        if (result.success) {
          console.log(result.skipped
            ? '✅ [LAYOUT] Push token already exists, skipped'
            : '✅ [LAYOUT] Push token initialized and registered successfully'
          );
        } else {
          console.error('❌ [LAYOUT] Push token initialization failed:', result.error);
          setTimeout(async () => {
            console.log('🔄 [LAYOUT] Retrying push token initialization...');
            await NotificationService.initializePushNotifications();
          }, 3000);
        }
      } catch (error) {
        console.error('❌ [LAYOUT] Error initializing push token:', (error as Error).message);
        setTimeout(async () => {
          try {
            console.log('🔄 [LAYOUT] Retrying push token initialization after error...');
            await NotificationService.initializePushNotifications();
          } catch (retryError) {
            console.error('❌ [LAYOUT] Push token initialization failed on retry:', (retryError as Error).message);
          }
        }, 5000);
      }
    };

    initializePushTokenEarly();
  }, []);

  // Notification listeners
  useEffect(() => {
    NotificationService.setupListeners(
      (notification: any) => console.log('📨 Notification received:', notification),
      (response: any) => console.log('👆 Notification tapped:', response)
    );

    return () => NotificationService.removeListeners();
  }, []);

  // Splash completion
  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  // -----------------------------
  // Auto-restart after 30 minutes
  // -----------------------------
  // Hook is ALWAYS called, enabled only when app and auth are ready
  useAutoRestartAfterTimeout(isAppReady && isAuthReady, 30 * 60 * 1000);

  // Show splash until ready
  if (!isAppReady || !isSplashAnimationComplete) {
    return <ProfessionalSplashScreen onAnimationComplete={handleSplashAnimationComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F4F2FF' }}>
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top']}
          style={{ flex: 1, backgroundColor: '#F4F2FF', width: '100%' }}
        >
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                animation: 'slide_from_right',
              }}
            />
            <TawkPrefetcher directLink={TAWK_DIRECT_LINK} />
          </AuthProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
