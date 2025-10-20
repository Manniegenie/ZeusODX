import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useVerify } from '../../hooks/useVerify';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    isVerifying, 
    isResending, 
    verifyOTP, 
    resendOTP, 
    getTempSignupData 
  } = useVerify();

  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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

  // Get signup data on component mount
  useEffect(() => {
    const loadSignupData = async () => {
      // First try to get from route params
      if (params.phonenumber) {
        setPhoneNumber(params.phonenumber as string);
      }
      if (params.email) {
        setEmail(params.email as string);
      }

      // If not in params, get from temp storage
      if (!params.phonenumber) {
        const tempData = await getTempSignupData();
        if (tempData.success && tempData.data) {
          setPhoneNumber(tempData.data.phonenumber);
          setEmail(tempData.data.email);
        } else {
          // No signup data found, redirect back to signup
          router.push('/signup/signupI');
        }
      }
    };

    loadSignupData();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !isResending) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, isResending]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (verificationCode.length === 6 && !isVerifying && phoneNumber) {
      handleVerification();
    }
  }, [verificationCode, phoneNumber]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string) => {
    // Clear any existing errors when user starts typing
    if (error.show) {
      setError({ show: false, type: 'general', message: '', title: '' });
    }

    // Only allow numbers and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCode(numericText);
  };

  const handleVerification = async () => {
    if (!phoneNumber) {
      setError({
        show: true,
        type: 'general',
        title: 'Missing Information',
        message: 'Phone number not found. Please restart signup process.'
      });
      return;
    }

    try {
      const result = await verifyOTP({
        phonenumber: phoneNumber,
        code: verificationCode
      });

      if (result.success) {
        // User is now fully registered and logged in
        // Navigate to dashboard or welcome screen
        router.push('/signup/pinsetup');
      } else {
        // Show error message
        let errorType: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' = 'auth';
        let errorTitle = 'Verification Failed';
        let errorMessage = result.error || 'Invalid verification code. Please try again.';

        // Handle specific error types
        if (result.error?.includes('not found')) {
          errorType = 'notFound';
          errorTitle = 'Code Not Found';
          errorMessage = result.error;
        } else if (result.error?.includes('expired')) {
          errorType = 'validation';
          errorTitle = 'Code Expired';
          errorMessage = result.error;
        } else if (result.error?.includes('Invalid')) {
          errorType = 'auth';
          errorTitle = 'Invalid Code';
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

        // Clear the verification code
        setVerificationCode('');

        // Auto-dismiss error after 4 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general', message: '', title: '' });
        }, 4000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError({
        show: true,
        type: 'general',
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.'
      });

      setVerificationCode('');

      // Auto-dismiss error after 4 seconds
      setTimeout(() => {
        setError({ show: false, type: 'general', message: '', title: '' });
      }, 4000);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isResending || !phoneNumber) return;

    try {
      const result = await resendOTP(phoneNumber);

      if (result.success) {
        // Reset countdown and states
        setCountdown(120);
        setCanResend(false);
        setVerificationCode('');
        
        // Show success message
        setError({
          show: true,
          type: 'general',
          title: 'Code Sent',
          message: 'A new verification code has been sent to your phone.'
        });

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general', message: '', title: '' });
        }, 3000);
      } else {
        setError({
          show: true,
          type: 'network',
          title: 'Resend Failed',
          message: result.error || 'Failed to resend code. Please try again.'
        });

        // Auto-dismiss error after 4 seconds
        setTimeout(() => {
          setError({ show: false, type: 'general', message: '', title: '' });
        }, 4000);
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError({
        show: true,
        type: 'general',
        title: 'Resend Failed',
        message: 'Something went wrong. Please try again.'
      });

      // Auto-dismiss error after 4 seconds
      setTimeout(() => {
        setError({ show: false, type: 'general', message: '', title: '' });
      }, 4000);
    }
  };

  const handleDismissError = () => {
    setError({ show: false, type: 'general', message: '', title: '' });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Format phone number for display (e.g., +234810****567)
    if (phone.length > 8) {
      const start = phone.slice(0, 6);
      const end = phone.slice(-3);
      return `${start}****${end}`;
    }
    return phone;
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

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm your phone number</Text>
          <Text style={styles.subtitle}>
            A verification code was sent to {formatPhoneNumber(phoneNumber)}. Enter the code to continue
          </Text>
        </View>

        {/* Verification Code Input */}
        <View style={styles.codeSection}>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor={Colors.text.muted}
            value={verificationCode}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            textAlign="center"
            editable={!isVerifying}
            returnKeyType="done"
            blurOnSubmit={false}
            selectTextOnFocus={true}
          />
          
          {/* Visual code display */}
          <View style={styles.codeVisual}>
            {[...Array(6)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  index < verificationCode.length && styles.filledCodeBox,
                  isVerifying && verificationCode.length === 6 && styles.verifyingCodeBox
                ]}
              >
                <Text style={styles.codeText}>
                  {verificationCode[index] || ''}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Verification status */}
          {isVerifying && (
            <Text style={styles.verifyingText}>Verifying your account...</Text>
          )}
        </View>

        {/* Resend Code */}
        <View style={styles.resendSection}>
          <Text style={styles.resendQuestion}>Did not receive the code?</Text>
          <TouchableOpacity 
            onPress={handleResendCode} 
            disabled={!canResend || isVerifying || isResending}
          >
            <Text style={[
              styles.resendText,
              (canResend && !isVerifying && !isResending) ? styles.resendActive : styles.resendInactive
            ]}>
              {isResending 
                ? 'Sending...' 
                : `Resend code ${!canResend ? `in ${formatTime(countdown)}` : ''}`
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsText}>
            Enter all 6 digits and we'll verify your code automatically
          </Text>
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
    paddingTop: Layout.spacing.xl,
  },
  header: {
    marginBottom: Layout.spacing.xxl,
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
    paddingHorizontal: Layout.spacing.sm,
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  codeInput: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: 18,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
    minHeight: 50,
  },
  codeVisual: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  codeBox: {
    width: 50,
    height: 60,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledCodeBox: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  verifyingCodeBox: {
    borderColor: '#FFA500',
    backgroundColor: '#FFF8E1',
  },
  codeText: {
    fontSize: 24,
    fontFamily: Typography.bold,
    color: Colors.text.primary,
  },
  verifyingText: {
    ...Typography.styles.caption,
    color: '#FFA500',
    fontStyle: 'italic',
    marginTop: Layout.spacing.xs,
  },
  resendSection: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.xl,
  },
  resendQuestion: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  resendText: {
    ...Typography.styles.bodyMedium,
  },
  resendActive: {
    color: Colors.primary,
  },
  resendInactive: {
    color: Colors.text.muted,
  },
  instructionsSection: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  instructionsText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});