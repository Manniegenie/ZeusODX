import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useSignup } from '../../hooks/useSignup';

export default function SignupScreen() {
  const router = useRouter();
  const { isLoading, addUser } = useSignup();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<{
    show: boolean;
    type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general';
    message: string;
    title: string;
  }>({
    show: false,
    type: 'general',
    message: '',
    title: ''
  });

  // Fixed to Nigeria only
  const countryCode = '+234';
  const countryFlag = '🇳🇬';

  // Check if all required fields are filled
  const isFormValid = 
    firstName.trim().length > 0 && 
    lastName.trim().length > 0 && 
    email.trim().length > 0 &&
    phoneNumber.trim().length >= 10;

  const handleContinue = async () => {
    if (!isFormValid) return;

    // Clear any existing errors
    setError({ show: false, type: 'general', message: '', title: '' });

    // Prepare phone number with country code
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      const result = await addUser({
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        email: email.trim().toLowerCase(),
        phonenumber: fullPhoneNumber
      });

      if (result.success) {
        // Navigate to OTP verification screen
        router.push({
          pathname: '/signup/verifyphone',
          params: {
            phonenumber: fullPhoneNumber,
            email: email.trim().toLowerCase()
          }
        });
      } else {
        // Show error message
        let errorType: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' = 'general';
        let errorTitle = 'Signup Failed';
        let errorMessage = result.error || 'Unable to create account. Please try again.';

        // Handle specific error types
        if (result.error?.includes('already exists') || result.error?.includes('already Exists')) {
          errorType = 'validation';
          errorTitle = 'Account Exists';
          errorMessage = result.error;
        } else if (result.error?.includes('Invalid email')) {
          errorType = 'validation';
          errorTitle = 'Invalid Email';
          errorMessage = result.error;
        } else if (result.error?.includes('Invalid phone')) {
          errorType = 'validation';
          errorTitle = 'Invalid Phone Number';
          errorMessage = result.error;
        } else if (result.error?.includes('Network') || result.error?.includes('connection')) {
          errorType = 'network';
          errorTitle = 'Connection Error';
          errorMessage = result.error;
        }

        setError({
          show: true,
          type: errorType,
          title: errorTitle,
          message: errorMessage
        });

        // Auto-dismiss error after 4 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general', message: '', title: '' });
        }, 4000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError({
        show: true,
        type: 'general' as const,
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.'
      });

      // Auto-dismiss error after 4 seconds
      setTimeout(() => {
        setError({ show: false, type: 'general', message: '', title: '' });
      }, 4000);
    }
  };

  const handleLogin = () => {
    router.push('/login/login-phone');
  };

  const handleDismissError = () => {
    setError({ show: false, type: 'general', message: '', title: '' });
  };

  const handleInputChange = (setter: (value: string) => void) => (value: string) => {
    // Clear error when user starts typing
    if (error.show) {
      setError({ show: false, type: 'general', message: '', title: '' });
    }
    setter(value);
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
          duration={4000}
        />
      )}

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Complete Your Sign-Up</Text>
              <Text style={styles.subtitle}>Kindly enter your details to setup your account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter First name"
                  placeholderTextColor={Colors.text.muted}
                  value={firstName}
                  onChangeText={handleInputChange(setFirstName)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Last name"
                  placeholderTextColor={Colors.text.muted}
                  value={lastName}
                  onChangeText={handleInputChange(setLastName)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.text.muted}
                  value={email}
                  onChangeText={handleInputChange(setEmail)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCodeDisplay}>
                    <Text style={styles.flagText}>{countryFlag}</Text>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </View>
                  
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.text.muted}
                    value={phoneNumber}
                    onChangeText={handleInputChange(setPhoneNumber)}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>

            {/* Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  (isFormValid && !isLoading) ? styles.activeButton : styles.inactiveButton
                ]} 
                onPress={handleContinue}
                disabled={!isFormValid || isLoading}
              >
                <Text style={[
                  styles.continueButtonText,
                  (isFormValid && !isLoading) ? styles.activeButtonText : styles.inactiveButtonText
                ]}>
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </Text>
              </TouchableOpacity>
              
              {/* Login Link */}
              <View style={styles.loginContainer}>
                <TouchableOpacity 
                  onPress={handleLogin} 
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.loginText,
                    isLoading && styles.loginTextDisabled
                  ]}>
                    I already have an account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStartedBorder = {
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: Layout.borderRadius.lg,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  form: {
    flex: 1,
    gap: Layout.spacing.lg,
  },
  inputContainer: {
    gap: Layout.spacing.xs,
  },
  label: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
  },
  input: {
    ...getStartedBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.primary,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    alignItems: 'center',
  },
  countryCodeDisplay: {
    ...getStartedBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    minWidth: 100,
  },
  flagText: {
    fontSize: 16,
  },
  countryCodeText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.primary,
  },
  phoneInput: {
    ...getStartedBorder,
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.primary,
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
  loginContainer: {
    alignItems: 'center', // Changed from 'flex-end' to 'center'
    marginTop: Layout.spacing.md,
  },
  loginText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  loginTextDisabled: {
    opacity: 0.5,
  },
});