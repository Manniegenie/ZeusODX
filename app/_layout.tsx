// app/_layout.tsx
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
        // Simulate auth initialization delay
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
    return (
      <ProfessionalSplashScreen 
        onAnimationComplete={handleSplashAnimationComplete} 
      />
    );
  }

  // Main app layout
  return (
    <SafeAreaProvider>
      <SafeAreaView 
        edges={['top']} 
        style={{ 
          flex: 1, 
          backgroundColor: '#F4F2FF' 
        }}
      >
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { 
                backgroundColor: 'transparent' 
              },
            }}
          />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}