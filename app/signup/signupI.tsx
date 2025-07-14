import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSignup } from '../../hooks/useSignup';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function SignupScreen() {
  const router = useRouter();
  const { isLoading, addUser } = useSignup();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [selectedFlag, setSelectedFlag] = useState('🇳🇬');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
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

  const countryCodeOptions = [
    { code: '+234', country: '🇳🇬', name: 'Nigeria' },
    { code: '+27', country: '🇿🇦', name: 'South Africa' },
    { code: '+233', country: '🇬🇭', name: 'Ghana' },
    { code: '+254', country: '🇰🇪', name: 'Kenya' },
    { code: '+20', country: '🇪🇬', name: 'Egypt' },
    { code: '+212', country: '🇲🇦', name: 'Morocco' },
    { code: '+216', country: '🇹🇳', name: 'Tunisia' },
    { code: '+213', country: '🇩🇿', name: 'Algeria' },
    { code: '+251', country: '🇪🇹', name: 'Ethiopia' },
    { code: '+256', country: '🇺🇬', name: 'Uganda' },
    { code: '+255', country: '🇹🇿', name: 'Tanzania' },
  ];

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

  const selectCountryCode = (option: { code: string; country: string; name: string }) => {
    setCountryCode(option.code);
    setSelectedFlag(option.country);
    setShowCountryCodeDropdown(false);
  };

  const closeDropdown = () => {
    setShowCountryCodeDropdown(false);
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
          <Pressable style={styles.content} onPress={closeDropdown}>
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
                  <View style={styles.countryCodeContainer}>
                    <TouchableOpacity 
                      style={styles.countryCodeButton}
                      onPress={() => !isLoading && setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                      disabled={isLoading}
                    >
                      <Text style={styles.flagText}>{selectedFlag}</Text>
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                      <Text style={styles.countryCodeArrow}>▼</Text>
                    </TouchableOpacity>
                    
                    {showCountryCodeDropdown && !isLoading && (
                      <View style={styles.countryCodeDropdown}>
                        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                          {countryCodeOptions.map((option, index) => (
                            <TouchableOpacity
                              key={`${option.code}-${index}`}
                              style={[styles.dropdownOption, index === countryCodeOptions.length - 1 && styles.lastDropdownOption]}
                              onPress={() => selectCountryCode(option)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.flagEmoji}>{option.country}</Text>
                              <Text style={styles.dropdownOptionText}>{option.name} ({option.code})</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.text.muted}
                    value={phoneNumber}
                    onChangeText={handleInputChange(setPhoneNumber)}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    onFocus={closeDropdown}
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
          </Pressable>
        </ScrollView>
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
    position: 'relative',
  },
  label: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.primary,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    alignItems: 'flex-start',
  },
  countryCodeContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  countryCodeButton: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
  countryCodeArrow: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.primary,
  },
  countryCodeDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2000,
    maxHeight: 180,
    width: 200,
  },
  dropdownScrollView: {
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontFamily: Typography.regular,
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: Layout.spacing.xs,
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
    alignItems: 'flex-end',
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