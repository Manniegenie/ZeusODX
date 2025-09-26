import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { simpleAppState } from '../services/appstate';
import { useNotifications } from '../hooks/usenotification';
import * as Notifications from 'expo-notifications';

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the notifications hook
  const {
    initialize: initializeNotifications,
    setupListeners,
    removeListeners,
    clearBadge,
    turnOffNotifications,
    turnOnNotifications,
    isInitialized,
    isPermissionGranted,
    pushToken,
    error: notificationError,
  } = useNotifications();

  useEffect(() => {
    console.log('🚀 Starting HomeScreen useEffect');
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
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Initializing app...');
    setIsLoading(true);
    
    try {
      console.log('🔍 Initializing notifications');
      await setupNotifications();
      console.log('🔍 Determining initial route');
      await determineInitialRoute();
      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ Error initializing app:', error.message, error.stack);
      router.replace('/onboarding/welcome');
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
    }
  };

  const setupNotifications = async () => {
    console.log('🔔 Starting notification initialization');
    try {
      const success = await initializeNotifications();
      if (success) {
        console.log('🔧 Setting up notification listeners');
        setupListeners(
          (notification) => {
            console.log('📨 Received notification while app is open:', JSON.stringify(notification, null, 2));
          },
          (response) => {
            console.log('👆 Handling notification tap');
            handleNotificationTap(response);
          }
        );
        console.log('🔍 Clearing notification badge');
        await clearBadge();
        console.log('✅ Notification initialization complete');
      } else {
        console.log('❌ Notification initialization failed');
      }
    } catch (error) {
      console.error('❌ Error setting up notifications:', error.message, error.stack);
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
        console.error('❌ Error handling notification action:', error.message, error.stack);
      }
      return;
    }

    if (data?.screen) {
      console.log('🧭 Navigating from notification to screen:', data.screen);
      switch (data.screen) {
        case 'profile':
          router.push('/(tabs)/profile');
          console.log('✅ Navigated to profile');
          break;
        case 'home':
          router.push('/(tabs)/home');
          console.log('✅ Navigated to home');
          break;
        case 'messages':
          router.push('/messages');
          console.log('✅ Navigated to messages');
          break;
        case 'details':
          if (data.id) {
            router.push(`/details/${data.id}`);
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
          break;
        case 'open_url':
          if (data.url) {
            console.log('🔗 Opening URL:', data.url);
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
      console.error('❌ Error determining route:', error.message, error.stack);
      router.replace('/onboarding/welcome');
    }
  };

  // Example functions you can call from anywhere in your app
  const handleTurnOffNotifications = async () => {
    console.log('🔕 User requested to turn off notifications');
    const success = await turnOffNotifications();
    if (success) {
      console.log('✅ Notifications turned off successfully');
    } else {
      console.log('❌ Failed to turn off notifications');
    }
  };

  const handleTurnOnNotifications = async () => {
    console.log('🔔 User requested to turn on notifications');
    const success = await turnOnNotifications();
    if (success) {
      console.log('✅ Notifications turned on successfully');
    } else {
      console.log('❌ Failed to turn on notifications');
    }
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