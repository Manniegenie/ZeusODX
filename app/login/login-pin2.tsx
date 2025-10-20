// app/login/simple-pin.tsx
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

export default function SimpleLoginPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  const bioTriedRef = useRef(false);
  const [biometricFailed, setBiometricFailed] = useState(false);

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
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

  // Init + autofocus
  useEffect(() => {
    initializeScreen();
    inputRefs[0].current?.focus();
  }, [params.phonenumber]);

  // Try biometrics once per screen load if available
  useEffect(() => {
    const tryBiometric = async () => {
      if (bioTriedRef.current || biometricFailed) return;

      try {
        // Check if device supports biometrics
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
          console.log('Biometric hardware not available or not enrolled');
          return;
        }

        // Check if we have a stored PIN for biometric
        const hasBiometricPin = await authService.hasBiometricPin();
        if (!hasBiometricPin) {
          console.log('No biometric PIN stored, skipping biometric auth');
          return;
        }

        bioTriedRef.current = true;
        setIsLoading(true);

        // Prompt for biometric authentication
        const bioResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to login',
          disableDeviceFallback: false,
          cancelLabel: 'Use PIN',
        });

        if (bioResult.success) {
          console.log('Biometric verification successful, authenticating with server...');
          
          // Actually authenticate with the server using stored PIN
          const loginResult = await authService.loginWithBiometric();
          
          if (loginResult.success) {
            console.log('Server authentication successful');
            router.push('/user/dashboard');
          } else {
            console.log('Server authentication failed:', loginResult.error);
            setBiometricFailed(true);
            setError({
              show: true,
              type: 'auth',
              title: 'Authentication Failed',
              message: 'Please enter your PIN to continue.',
            });
            setTimeout(() => setError({ show: false, type: 'general' }), 3000);
          }
        } else {
          console.log('Biometric verification cancelled or failed');
          setBiometricFailed(true);
        }
      } catch (err) {
        console.error('Biometric authentication error:', err);
        setBiometricFailed(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    tryBiometric();
  }, [biometricFailed, router]);

  const initializeScreen = async () => {
    if (params.phonenumber && typeof params.phonenumber === 'string') {
      setPhoneNumber(params.phonenumber);
      await authService.savePhoneNumber(params.phonenumber);
    } else {
      setError({
        show: true,
        type: 'validation',
        title: 'Missing Phone Number',
        message: 'Please go back and enter your phone number first.'
      });
    }
  };

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return;

    if (error.show) {
      setError({ show: false, type: 'general' });
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

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
    setError({ show: false, type: 'general' });

    try {
      // Use useAuth login hook which calls authService.login
      const result = await login({
        phonenumber: phoneNumber,
        passwordpin: pinCode,
      });

      if (result.success) {
        console.log('PIN login successful');
        router.push('/user/dashboard');
      } else {
        let errorType: 'network' | 'validation' | 'auth' | 'server' | 'general' = 'auth';
        let errorMessage = 'Incorrect PIN. Please try again.';
        let errorTitle = 'Invalid PIN';

        if (result.error) {
          const serverMessage = String(result.error);

          if (serverMessage.toLowerCase().includes('not found')) {
            errorType = 'auth';
            errorTitle = 'User Not Found';
            errorMessage = serverMessage;
          } else if (
            serverMessage.toLowerCase().includes('invalid') ||
            serverMessage.toLowerCase().includes('incorrect')
          ) {
            errorType = 'auth';
            errorTitle = 'Invalid PIN';
            errorMessage = serverMessage;
          } else if (
            serverMessage.toLowerCase().includes('locked') ||
            serverMessage.toLowerCase().includes('too many')
          ) {
            errorType = 'auth';
            errorTitle = 'Account Locked';
            errorMessage = serverMessage;
          } else if (serverMessage.toLowerCase().includes('server')) {
            errorType = 'server';
            errorTitle = 'Server Error';
            errorMessage = serverMessage;
          } else if (serverMessage.toLowerCase().includes('network') || serverMessage.toLowerCase().includes('connection')) {
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

        setTimeout(() => setError({ show: false, type: 'general' }), 3000);
        setPin(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError({
        show: true,
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.'
      });

      setTimeout(() => setError({ show: false, type: 'general' }), 3000);
      setPin(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => setError({ show: false, type: 'general' });

  const handleForgotPin = () => {
    try {
      router.push({
        pathname: '/login/ForgotPinScreen',
        params: { phonenumber: phoneNumber || '' },
      });
      console.log('Navigating to ForgotPinScreen with phone:', phoneNumber);
    } catch (err) {
      console.warn('Failed to navigate to ForgotPinScreen', err);
      router.push(`/login/ForgotPinScreen?phonenumber=${encodeURIComponent(phoneNumber || '')}`);
    }
  };

  const handleBackToPhone = () => {
    router.replace('/login/login-phone');
  };

  const clearPin = () => {
    setPin(['', '', '', '', '', '']);
    setError({ show: false, type: 'general' });
    inputRefs[0].current?.focus();
  };

  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter your PIN</Text>
            {phoneNumber ? (
              <Text style={styles.subtitle}>
                for <Text style={styles.phoneNumber}>{formatPhoneForDisplay(phoneNumber)}</Text>
              </Text>
            ) : (
              <Text style={styles.subtitle}>Enter your 6-digit PIN to continue</Text>
            )}
          </View>

          <View style={styles.pinSection}>
            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[styles.pinInput, digit && styles.pinInputFilled]}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry
                  textAlign="center"
                  selectTextOnFocus
                  editable={!isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Verifying...</Text>
              </View>
            )}

            {!error.show && (
              <TouchableOpacity onPress={handleForgotPin} style={styles.forgotPinContainer}>
                <Text style={styles.forgotPinText}>Forgot your PIN?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearPin}
              disabled={pin.every(digit => digit === '') || isLoading}
            >
              <Text
                style={[
                  styles.clearButtonText,
                  (pin.every(digit => digit === '') || isLoading) && styles.clearButtonTextDisabled
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBackToPhone} disabled={isLoading}>
              <Text style={[styles.backToPhoneText, isLoading && styles.backToPhoneTextDisabled]}>
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
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Layout.spacing.lg, justifyContent: 'space-between' },
  header: { paddingTop: Layout.spacing.xxl, marginBottom: Layout.spacing.xl, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center' },
  phoneNumber: { color: Colors.primary, fontFamily: Typography.medium },
  pinSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinContainer: { flexDirection: 'row', gap: Layout.spacing.sm, marginBottom: Layout.spacing.xl, justifyContent: 'center' },
  pinInput: {
    width: 50, height: 50, backgroundColor: Colors.surface, borderRadius: Layout.borderRadius.md,
    borderWidth: 2, borderColor: '#E5E5E5', fontSize: 20, fontFamily: Typography.bold, color: Colors.text.primary, textAlign: 'center',
  },
  pinInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  loadingContainer: { marginBottom: Layout.spacing.lg },
  loadingText: { ...Typography.styles.body, color: Colors.primary, textAlign: 'center' },
  forgotPinContainer: { marginTop: Layout.spacing.lg },
  forgotPinText: { ...Typography.styles.body, color: Colors.primary, textAlign: 'center' },
  bottomActions: { paddingBottom: Layout.spacing.xl, gap: Layout.spacing.lg, alignItems: 'center' },
  clearButton: { paddingVertical: Layout.spacing.sm, paddingHorizontal: Layout.spacing.lg },
  clearButtonText: { ...Typography.styles.bodyMedium, color: Colors.text.secondary, textAlign: 'center' },
  clearButtonTextDisabled: { color: Colors.text.muted },
  backToPhoneText: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center' },
  backToPhoneTextDisabled: { opacity: 0.5 },
  backToPhoneLink: { color: Colors.primary, fontFamily: Typography.medium },
});