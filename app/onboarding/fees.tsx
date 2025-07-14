import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';

export default function FeesScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/security');
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Custom Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={require('../../assets/images/exchange.png')} // Replace with your icon filename
              style={styles.customIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>No Hidden Fees. Ever.</Text>
          <Text style={styles.subtitle}>Clear rates. Zero hidden fees.{'\n'}The way it should be.</Text>
          
          {/* Page Navigation Dots */}
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
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
    width: 120, // Adjust size as needed
    height: 120, // Adjust size as needed
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