import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../hooks/usenotification';
import { simpleAppState } from '../services/appstate';

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    checkStatus,
    requestPermission,
    setupListeners,
    removeListeners,
  } = useNotifications();

  useEffect(() => {
    console.log('🚀 Starting HomeScreen useEffect');
    // Token initialization moved to _layout.tsx to run for all users
    initializeApp();

    // Handle notification that opened the app from closed state
    console.log('🔍 Checking for initial notification response');
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('📨 Initial notification response found:', JSON.stringify(response, null, 2));
        handleNotificationTap(response);
      } else {
        console.log('ℹ️ No initial notification response');
      }
    });

    return () => {
      console.log('🧹 Cleaning up notification listeners');
      removeListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Initializing app...');
    setIsLoading(true);
    
    try {
      console.log('🔍 Setting up notifications');
      await setupNotifications();
      console.log('🔍 Determining initial route');
      await determineInitialRoute();
      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ Error initializing app:', (error as Error).message, (error as Error).stack);
      router.replace('/onboarding/welcome');
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
    }
  };

  const setupNotifications = async () => {
    try {
      // Token is already generated in _layout.tsx
      // Here we only set up listeners for displaying notifications
      const enabled = await checkStatus();
      
      if (enabled) {
        setupListeners(
          (notification: any) => {
            // Notification received while app is open
          },
          (response: any) => {
            handleNotificationTap(response);
          }
        );
      } else {
        // Try to request permission for displaying notifications (optional)
        // Token generation doesn't require permission
        const permissionResult = await requestPermission();
        if (permissionResult.success) {
          setupListeners(
            (notification: any) => {
              // Notification received while app is open
            },
            (response: any) => {
              handleNotificationTap(response);
            }
          );
        }
      }
    } catch (error) {
      console.error('Error setting up notifications:', (error as Error).message);
    }
  };

  const handleNotificationTap = async (response: any) => {
    console.log('🔍 Processing notification tap:', JSON.stringify(response, null, 2));
    const data = response.notification.request.content.data;
    const actionId = response.actionIdentifier;

    if (actionId && actionId !== 'DEFAULT') {
      console.log('🔍 Handling notification action:', actionId);
      try {
        // Handle custom notification actions here
        console.log('✅ Notification action handled');
      } catch (error) {
        console.error('❌ Error handling notification action:', (error as Error).message, (error as Error).stack);
      }
      return;
    }

    if (data?.screen) {
      console.log('🧭 Navigating from notification to screen:', data.screen);
      switch (data.screen) {
        case 'profile':
          router.push('/(tabs)/profile' as any);
          console.log('✅ Navigated to profile');
          break;
        case 'home':
          router.push('/(tabs)/home' as any);
          console.log('✅ Navigated to home');
          break;
        case 'messages':
          router.push('/messages' as any);
          console.log('✅ Navigated to messages');
          break;
        case 'details':
          if (data.id) {
            router.push(`/details/${data.id}` as any);
            console.log('✅ Navigated to details:', data.id);
          } else {
            console.log('❌ No ID provided for details screen');
          }
          break;
        default:
          console.log('🔄 Unknown notification screen:', data.screen);
          break;
      }
    }

    if (data?.action) {
      console.log('🔍 Processing notification action:', data.action);
      switch (data.action) {
        case 'refresh_data':
          console.log('🔄 Refreshing data from notification');
          // Trigger data refresh here
          break;
        case 'open_url':
          if (data.url) {
            console.log('🔗 Opening URL:', data.url);
            // Uncomment if you want to open URLs:
            // import { Linking } from 'react-native';
            // Linking.openURL(data.url);
          } else {
            console.log('❌ No URL provided for open_url action');
          }
          break;
        default:
          console.log('🔄 Unknown notification action:', data.action);
          break;
      }
    }
  };

  const determineInitialRoute = async () => {
    console.log('🚀 Determining initial app route...');
    try {
      const screenType = await simpleAppState.getInitialScreen();
      console.log('📍 App state recommends screen:', screenType);
      switch (screenType) {
        case 'onboarding':
          console.log('🧭 Navigating to onboarding');
          router.replace('/onboarding/welcome');
          break;
        case 'phone-entry':
          console.log('🧭 Navigating to phone entry');
          router.replace('/login/login-phone');
          break;
        case 'pin-entry':
          console.log('🧭 Navigating to pin entry');
          router.replace('/login/login-pin');
          break;
        default:
          console.log('🧭 Default: Navigating to onboarding');
          router.replace('/onboarding/welcome');
          break;
      }
    } catch (error) {
      console.error('❌ Error determining route:', (error as Error).message, (error as Error).stack);
      router.replace('/onboarding/welcome');
    }
  };

  // ========== EXAMPLE: Functions you can call from anywhere in your app ==========
  
  // To enable notifications (requests permission)
  const handleEnableNotifications = async () => {
    console.log('🔔 User requested to enable notifications');
    const result = await enable();
    if (result.success) {
      console.log('✅ Notifications enabled successfully');
      // Setup listeners after enabling
      setupListeners(
        (notification: any) => console.log('📨 Notification received:', notification),
        (response: any) => handleNotificationTap(response)
      );
    } else {
      console.log('❌ Failed to enable notifications:', result.message);
    }
  };

  // To open settings (when user wants to disable or change permissions)
  const handleOpenNotificationSettings = async () => {
    console.log('⚙️ Opening notification settings');
    await openSettings();
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});