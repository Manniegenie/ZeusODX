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
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { configureModernEdgeToEdge } from '../utils/edgeToEdgeConfig';
import { getLayoutConfig } from '../utils/responsiveLayout';

// Optional: warm up Tawk chat on app start
import { TawkPrefetcher } from '../components/TawkSupport';

// Expo Notifications imports
import { initializeExpoNotifications, setupNotificationListeners } from '../services/expoNotificationService';

const TAWK_DIRECT_LINK =
  process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK ||
  'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

// Auth Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
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

  // Initialize auth and Expo Notifications (simulate auth check delay)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize Expo Notifications
        console.log('🚀 Initializing Expo Notifications...');
        const notificationResult = await initializeExpoNotifications();
        if (notificationResult.success) {
          console.log('✅ Expo Notifications initialized successfully');
        } else {
          console.log('⚠️ Expo Notifications initialization failed:', notificationResult.error);
        }

        // Set up notification listeners
        setupNotificationListeners();

        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsAuthReady(true);
      }
    };
    initializeAuth();
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
            maxWidth: layoutConfig.containerWidth,
            alignSelf: 'center',
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