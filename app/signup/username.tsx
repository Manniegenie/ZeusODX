import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';
import { usernameService } from '../../services/UsernameService';
import ErrorDisplay from '../../components/ErrorDisplay';

const UsernameScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<boolean | null>(null);

  const [error, setError] = useState<{type: string, title: string, message: string} | null>(null);
  const [availabilityErrors, setAvailabilityErrors] = useState<string[]>([]);

  // Get validation state
  const formatValidation = usernameService.validateFormat(username);
  const requirements = usernameService.checkRequirements(username);
  const rules = usernameService.validationRules.rules;

  // Check availability when format is valid
  useEffect(() => {
    const trimmed = username.trim();
    const validation = usernameService.validateFormat(trimmed);
    
    console.log('useEffect triggered:', { trimmed, isValid: validation.isValid });
    
    // Clear all states if username is empty or invalid
    if (!trimmed || !validation.isValid) {
      console.log('Clearing availability - empty or invalid');
      setAvailabilityResult(null);
      setAvailabilityErrors([]);
      setError(null);
      return;
    }

    console.log('Starting availability check for:', trimmed);

    // Debounce availability check
    const timeoutId = setTimeout(async () => {
      console.log('Debounce timeout - checking availability');
      setIsCheckingAvailability(true);
      setError(null); // Clear any previous errors
      
      const result = await usernameService.checkAvailability(trimmed);
      console.log('Availability check result:', result);
      
      if (result.success) {
        console.log('Setting availability to:', result.isAvailable);
        setAvailabilityResult(result.isAvailable);
        setAvailabilityErrors(result.errors || []);
        
        // Show error if username is not available and has specific errors
        if (result.isAvailable === false && result.errors && result.errors.length > 0) {
          setError({
            type: 'validation',
            title: 'Username Not Available',
            message: result.errors[0] // Show first error
          });
        }
      } else {
        console.log('Availability check failed:', result.error);
        setAvailabilityResult(false); // ✅ Treat failed checks as unavailable
        setAvailabilityErrors(['Username unavailable']);
        setError({
          type: 'network',
          title: 'Check Failed',
          message: result.error || 'Failed to check username'
        });
      }
      
      setIsCheckingAvailability(false);
    }, 500);

    return () => {
      console.log('Clearing timeout');
      clearTimeout(timeoutId);
    };
  }, [username]); // Only depend on username

  // Determine if continue button should be enabled
  const allRequirementsMet = requirements.hasMinLength && 
                            requirements.hasMaxLength && 
                            requirements.hasValidChars && 
                            requirements.noInvalidPattern && 
                            requirements.startsWithLetter;

  const canContinue = allRequirementsMet && 
                     availabilityResult === true && 
                     !isCheckingAvailability && 
                     !isUpdatingUsername;

  console.log('Button state:', {
    allRequirementsMet,
    availabilityResult,
    isCheckingAvailability,
    isUpdatingUsername,
    canContinue
  });

  const handleContinue = async () => {
    if (!canContinue) return;

    setIsUpdatingUsername(true);
    
    const result = await usernameService.updateUsername(username);
    
    if (result.success) {
      router.push('/signup/signup-success');
    } else {
      setError({
        type: 'server',
        title: 'Update Failed',
        message: result.error || 'Failed to set username. Please try again.'
      });
    }
    
    setIsUpdatingUsername(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setUsername(suggestion);
  };

  // Get requirement status for styling
  const getRequirementStatus = (index: number) => {
    const trimmed = username.trim();
    
    if (!trimmed) return 'unmet'; // Gray for empty
    
    switch (index) {
      case 0: return requirements.startsWithLetter ? 'met' : 'error';
      case 1: return requirements.hasMaxLength ? 'met' : 'error';
      case 2: return requirements.hasValidChars ? 'met' : 'error';
      case 3: return requirements.noInvalidPattern ? 'met' : 'error';
      case 4: return requirements.noInvalidPattern ? 'met' : 'error';
      default: return 'unmet';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Choose Your Username</Text>
              <Text style={styles.subtitle}>Pick a unique username that represents you</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    formatValidation.isValid && availabilityResult === true && styles.inputSuccess,
                    username.trim() && (!formatValidation.isValid || availabilityResult === false || availabilityResult === null) && styles.inputError
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={Colors.text.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={usernameService.validationRules.maxLength}
                  editable={!isUpdatingUsername}
                />
                
                {/* Character count */}
                <Text style={styles.characterCount}>
                  {username.length}/{usernameService.validationRules.maxLength} characters
                </Text>
                
                {/* Availability status */}
                {formatValidation.isValid && (
                  <View style={styles.availabilityContainer}>
                    {isCheckingAvailability ? (
                      <Text style={styles.checkingText}>Checking availability...</Text>
                    ) : availabilityResult === true ? (
                      <Text style={styles.availableText}>✓ @{username} is available</Text>
                    ) : (
                      <View>
                        <Text style={styles.unavailableText}>✗ @{username} is not available</Text>
                        {availabilityErrors.length > 0 && (
                          <Text style={styles.errorDetailsText}>{availabilityErrors[0]}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
                
                {/* Username requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Username requirements:</Text>
                  
                  {rules.map((rule: string, index: number) => {
                    const status = getRequirementStatus(index);
                    
                    return (
                      <Text 
                        key={index}
                        style={[
                          styles.requirement,
                          status === 'met' ? styles.requirementMet : 
                          status === 'error' ? styles.requirementError : 
                          styles.requirementUnmet
                        ]}
                      >
                        • {rule}
                      </Text>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  canContinue ? styles.activeButton : styles.inactiveButton
                ]} 
                onPress={handleContinue}
                disabled={!canContinue}
              >
                <Text style={[
                  styles.continueButtonText,
                  canContinue ? styles.activeButtonText : styles.inactiveButtonText
                ]}>
                  {isUpdatingUsername ? 'Setting Username...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {(isCheckingAvailability || isUpdatingUsername) && (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {isUpdatingUsername ? 'Setting your username...' : 'Checking availability...'}
            </Text>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          type={error.type as 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general'}
          title={error.title}
          message={error.message}
          onDismiss={() => setError(null)}
        />
      )}
    </SafeAreaView>
  );
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
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Layout.spacing.xxl,
    marginBottom: Layout.spacing.xxl,
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
  },
  inputContainer: {
    gap: Layout.spacing.xs,
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
  inputSuccess: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  characterCount: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  availabilityContainer: {
    marginTop: Layout.spacing.xs,
  },
  checkingText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  availableText: {
    ...Typography.styles.caption,
    color: '#22C55E',
    fontWeight: '500',
  },
  unavailableText: {
    ...Typography.styles.caption,
    color: '#EF4444',
    fontWeight: '500',
  },
  errorDetailsText: {
    ...Typography.styles.caption,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 2,
  },
  requirementsContainer: {
    marginTop: Layout.spacing.sm,
    padding: Layout.spacing.sm,
    backgroundColor: '#F8F9FA',
    borderRadius: Layout.borderRadius.sm,
  },
  requirementsTitle: {
    ...Typography.styles.bodyMedium,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  requirement: {
    ...Typography.styles.caption,
    marginBottom: 2,
  },
  requirementMet: {
    color: '#22C55E',
  },
  requirementUnmet: {
    color: Colors.text.secondary,
  },
  requirementError: {
    color: '#EF4444',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});

export default UsernameScreen;