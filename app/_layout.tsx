// app/_layout.tsx

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, TextInput } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Fonts & Styles
import { BricolageGrotesque_200ExtraLight, BricolageGrotesque_300Light, BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold, useFonts } from '@expo-google-fonts/bricolage-grotesque';
import { Colors } from '../constants/Colors';
import { disableFontScaling } from '../constants/Typography';

// Components & Hooks
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';
import SimpleLock from '../components/Security-lock';
import { TawkPrefetcher } from '../components/TawkSupport';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { useSecurityLock } from '../hooks/userestart';
import NotificationService from '../services/notificationService';
import { configureModernEdgeToEdge } from '../utils/edgeToEdgeConfig';

const TAWK_DIRECT_LINK = process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK || 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

/**
 * CRITICAL FOR ANDROID:
 * This handler determines how the OS behaves when a notification 
 * is received while the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const auth = useAuthProvider();
  const pathname = usePathname();

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_200ExtraLight, BricolageGrotesque_300Light, BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  const { panHandlers, isLocked, unlockApp, activateSession } = useSecurityLock(isAppReady, 120000);

  // 1. Initial System Configurations
  useEffect(() => {
    disableFontScaling();
    if (TextInput.defaultProps) TextInput.defaultProps.allowFontScaling = false;
    configureModernEdgeToEdge();
  }, []);

  // 2. Set Overall App Ready State
  useEffect(() => {
    if (fontsLoaded) setIsAppReady(true);
  }, [fontsLoaded]);

  // 3. CRITICAL: Setup Android notification channels EARLY
  // This must happen BEFORE any notifications are sent from backend
  useEffect(() => {
    if (!isAppReady) return;
    
    const setupChannelsEarly = async () => {
      if (Platform.OS === 'android' && Device.isDevice) {
        try {
          console.log('📱 [LAYOUT] Creating Android notification channels...');
          await NotificationService.setupAndroidNotificationChannel();
          console.log('✅ [LAYOUT] Android notification channels ready');
        } catch (error) {
          console.error('❌ [LAYOUT] Failed to create notification channels:', error);
        }
      }
    };
    
    setupChannelsEarly();
  }, [isAppReady]);

  // 4. Setup notification listeners (passive, no token registration)
  useEffect(() => {
    if (!isAppReady) return;

    // Foreground notification listener
    const subReceived = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Foreground Notification Received:', notification.request.content);
    });

    // Notification tap listener
    const subResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification Tapped:', response.notification.request.content);
      // TODO: Add navigation based on notification data
      // const data = response.notification.request.content.data;
      // if (data?.screen) router.push(data.screen);
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
    };
  }, [isAppReady]);

  // 5. Security Session Tracking
  useEffect(() => {
    if (pathname.includes('user/dashboard')) activateSession();
  }, [pathname]);

  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

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
                gestureEnabled: false,
              }}
            />
            <TawkPrefetcher directLink={TAWK_DIRECT_LINK} />
            {isLocked && (
              <Modal
                visible={isLocked}
                animationType="fade"
                transparent={false}
                statusBarTranslucent={false}
                presentationStyle="fullScreen"
              >
                <SimpleLock onSuccess={unlockApp} />
              </Modal>
            )}
          </AuthContext.Provider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}