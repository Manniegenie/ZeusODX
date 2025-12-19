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

// Optional: warm up Tawk chat on app start
import { TawkPrefetcher } from '../components/TawkSupport';

const TAWK_DIRECT_LINK =
  process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK ||
  'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

// Auth Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  // Disable font scaling globally to prevent device text size from affecting app layout
  useEffect(() => {
    disableFontScaling();
    // Also set TextInput default props if needed
    const { TextInput } = require('react-native');
    if (TextInput) {
      const TextInputComponent = TextInput as any;
      if (TextInputComponent.defaultProps == null) {
        TextInputComponent.defaultProps = {};
      }
      TextInputComponent.defaultProps.allowFontScaling = false;
    }
  }, []);

  // Font loading
  const [loaded, error] = useFonts({
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // App state management
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Simulate async auth readiness (notifications handled elsewhere)
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        setIsAuthReady(true);
      }
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Set app ready when fonts and auth are loaded
  useEffect(() => {
    if ((loaded || error) && isAuthReady) {
      setIsAppReady(true);
    }
  }, [loaded, error, isAuthReady]);

  // Configure modern edge-to-edge for Android 15+ (no deprecated APIs)
  useEffect(() => {
    configureModernEdgeToEdge();
  }, []);

  // CRITICAL: Initialize push token early - runs for ALL users on app boot
  // Must happen before navigation to ensure token is registered
  useEffect(() => {
    const initializePushTokenEarly = async () => {
      try {
        const Device = await import('expo-device');
        if (!Device.isDevice) {
          console.log('⚠️ [LAYOUT] Not a physical device, skipping token generation');
          return;
        }

        // Wait a bit for network to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('📱 [LAYOUT] Initializing push token on app boot...');
        const result = await NotificationService.initializePushNotifications();
        
        if (result.success) {
          if (result.skipped) {
            console.log('✅ [LAYOUT] Push token already exists, skipped');
          } else {
            console.log('✅ [LAYOUT] Push token initialized and registered successfully');
          }
        } else {
          console.error('❌ [LAYOUT] Push token initialization failed:', result.error);
          // Retry after 3 seconds
          setTimeout(async () => {
            console.log('🔄 [LAYOUT] Retrying push token initialization...');
            const retryResult = await NotificationService.initializePushNotifications();
            if (retryResult.success) {
              console.log('✅ [LAYOUT] Push token initialized on retry');
            } else {
              console.error('❌ [LAYOUT] Push token initialization failed on retry:', retryResult.error);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('❌ [LAYOUT] Error initializing push token:', (error as Error).message, (error as Error).stack);
        // Retry after 5 seconds
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

  // Setup global notification listeners
  useEffect(() => {
    // Setup listeners for notifications received while app is running
    NotificationService.setupListeners(
      // When notification received
      (notification: any) => {
        console.log('📨 Notification received:', notification);
        // You can add custom handling here, e.g., update badge count
      },
      // When notification tapped
      (response: any) => {
        console.log('👆 Notification tapped:', response);
        // You can add navigation logic here based on notification data
        const data = response.notification.request.content.data;
        if (data?.type) {
          // Handle different notification types
          console.log('Notification type:', data.type);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      NotificationService.removeListeners();
    };
  }, []);

  // Handle splash screen completion
  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  // Show splash screen until everything is ready
  if (!isAppReady || !isSplashAnimationComplete) {
    return <ProfessionalSplashScreen onAnimationComplete={handleSplashAnimationComplete} />;
  }

  // Main app layout
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F4F2FF' }}>
      <SafeAreaProvider>
        <SafeAreaView 
          edges={['top']} 
          style={{ 
            flex: 1, 
            backgroundColor: '#F4F2FF',
            width: '100%',
          }}
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
            {/* Optional: hidden prefetcher that warms up Tawk for instant open */}
            <TawkPrefetcher directLink={TAWK_DIRECT_LINK} />
          </AuthProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}