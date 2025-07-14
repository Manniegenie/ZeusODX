import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import BottomTabNavigator from '../../components/BottomNavigator';

export default function ComingSoonScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNotifyMe = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Simulate API call
    setIsSubscribed(true);
    Alert.alert(
      'Success!', 
      'You\'ll be notified when this feature is available!',
      [{ text: 'OK', onPress: () => setEmail('') }]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coming Soon</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.mainIcon}>🚀</Text>
            </View>
            <View style={styles.floatingElements}>
              <View style={[styles.floatingDot, styles.dot1]} />
              <View style={[styles.floatingDot, styles.dot2]} />
              <View style={[styles.floatingDot, styles.dot3]} />
              <Text style={[styles.floatingEmoji, styles.emoji1]}>✨</Text>
              <Text style={[styles.floatingEmoji, styles.emoji2]}>⭐</Text>
              <Text style={[styles.floatingEmoji, styles.emoji3]}>💫</Text>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.mainTitle}>Something Amazing is Coming!</Text>
            <Text style={styles.subtitle}>
              We're working hard to bring you an incredible new feature. 
              Stay tuned for updates!
            </Text>
          </View>

          {/* Email Notification Section */}
          <View style={styles.notificationSection}>
            <Text style={styles.notificationTitle}>Get Notified</Text>
            <Text style={styles.notificationSubtitle}>
              Be the first to know when we launch
            </Text>
            
            {!isSubscribed ? (
              <View style={styles.emailContainer}>
                <TextInput
                  style={styles.emailInput}
                  placeholder="Enter your email address"
                  placeholderTextColor={Colors.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.notifyButton} 
                  onPress={handleNotifyMe}
                  activeOpacity={0.8}
                >
                  <Text style={styles.notifyButtonText}>Notify Me</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.subscribedContainer}>
                <View style={styles.checkIconContainer}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.subscribedText}>
                  You're all set! We'll notify you when it's ready.
                </Text>
              </View>
            )}
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What to Expect</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>⚡</Text>
                </View>
                <Text style={styles.featureText}>Lightning fast performance</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>🔒</Text>
                </View>
                <Text style={styles.featureText}>Enhanced security features</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>🎨</Text>
                </View>
                <Text style={styles.featureText}>Beautiful new interface</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Tab Navigator */}
      <BottomTabNavigator activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.text.primary,
    fontFamily: Typography.medium,
  },
  headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    position: 'relative',
    height: 200,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4A3FAD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3FAD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainIcon: {
    fontSize: 48,
    color: Colors.surface,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A3FAD',
    opacity: 0.3,
  },
  dot1: {
    top: 30,
    left: 50,
  },
  dot2: {
    top: 80,
    right: 40,
  },
  dot3: {
    bottom: 50,
    left: 30,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.6,
  },
  emoji1: {
    top: 20,
    right: 30,
  },
  emoji2: {
    top: 120,
    left: 20,
  },
  emoji3: {
    bottom: 30,
    right: 50,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  mainTitle: {
    fontFamily: Typography.bold,
    fontSize: 28,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Layout.spacing.md,
  },
  notificationSection: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  notificationSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  emailContainer: {
    gap: Layout.spacing.md,
  },
  emailInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: 16,
    fontFamily: Typography.regular,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notifyButton: {
    backgroundColor: '#4A3FAD',
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3FAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  notifyButtonText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: Colors.surface,
  },
  subscribedContainer: {
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  checkIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 24,
    color: Colors.surface,
    fontFamily: Typography.bold,
  },
  subscribedText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
  },
  featuresTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  featuresList: {
    gap: Layout.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
});