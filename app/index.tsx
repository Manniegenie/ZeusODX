import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { simpleAppState } from '../services/appstate';
import NotificationService from '../services/notificationService';

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    
    return () => {
      // Cleanup notification listeners
      NotificationService.removeListeners();
    };
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Initializing app...');
    setIsLoading(true);
    
    try {
      // Initialize notifications (non-blocking)
      initializeNotifications();
      
      // Determine initial route
      await determineInitialRoute();
      
    } catch (error) {
      console.log('❌ Error initializing app:', error);
      router.replace('/onboarding/welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNotifications = async () => {
    try {
      // Initialize notification service
      const success = await NotificationService.initialize();
      
      if (success) {
        // Set up notification listeners
        NotificationService.setupListeners(
          (notification) => {
            // Handle foreground notifications
            console.log('📨 Received notification while app is open');
            // You can show custom UI here instead of system alert
          },
          (response) => {
            // Handle notification taps
            handleNotificationTap(response);
          }
        );

        // Register with backend (replace with your user ID logic)
        const userId = await getUserId(); // Implement this function
        if (userId) {
          await NotificationService.registerWithBackend(userId);
        }

        // Clear badge when app opens
        await NotificationService.clearBadge();
      }
      
    } catch (error) {
      console.log('❌ Error setting up notifications:', error);
    }
  };

  const handleNotificationTap = async (response: any) => {
    const data = response.notification.request.content.data;
    const actionId = response.actionIdentifier;

    // Handle notification actions first
    if (actionId && actionId !== 'DEFAULT') {
      await NotificationService.handleNotificationAction(
        actionId, 
        response.notification
      );
      return;
    }

    // Handle navigation based on notification data
    if (data?.screen) {
      console.log('🧭 Navigating from notification:', data.screen);
      
      switch (data.screen) {
        case 'profile':
          router.push('/(tabs)/profile');
          break;
        case 'home':
          router.push('/(tabs)/home');
          break;
        case 'messages':
          router.push('/messages');
          break;
        case 'details':
          if (data.id) {
            router.push(`/details/${data.id}` as any);
          }
          break;
        default:
          console.log('🔄 Unknown notification screen:', data.screen);
          break;
      }
    }

    // Handle custom actions
    if (data?.action) {
      switch (data.action) {
        case 'refresh_data':
          // Trigger data refresh
          console.log('🔄 Refreshing data from notification');
          break;
        case 'open_url':
          // Open URL
          if (data.url) {
            // Linking.openURL(data.url);
          }
          break;
        default:
          console.log('🔄 Unknown notification action:', data.action);
          break;
      }
    }
  };

  const getUserId = async (): Promise<string | null> => {
    // Replace this with your actual user ID retrieval logic
    // For example, from AsyncStorage, auth context, or API
    try {
      // Example implementations:
      // const userId = await AsyncStorage.getItem('userId');
      // const user = await Auth.getCurrentUser();
      // return user?.id || null;
      
      return 'current-user-id'; // Placeholder
    } catch (error) {
      console.log('❌ Error getting user ID:', error);
      return null;
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
          router.replace('/login/login-phone' as any);
          break;
          
        case 'pin-entry':
          console.log('🧭 Navigating to pin entry');
          router.replace('/login/login-pin' as any);
          break;
          
        default:
          console.log('🧭 Default: Navigating to onboarding');
          router.replace('/onboarding/welcome');
          break;
      }
      
    } catch (error) {
      console.log('❌ Error determining route:', error);
      router.replace('/onboarding/welcome');
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