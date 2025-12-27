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
import { Stack, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Components & Config
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';
import SimpleLock from '../components/Security-lock';
import { TawkPrefetcher } from '../components/TawkSupport';
import { Colors } from '../constants/Colors';
import { disableFontScaling } from '../constants/Typography';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { useSecurityLock } from '../hooks/userestart';
import NotificationService from '../services/notificationService';
import { configureModernEdgeToEdge } from '../utils/edgeToEdgeConfig';

const TAWK_DIRECT_LINK = process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK || 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

export default function RootLayout() {
  const auth = useAuthProvider();
  const pathname = usePathname();

  // 1. Font Loading & App States
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

  // Security Lock logic
  const { panHandlers, isLocked, unlockApp, activateSession } = useSecurityLock(isAppReady, 120000);

  // 2. Global Configurations (Font Scaling & Edge-to-Edge)
  useEffect(() => {
    disableFontScaling();
    const { TextInput } = require('react-native');
    if (TextInput && TextInput.defaultProps) {
      TextInput.defaultProps.allowFontScaling = false;
    }
    configureModernEdgeToEdge();
  }, []);

  // 3. Auth Readiness check
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setIsAuthReady(true);
    }, 0);
    return () => { mounted = false; clearTimeout(timer); };
  }, []);

  // Set overall app ready state
  useEffect(() => {
    if ((loaded || error) && isAuthReady) {
      setIsAppReady(true);
    }
  }, [loaded, error, isAuthReady]);

  // 4. Robust Notification Initialization (with Retries)
  useEffect(() => {
    const initializePushTokenEarly = async () => {
      try {
        const Device = await import('expo-device');
        if (!Device.isDevice) return;

        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📱 [LAYOUT] Initializing push token...');
        const result = await NotificationService.initializePushNotifications();

        if (!result.success) {
          setTimeout(async () => {
            console.log('🔄 [LAYOUT] Retrying push token...');
            await NotificationService.initializePushNotifications();
          }, 3000);
        }
      } catch (err) {
        console.error('❌ [LAYOUT] Push Init Error:', err);
      }
    };

    initializePushTokenEarly();

    NotificationService.setupListeners(
      (notification) => console.log('📨 Received:', notification),
      (response) => console.log('👆 Tapped:', response)
    );

    return () => NotificationService.removeListeners();
  }, []);

  // 5. Security Lock activation
  useEffect(() => {
    if (pathname.includes('user/dashboard')) {
      activateSession();
    }
  }, [pathname]);

  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  // Show splash until fonts, auth, and animation are done
  if (!isAppReady || !isSplashAnimationComplete) {
    return <ProfessionalSplashScreen onAnimationComplete={handleSplashAnimationComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background || '#F4F2FF' }} {...panHandlers}>
      <SafeAreaProvider>
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.background || '#F4F2FF' }}>
          <AuthContext.Provider value={auth}>
            
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_right',
              }}
            />

            <TawkPrefetcher directLink={TAWK_DIRECT_LINK} />

            {/* Security Lock Modal */}
            <Modal 
              visible={isLocked} 
              animationType="fade" 
              transparent={false}
              statusBarTranslucent={true}
            >
              {isLocked && <SimpleLock onSuccess={unlockApp} />}
            </Modal>

          </AuthContext.Provider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}