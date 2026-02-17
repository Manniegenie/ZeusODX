// app/_layout.tsx

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, TextInput, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Fonts & Styles
import { BricolageGrotesque_200ExtraLight, BricolageGrotesque_300Light, BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold, useFonts } from '@expo-google-fonts/bricolage-grotesque';
import { Colors } from '../constants/Colors';
import { disableFontScaling } from '../constants/Typography';

// Components & Hooks
import ProfessionalSplashScreen from '../components/ProfessionalSplashScreen';
import SimpleLock from '../components/Security-lock';
import { TawkPrefetcher } from '../components/TawkSupport';
import { DisplayCurrencyProvider } from '../contexts/DisplayCurrencyContext';
import { AuthContext, useAuthProvider, useAuth } from '../hooks/useAuth';
import { useSecurityLock } from '../hooks/userestart';
import NotificationService from '../services/notificationService';
import { configureModernEdgeToEdge } from '../utils/edgeToEdgeConfig';
import AppsFlyerService from '../services/appsFlyerService';
import { appsFlyerApiService } from '../services/appsFlyerApiService';
import * as TrackingTransparency from 'expo-tracking-transparency';

const TAWK_DIRECT_LINK = process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK || 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl';

// AppsFlyer UID Handler Component
// This component handles sending AppsFlyer UID to backend when user is authenticated
function AppsFlyerUIDHandler() {
  const auth = useAuth();
  const [uidSent, setUidSent] = useState(false);

  useEffect(() => {
    const sendAppsFlyerUID = async () => {
      // Only send if user is authenticated and we haven't sent it yet
      if (!auth.isAuthenticated || !auth.user || uidSent) {
        return;
      }

      try {
        // Get AppsFlyer UID
        const uidResult = await AppsFlyerService.getAppsFlyerUID();
        
        if (uidResult.success && uidResult.uid) {
          // Set user ID in AppsFlyer
          if (auth.user.id || auth.user._id) {
            await AppsFlyerService.setUserId(auth.user.id || auth.user._id);
          }

          // Send UID to backend
          const apiResult = await appsFlyerApiService.storeAppsFlyerId(uidResult.uid);
          
          if (apiResult.success) {
            if (__DEV__) {
              console.log('✅ AppsFlyer UID sent to backend successfully');
            }
            setUidSent(true);
          } else {
            if (__DEV__) {
              console.warn('⚠️ Failed to send AppsFlyer UID to backend:', apiResult.error);
            }
            // Retry after 5 seconds
            setTimeout(() => {
              setUidSent(false);
            }, 5000);
          }
        } else {
          if (__DEV__) {
            console.warn('⚠️ Failed to get AppsFlyer UID:', uidResult.error);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error sending AppsFlyer UID:', error);
        }
      }
    };

    sendAppsFlyerUID();
  }, [auth.isAuthenticated, auth.user, uidSent]);

  return null;
}

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

  // Initialize AppsFlyer SDK on app start
  useEffect(() => {
    const initializeAppsFlyer = async () => {
      try {
        // Request iOS ATT permission first (if running ads)
        if (Platform.OS === 'ios') {
          try {
            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
            if (__DEV__) {
              console.log('📱 iOS ATT permission status:', status);
            }
          } catch (attError) {
            if (__DEV__) {
              console.warn('⚠️ ATT permission request error:', attError);
            }
          }
        }

        // Initialize AppsFlyer SDK with attribution and deep link listeners
        const result = await AppsFlyerService.init(
          // Install Conversion Data Listener (GCD) - for attribution
          (conversionData) => {
            // Handle install attribution data
            // This provides attribution information about how the user installed the app
            if (conversionData?.isFirstLaunch) {
              if (__DEV__) {
                console.log('🎯 First install detected!', {
                  media_source: conversionData.media_source,
                  campaign: conversionData.campaign,
                  af_status: conversionData.af_status
                });
              }
              // You can send this attribution data to your backend if needed
              // Example: track which campaign/source brought this user
            }
          },
          // Deep Link Listener (UDL) - for deep linking
          (deepLinkData) => {
            // Handle deep link data
            // This provides deep link information when user opens app via deep link
            if (__DEV__) {
              console.log('🔗 Deep link opened:', deepLinkData);
            }
            // You can navigate to specific screens based on deep link data
            // Example: if (deepLinkData.deep_link_value) { navigate(deepLinkData.deep_link_value) }
          }
        );
        
        if (result.success) {
          if (__DEV__) {
            console.log('✅ AppsFlyer initialized successfully');
          }
        } else {
          if (__DEV__) {
            console.error('❌ AppsFlyer initialization failed:', result.error);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error initializing AppsFlyer:', error);
        }
      }
    };

    initializeAppsFlyer();
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

  const showSplash = !isAppReady || !isSplashAnimationComplete;

  const bgColor = Colors.background || '#F4F2FF';

  return (
    <AuthContext.Provider value={auth}>
      <DisplayCurrencyProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }} {...(showSplash ? {} : panHandlers)}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: bgColor }}>
          <View style={{ flex: 1, backgroundColor: bgColor }}>
            {showSplash ? (
              <ProfessionalSplashScreen onAnimationComplete={handleSplashAnimationComplete} />
            ) : (
              <>
                <AppsFlyerUIDHandler />
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
              </>
            )}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
      </DisplayCurrencyProvider>
    </AuthContext.Provider>
  );
}