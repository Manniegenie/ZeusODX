import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useRouter } from 'expo-router';

interface SwapSuccessfulScreenProps {
  fromAmount: string;
  fromToken: string;
  toToken: string;
  visible?: boolean;
  onContinue?: () => void; // Added to allow parent to close modal
}

export default function SwapSuccessfulScreen({ 
  fromAmount, 
  fromToken, 
  toToken, 
  visible = true,
  onContinue
}: SwapSuccessfulScreenProps) {
  const router = useRouter();

  const handleContinue = () => {
    if (onContinue) onContinue(); // Close modal in parent
    setTimeout(() => {
      router.push('/user/wallet'); // Navigate after modal closes
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../components/icons/check-check.png')}
                style={styles.checkmarkIcon}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Swap successful</Text>
            <Text style={styles.subtitle}>
              You have successfully swapped {fromAmount}{fromToken}{'\n'}to {toToken}.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
  checkmarkIcon: {
    width: 120,
    height: 120,
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
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  continueButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.surface,
    fontWeight: '600',
  },
});
