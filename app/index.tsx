import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { simpleAppState } from '../services/appstate';

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    determineInitialRoute();
  }, []);

  const determineInitialRoute = async () => {
    console.log('🚀 Determining initial app route...');
    setIsLoading(true);
    
    try {
      // Get the initial screen recommendation from app state service
      const screenType = await simpleAppState.getInitialScreen();
      console.log('📍 App state recommends screen:', screenType);
      
      // Navigate based on screen type
      switch (screenType) {
        case 'onboarding':
          console.log('🧭 Navigating to onboarding');
          router.replace('/onboarding/welcome');
          break;
          
        case 'phone-entry':
          console.log('🧭 Navigating to phone entry');
          // 📝 Replace with your actual phone entry route
          router.replace('/login/login-phone' as any);
          break;
          
        case 'pin-entry':
          console.log('🧭 Navigating to pin entry');
          // 📝 Replace with your actual pin entry route
          router.replace('/login/login-pin' as any);
          break;
          
        default:
          console.log('🧭 Default: Navigating to onboarding');
          router.replace('/onboarding/welcome');
          break;
      }
      
    } catch (error) {
      console.log('❌ Error determining route:', error);
      // Default to onboarding on error
      router.replace('/onboarding/welcome');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Loading state while determining route */}
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