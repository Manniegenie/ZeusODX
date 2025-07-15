// app/_layout.tsx
import React, { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  // ——— Load fonts ———
  const [loaded, error] = useFonts({
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // ——— Hide splash screen when fonts are loaded or error occurs ———
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // ——— Return null until fonts are loaded ———
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={['top']} // Only handle top safe area globally
        style={{
          flex: 1,
          backgroundColor: '#F4F2FF',
          // Removed bottom padding - let components handle their own bottom safe areas
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