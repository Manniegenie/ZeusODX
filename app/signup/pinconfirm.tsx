import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Vibration, Alert } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { passwordPinService } from '../../services/passwordpinService';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function ConfirmPinScreen() {
  const router = useRouter();
  const { setupPin } = useLocalSearchParams(); // Removed pendingUserId - service will get it
  
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general'>('general');
  
  const PIN_LENGTH = 6;

  const clearError = () => {
    setError(null);
    setIsError(false);
  };

  const showError = (message: string, type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' = 'general') => {
    setError(message);
    setErrorType(type);
    setIsError(true);
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < PIN_LENGTH && !isLoading) {
      const newPin = pin + number;
      setPin(newPin);
      clearError();
    }
  };

  const handleBackspace = () => {
    if (!isLoading) {
      setPin(pin.slice(0, -1));
      clearError();
    }
  };

  const handleContinue = async () => {
    if (pin.length !== PIN_LENGTH) {
      Vibration.vibrate(100);
      return;
    }

    if (pin !== setupPin) {
      // PIN doesn't match - show validation error
      setPin('');
      showError('PINs do not match. Please try again.', 'auth');
      Vibration.vibrate([100, 50, 100]);
      return;
    }

    // PIN matches - create account using quickSetupPin (no pendingUserId needed)
    setIsLoading(true);
    clearError();

    try {
      console.log('🔐 Creating account with confirmed PIN...');
      
      // Use quickSetupPin - it automatically gets pendingUserId from storage
      const result = await passwordPinService.quickSetupPin(
        setupPin as string,
        pin
      );

      if (result.success) {
        console.log('✅ Pin created successfully');
        
        Alert.alert(
          'Pin Created!',
          'Your Pin has been created successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to dashboard or main app
                router.replace('/signup/username'); // Update this to your main app route
              }
            }
          ]
        );
      } else {
        // Handle error case - result.success is false, so error should exist
        const errorMessage = 'error' in result ? result.error : 'Failed to create account';
        console.log('❌ Account creation failed:', errorMessage);
        
        // Determine error type based on error message
        let type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' = 'general';
        if (errorMessage?.includes('match') || errorMessage?.includes('digits')) {
          type = 'validation';
          setPin(''); // Clear PIN for validation errors
        } else if (errorMessage?.includes('verified') || errorMessage?.includes('OTP')) {
          type = 'auth';
        } else if (errorMessage?.includes('server') || errorMessage?.includes('Server')) {
          type = 'server';
        } else if (errorMessage?.includes('network') || errorMessage?.includes('connection')) {
          type = 'network';
        } else if (errorMessage?.includes('not found')) {
          type = 'notFound';
        }
        
        showError(errorMessage || 'Failed to create account', type);
      }
    } catch (err: any) {
      console.log('❌ Unexpected error:', err);
      showError('An unexpected error occurred. Please try again.', 'server');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length && styles.filledDot,
            isError && styles.errorDot
          ]}
        />
      );
    }
    return dots;
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫']
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((number, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.numberButton,
              number === '' && styles.emptyButton
            ]}
            onPress={() => {
              if (number === '⌫') {
                handleBackspace();
              } else if (number !== '') {
                handleNumberPress(number);
              }
            }}
            disabled={number === '' || isLoading}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.numberText,
              number === '⌫' && styles.backspaceText
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          type={errorType}
          message={error}
          onDismiss={clearError}
          autoHide={true}
          duration={3000}
        />
      )}
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Confirm your PIN</Text>
          <Text style={styles.subtitle}>Please confirm your security PIN</Text>
        </View>

        {/* PIN Display */}
        <View style={styles.pinContainer}>
          <View style={styles.pinDots}>
            {renderPinDots()}
          </View>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {renderNumberPad()}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              pin.length === PIN_LENGTH && !isLoading ? styles.activeButton : styles.inactiveButton
            ]} 
            onPress={handleContinue}
            disabled={pin.length !== PIN_LENGTH || isLoading}
          >
            <Text style={[
              styles.continueButtonText,
              pin.length === PIN_LENGTH && !isLoading ? styles.activeButtonText : styles.inactiveButtonText
            ]}>
              {isLoading ? 'Creating Account...' : 'Continue'}
            </Text>
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
  header: {
    paddingTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.xxl,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.xs,
  },
  backText: {
    ...Typography.styles.body,
    color: Colors.primary,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xxl,
  },
  pinDots: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  filledDot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  errorDot: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.xl,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyButton: {
    borderColor: 'transparent',
  },
  numberText: {
    fontSize: 24,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
  },
  backspaceText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  continueButton: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  inactiveButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  continueButtonText: {
    ...Typography.styles.bodyMedium,
  },
  activeButtonText: {
    color: Colors.surface,
  },
  inactiveButtonText: {
    color: Colors.text.secondary,
  },
});