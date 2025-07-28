import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function LoginPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState('');
  const [error, setError] = useState<{
    show: boolean;
    type: 'network' | 'validation' | 'auth' | 'server' | 'general';
    message?: string;
    title?: string;
  }>({
    show: false,
    type: 'general'
  });

  const inputRefs = [
    useRef<TextInput>(null), 
    useRef<TextInput>(null), 
    useRef<TextInput>(null), 
    useRef<TextInput>(null), 
    useRef<TextInput>(null), 
    useRef<TextInput>(null)
  ];

  // Load saved username and determine phone number to use
  useEffect(() => {
    initializeScreenData();
    // Auto-focus first input when screen loads
    inputRefs[0].current?.focus();
  }, [params.phoneNumber]);

  const initializeScreenData = async () => {
    console.log('🔄 Initializing PIN screen data...');
    
    // Prioritize passed phone number over saved one
    let phoneToUse = '';
    if (params.phoneNumber && typeof params.phoneNumber === 'string') {
      phoneToUse = params.phoneNumber;
      console.log('📱 Using phone number from params:', phoneToUse);
      setCurrentPhoneNumber(phoneToUse);
    } else {
      // Fall back to saved phone number
      const savedPhone = await authService.getSavedPhoneNumber();
      if (savedPhone) {
        phoneToUse = savedPhone;
        console.log('📱 Using saved phone number:', phoneToUse);
        setCurrentPhoneNumber(phoneToUse);
      } else {
        console.log('❌ No phone number found (passed or saved)');
        setCurrentPhoneNumber('');
      }
    }

    // Load username for display (independent of phone number)
    await loadSavedUsername();
  };

  const loadSavedUsername = async () => {
    console.log('👤 Loading saved username for PIN entry...');
    const username = await authService.getSavedUsername();
    if (username) {
      setSavedUsername(username);
      console.log('✅ Username loaded for PIN entry:', username);
    } else {
      console.log('❌ No saved username found, using default greeting');
      setSavedUsername(''); // Will show generic greeting
    }
  };

  // Check if PIN is complete
  const isPinComplete = pin.every(digit => digit !== '');

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    // Clear any existing errors when user starts typing
    if (error.show) {
      setError({ show: false, type: 'general' });
    }
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when PIN is complete
    if (index === 5 && value) {
      const completedPin = [...newPin];
      if (completedPin.every(digit => digit !== '')) {
        handleLogin(completedPin.join(''));
      }
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (pinCode: string) => {
    setIsLoading(true);
    setError({ show: false, type: 'general' }); // Clear any existing errors
    
    try {
      // Use the existing loginWithPin method (assumes it uses stored phone internally)
      const result = await authService.loginWithPin(pinCode);

      if (result.success) {
        console.log('✅ PIN login successful with phone:', currentPhoneNumber);
        router.push('/user/dashboard');
      } else {
        // Show appropriate error based on the result
        let errorType: 'network' | 'validation' | 'auth' | 'server' | 'general' = 'auth';
        let errorMessage = 'Incorrect PIN. Please try again.';
        let errorTitle = 'Invalid PIN';

        // Handle the actual error message from API
        if (result.error) {
          const serverMessage = result.error; // This is already a string from your API client
          const statusCode = result.status ?? 0; // ✅ Provide default value

          // Determine error type based on status code and message content
          if (statusCode === 404 || serverMessage.toLowerCase().includes('not found')) {
            errorType = 'auth';
            errorTitle = 'User Not Found';
            errorMessage = serverMessage;
          } else if (statusCode === 401 || serverMessage.toLowerCase().includes('invalid') || serverMessage.toLowerCase().includes('incorrect')) {
            errorType = 'auth';
            errorTitle = 'Invalid PIN';
            errorMessage = serverMessage;
          } else if (statusCode === 429 || serverMessage.toLowerCase().includes('locked') || serverMessage.toLowerCase().includes('too many')) {
            errorType = 'auth';
            errorTitle = 'Account Locked';
            errorMessage = serverMessage;
          } else if (statusCode >= 500) {
            errorType = 'server';
            errorTitle = 'Server Error';
            errorMessage = serverMessage;
          } else if (statusCode === 0) {
            errorType = 'network';
            errorTitle = 'Connection Error';
            errorMessage = serverMessage;
          } else {
            errorType = 'general';
            errorTitle = 'Error';
            errorMessage = serverMessage;
          }
        }

        setError({
          show: true,
          type: errorType,
          title: errorTitle,
          message: errorMessage
        });

        // Auto-dismiss error after 3 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general' });
        }, 3000);

        // Clear PIN on error
        setPin(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      // Handle network or unexpected errors
      setError({
        show: true,
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.'
      });

      // Auto-dismiss error after 3 seconds
      setTimeout(() => {
        setError({ show: false, type: 'general' });
      }, 3000);

      // Clear PIN on error
      setPin(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setError({ show: false, type: 'general' });
  };

  const handleForgotPin = () => {
    // TODO: Update this route to match your app structure
    // router.push({
    //   pathname: '/security/reset-pin',
    //   params: { phoneNumber: currentPhoneNumber }
    // });
    console.log('Forgot PIN pressed - implement reset PIN flow for phone:', currentPhoneNumber);
  };

  const handleBackToPhone = () => {
    console.log('🔄 User wants to change phone number, navigating to phone entry');
    router.replace('/login/login-phone');
  };

  const clearPin = () => {
    setPin(['', '', '', '', '', '']);
    setError({ show: false, type: 'general' }); // Clear errors when manually clearing PIN
    inputRefs[0].current?.focus();
  };

  // Format phone number for display with masking
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle Nigerian numbers (starting with 234 or local format)
    let formattedNumber = '';
    
    if (cleaned.startsWith('234')) {
      // International format: 234XXXXXXXXXX
      if (cleaned.length >= 13) {
        const countryCode = '+234';
        const firstTwo = cleaned.slice(3, 5); // First 2 digits after country code
        const lastTwo = cleaned.slice(-2); // Last 2 digits
        formattedNumber = `${countryCode}${firstTwo}******${lastTwo}`;
      } else {
        // Not enough digits, return as-is with + prefix
        formattedNumber = `+${cleaned}`;
      }
    } else if (cleaned.startsWith('0') && cleaned.length >= 11) {
      // Local Nigerian format: 0XXXXXXXXXX
      const withoutLeadingZero = cleaned.slice(1);
      const firstTwo = withoutLeadingZero.slice(0, 2);
      const lastTwo = withoutLeadingZero.slice(-2);
      formattedNumber = `+234${firstTwo}******${lastTwo}`;
    } else if (cleaned.length >= 10) {
      // Assume it's a Nigerian number without country code
      const firstTwo = cleaned.slice(0, 2);
      const lastTwo = cleaned.slice(-2);
      formattedNumber = `+234${firstTwo}******${lastTwo}`;
    } else {
      // Not enough digits, return as-is
      formattedNumber = phone;
    }
    
    return formattedNumber;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Error Display */}
      {error.show && (
        <ErrorDisplay
          type={error.type}
          title={error.title}
          message={error.message}
          onDismiss={handleDismissError}
          autoHide={true}
          duration={3000}
        />
      )}
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {savedUsername ? `Welcome back, ${savedUsername}!` : 'Welcome back!'}
            </Text>
            <Text style={styles.subtitle}>Enter your 6-digit PIN to continue</Text>
            {currentPhoneNumber && (
              <Text style={styles.phoneNumber}>
                {formatPhoneForDisplay(currentPhoneNumber)}
              </Text>
            )}
          </View>

          {/* PIN Input */}
          <View style={styles.pinSection}>
            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.pinInput,
                    digit && styles.pinInputFilled
                  ]}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry
                  textAlign="center"
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Verifying...</Text>
              </View>
            )}

            {/* Forgot PIN */}
            {!error.show && (
              <TouchableOpacity onPress={handleForgotPin} style={styles.forgotPinContainer}>
                <Text style={styles.forgotPinText}>Forgot your PIN?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {/* Clear PIN */}
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearPin}
              disabled={pin.every(digit => digit === '') || isLoading}
            >
              <Text style={[
                styles.clearButtonText,
                (pin.every(digit => digit === '') || isLoading) && styles.clearButtonTextDisabled
              ]}>
                Clear
              </Text>
            </TouchableOpacity>

            {/* Back to phone number */}
            <TouchableOpacity onPress={handleBackToPhone} disabled={isLoading}>
              <Text style={[
                styles.backToPhoneText,
                isLoading && styles.backToPhoneTextDisabled
              ]}>
                Wrong number? <Text style={styles.backToPhoneLink}>Change phone number</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Layout.spacing.xxl,
    marginBottom: Layout.spacing.xl,
    alignItems: 'center',
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
  },
  phoneNumber: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Layout.spacing.xs,
  },
  pinSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xl,
    justifyContent: 'center',
  },
  pinInput: {
    width: 50,
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    fontSize: 20,
    fontFamily: Typography.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  pinInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    marginBottom: Layout.spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.primary,
    textAlign: 'center',
  },
  forgotPinContainer: {
    marginTop: Layout.spacing.lg,
  },
  forgotPinText: {
    ...Typography.styles.body,
    color: Colors.primary,
    textAlign: 'center',
  },
  bottomActions: {
    paddingBottom: Layout.spacing.xl,
    gap: Layout.spacing.lg,
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
  },
  clearButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  clearButtonTextDisabled: {
    color: Colors.text.muted,
  },
  backToPhoneText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  backToPhoneTextDisabled: {
    opacity: 0.5,
  },
  backToPhoneLink: {
    color: Colors.primary,
    fontFamily: Typography.medium,
  },
});