import { useRouter } from 'expo-router';
import { useEffect, useState , useMemo} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { simpleAppState } from '../services/appstate';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Starting HomeScreen initialization');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Initializing app routing logic...');
    setIsLoading(true);
    
    try {
      console.log('🔍 Determining initial route');
      await determineInitialRoute();
      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ Error initializing app:', (error as Error).message);
      router.replace('/onboarding/welcome');
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
    }
  };

  const determineInitialRoute = async () => {
    console.log('🚀 Determining initial app route...');
    try {
      const screenType = await simpleAppState.getInitialScreen();
      console.log('📍 App state recommends screen:', screenType);
      
      switch (screenType) {
        case 'onboarding':
          router.replace('/onboarding/welcome');
          break;
        case 'phone-entry':
          router.replace('/login/login-phone');
          break;
        case 'pin-entry':
          router.replace('/login/login-pin');
          break;
        default:
          router.replace('/onboarding/welcome');
          break;
      }
    } catch (error) {
      console.error('❌ Error determining route:', (error as Error).message);
      router.replace('/onboarding/welcome');
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});