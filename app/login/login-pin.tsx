// app/login/LoginPinScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import ErrorDisplay from '../../components/ErrorDisplay';
import * as LocalAuthentication from 'expo-local-authentication';

// Import mascot image
import mascot from '../../components/icons/face-id.png';

export default function LoginPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  const bioTriedRef = useRef(false);
  const [biometricFailed, setBiometricFailed] = useState(false);

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
    type: 'general',
  });

  const inputRefs = [
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
  ];

  // Load saved username and determine phone number to use
  useEffect(() => {
    initializeScreenData();
    // Auto-focus first input when screen loads (delay slightly to allow render)
    const t = setTimeout(() => inputRefs[0].current?.focus(), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.phoneNumber]);

  // Manual biometric trigger when user taps the icon
  const handleBiometricAuth = async () => {
    if (isLoading) return; // Don't trigger if already loading

    try {
      // Check if device supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        // Silently do nothing if biometric not available
        return;
      }

      // Check if we have a stored PIN for biometric
      const hasBiometricPin = await authService.hasBiometricPin();
      if (!hasBiometricPin) {
        // Silently do nothing if no PIN stored
        return;
      }

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
          setError({
            show: true,
            type: 'auth',
            title: 'Authentication Failed',
            message: 'Please enter your PIN to continue.',
          });
          setTimeout(() => setError({ show: false, type: 'general' }), 3000);
        }
      }
    } catch (err) {
      console.error('Biometric authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const initializeScreenData = async () => {
    console.log('Initializing PIN screen data...');

    // Prefer phone passed via params over saved one
    let phoneToUse = '';
    const passed = params?.phoneNumber;
    if (passed && typeof passed === 'string' && passed.trim().length > 0) {
      phoneToUse = passed;
      console.log('Using phone number from params:', maskPhoneForLogs(phoneToUse));
      setCurrentPhoneNumber(phoneToUse);
    } else {
      // Fall back to saved phone number from authService
      try {
        const savedPhone = await authService.getSavedPhoneNumber();
        if (savedPhone) {
          phoneToUse = savedPhone;
          console.log('Using saved phone number:', maskPhoneForLogs(phoneToUse));
          setCurrentPhoneNumber(phoneToUse);
        } else {
          console.log('No phone number found (passed or saved)');
          setCurrentPhoneNumber('');
        }
      } catch (err) {
        console.warn('Failed to load saved phone number', err);
        setCurrentPhoneNumber('');
      }
    }

    // Load username for display (independent of phone number)
    await loadSavedUsername();
  };

  const loadSavedUsername = async () => {
    console.log('Loading saved username for PIN entry...');
    try {
      const username = await authService.getSavedUsername();
      if (username) {
        setSavedUsername(username);
        console.log('Username loaded for PIN entry:', username);
      } else {
        console.log('No saved username found, using default greeting');
        setSavedUsername(''); // Will show generic greeting
      }
    } catch (err) {
      console.warn('Failed to load saved username', err);
      setSavedUsername('');
    }
  };

  // Small helper to mask phone for logs
  const maskPhoneForLogs = (phone: string) =>
    phone.replace(/\d(?=\d{4})/g, '*');

  // Check if PIN is complete
  const isPinComplete = pin.every((digit) => digit !== '');

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
      if (completedPin.every((digit) => digit !== '')) {
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
      // Use useAuth login hook which calls authService.login
      const result = await login({
        phonenumber: currentPhoneNumber,
        passwordpin: pinCode,
      });

      if (result.success) {
        console.log('PIN login successful');
        router.push('/user/dashboard');
      } else {
        // Show appropriate error based on the result
        let errorType: 'network' | 'validation' | 'auth' | 'server' | 'general' = 'auth';
        let errorMessage = 'Incorrect PIN. Please try again.';
        let errorTitle = 'Invalid PIN';

        // Handle the actual error message from API
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
          message: errorMessage,
        });

        // Auto-dismiss error after 3 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general' });
        }, 3000);

        // Clear PIN on error and focus
        setPin(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      // Handle network or unexpected errors
      setError({
        show: true,
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
      });

      // Auto-dismiss error after 3 seconds
      setTimeout(() => {
        setError({ show: false, type: 'general' });
      }, 3000);

      // Clear PIN on error and focus
      setPin(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setError({ show: false, type: 'general' });
  };

  // Navigate to ForgotPinScreen and pass currentPhoneNumber param
  const handleForgotPin = () => {
    try {
      router.push({
        pathname: '/login/ForgotPinScreen',
        params: { phoneNumber: currentPhoneNumber || '' },
      });
      console.log('Navigating to ForgotPinScreen with phone:', maskPhoneForLogs(currentPhoneNumber));
    } catch (err) {
      console.warn('Failed to navigate to ForgotPinScreen', err);
      // fallback to query-string style route
      router.push(`/login/ForgotPinScreen?phoneNumber=${encodeURIComponent(currentPhoneNumber || '')}`);
    }
  };

  const handleBackToPhone = () => {
    console.log('User wants to change phone number, navigating to phone entry');
    router.replace('/login/login-phone');
  };

  const clearPin = () => {
    setPin(['', '', '', '', '', '']);
    setError({ show: false, type: 'general' }); // Clear errors when manually clearing PIN
    inputRefs[0].current?.focus();
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

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {/* TITLE: Welcome back message */}
            <Text style={styles.title}>
              {savedUsername ? `Welcome back, ${savedUsername}` : 'Welcome back'}
            </Text>
            
            {/* Mascot Icon - Tappable for biometric */}
            <TouchableOpacity 
              style={styles.mascotContainer}
              onPress={handleBiometricAuth}
              activeOpacity={0.7}
            >
              <Image source={mascot} style={styles.mascotImage} />
            </TouchableOpacity>
            
            {/* SUBTITLE: PIN instruction */}
            <Text style={styles.subtitle}>Enter your pin</Text>
          </View>

          {/* PIN Input */}
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
            <TouchableOpacity style={styles.clearButton} onPress={clearPin} disabled={pin.every((digit) => digit === '') || isLoading}>
              <Text style={[styles.clearButtonText, (pin.every((digit) => digit === '') || isLoading) && styles.clearButtonTextDisabled]}>
                Clear
              </Text>
            </TouchableOpacity>

            {/* Back to phone number */}
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
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  
  // Face ID Icon Styles
  mascotContainer: { 
    marginBottom: Layout.spacing.md 
  },
  mascotImage: {
    width: 50,
    height: 50,
  },
  
  subtitle: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.primaryText,
    textAlign: 'center',
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