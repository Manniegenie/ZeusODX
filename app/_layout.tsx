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
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthProvider, AuthContext } from '../hooks/useAuth';
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';

// Hide native splash immediately when module loads
SplashScreen.hideAsync();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  // ——— Load fonts (starts immediately) ———
  const [loaded, error] = useFonts({
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // ——— Loading states ———
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ——— Initialize auth and other resources ———
  useEffect(() => {
    async function prepareApp() {
      try {
        // Your initialization tasks
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsAuthReady(true);
      } catch (e) {
        console.warn('Error during app preparation:', e);
        setIsAuthReady(true);
      }
    }

    prepareApp();
  }, []);

  // ——— Check if everything is ready ———
  useEffect(() => {
    const fontsReady = loaded || error;
    
    if (fontsReady && isAuthReady) {
      setIsAppReady(true);
    }
  }, [loaded, error, isAuthReady]);

  // ——— Handle splash animation completion ———
  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  // ——— Determine when to show main app ———
  const shouldShowMainApp = isAppReady && isSplashAnimationComplete;

  // ——— Show custom splash or main app ———
  if (!shouldShowMainApp) {
    return (
      <ProfessionalSplashScreen 
        onAnimationComplete={handleSplashAnimationComplete}
      />
    );
  }

  // ——— Main app after everything is ready ———
  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={['top']}
        style={{
          flex: 1,
          backgroundColor: '#F4F2FF',
        }}
      >
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}