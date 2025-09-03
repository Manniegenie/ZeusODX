import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  BricolageGrotesque_200ExtraLight,
  BricolageGrotesque_300Light,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthProvider, AuthContext } from '../hooks/useAuth';
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';

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

  // Initialize auth (simulate auth check delay)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F4F2FF' }}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          {/* Optional: hidden prefetcher that warms up Tawk for instant open */}
          <TawkPrefetcher directLink={TAWK_DIRECT_LINK} />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
