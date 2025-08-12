import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useRouter } from 'expo-router';

interface UtilityPurchaseSuccessModalProps {
  utilityType: string; // "Airtime", "Data", "Cable TV", etc.
  amount: string; // "₦500", "1GB", etc.
  phoneNumber: string; // "08012345678"
  network: string; // "MTN", "Glo", etc.
  visible?: boolean;
  onContinue?: () => void;
  additionalInfo?: string; // Optional extra info like data validity
}

export default function UtilityPurchaseSuccessModal({ 
  utilityType,
  amount,
  phoneNumber,
  network,
  visible = true,
  onContinue,
  additionalInfo
}: UtilityPurchaseSuccessModalProps) {
  const router = useRouter();

  const handleContinue = () => {
    if (onContinue) onContinue(); // Close modal in parent
    setTimeout(() => {
      router.push('/user/utility'); // Navigate after modal closes
    }, 150);
  };

  const handleOverlayPress = () => {
    // Optional: Allow closing modal by tapping overlay
    // if (onContinue) onContinue();
  };

  // Format the success message based on utility type
  const getSuccessMessage = () => {
    const baseMessage = `You have successfully purchased ${amount} ${utilityType.toLowerCase()} for ${phoneNumber} on ${network}.`;
    
    if (additionalInfo) {
      return `${baseMessage}\n\n${additionalInfo}`;
    }
    
    return baseMessage;
  };

  const getTitle = () => {
    return `${utilityType} Purchase Successful`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayBackground} 
          activeOpacity={1}
          onPress={handleOverlayPress}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../components/icons/check-check.png')}
                  style={styles.checkmarkIcon}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>
                {getSuccessMessage()}
              </Text>

              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: Colors.background || '#FFFFFF',
    borderRadius: Layout.borderRadius.xl || 16,
    paddingHorizontal: Layout.spacing.xl || 24,
    paddingVertical: Layout.spacing.xxl || 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: Layout.spacing.lg || 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    width: 80,
    height: 80,
  },
  title: {
    fontFamily: Typography.bold || 'System',
    fontSize: 22,
    lineHeight: 26,
    color: Colors.primaryText || Colors.text?.primary || '#111827',
    textAlign: 'center',
    marginBottom: Layout.spacing.sm || 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text?.secondary || '#6B7280',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl || 24,
    fontFamily: Typography.regular || 'System',
    fontWeight: '400',
  },
  continueButton: {
    backgroundColor: Colors.primary || '#35297F',
    paddingVertical: Layout.spacing.md || 16,
    paddingHorizontal: Layout.spacing.xl || 24,
    borderRadius: Layout.borderRadius.lg || 8,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface || '#FFFFFF',
    fontFamily: Typography.medium || 'System',
  },
});