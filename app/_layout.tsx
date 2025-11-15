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
import { getLayoutConfig } from '../utils/responsiveLayout';

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

  // Get responsive layout configuration
  const layoutConfig = getLayoutConfig();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView 
          edges={['top']} 
          style={{ 
            flex: 1, 
            backgroundColor: '#F4F2FF',
            // Only limit width on tablets/large screens, not on phones
            maxWidth: layoutConfig.isLarge ? layoutConfig.containerWidth : undefined,
            alignSelf: layoutConfig.isLarge ? 'center' : 'stretch',
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