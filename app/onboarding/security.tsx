import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';
import { simpleAppState } from '../../services/appstate';

export default function SecurityScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    console.log('🎓 User completing onboarding via Get Started');
    
    // Mark onboarding as completed
    await simpleAppState.markOnboardingCompleted();
    
    // Navigate to signup
    router.push('/signup/signupI');
  };

  const handleLogin = async () => {
    console.log('🎓 User completing onboarding via Login');
    
    // Mark onboarding as completed
    await simpleAppState.markOnboardingCompleted();
    
    // Navigate to login
    router.push('/login/login-phone');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Custom Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={require('../../assets/images/security.png')} // Replace with your icon filename
              style={styles.customIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Secure & Protected</Text>
          <Text style={styles.subtitle}>Your funds are protected by{'\n'}ZeusODX.</Text>
          
          {/* Page Navigation Dots */}
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleGetStarted}>
            <Text style={styles.nextButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleLogin}>
            <Text style={styles.skipButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xxl,
  },
  iconContainer: {
    marginBottom: Layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIcon: {
    width: 120, // Same as other screens
    height: 120, // Same as other screens
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.surface,
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  skipButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
  },
});