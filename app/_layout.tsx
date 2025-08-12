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
import { ZendeskProvider } from 'react-native-zendesk-unified';
import { useAuthProvider, AuthContext } from '../hooks/useAuth';
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';
import { zendeskConfig } from '../ZendeskConfig';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_200ExtraLight,
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await new Promise(r => setTimeout(r, 1000));
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if ((loaded || error) && isAuthReady) setIsAppReady(true);
  }, [loaded, error, isAuthReady]);

  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  if (!(isAppReady && isSplashAnimationComplete)) {
    return <ProfessionalSplashScreen onAnimationComplete={handleSplashAnimationComplete} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F4F2FF' }}>
        <ZendeskProvider zendeskConfig={zendeskConfig}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </AuthProvider>
        </ZendeskProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
