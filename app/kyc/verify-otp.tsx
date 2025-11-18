import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import ErrorDisplay from '../../components/ErrorDisplay';
import { useEmailVerification } from '../../hooks/useEmailVerification';
import { useUserProfile } from '../../hooks/useProfile';

const OTP_LENGTH = 6;
const TIMER_SECS = 120;

type ErrorType =
  | 'network'
  | 'validation'
  | 'auth'
  | 'server'
  | 'notFound'
  | 'general'
  | 'setup'
  | 'limit'
  | 'balance';

export default function VerifyEmailOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  // Profile (fallback for email if not passed via params)
  const { profile } = useUserProfile();
  const currentEmail = useMemo(
    () => String(params?.email || profile?.email || ''),
    [params?.email, profile?.email]
  );

  // Email verification hook
  const { verify, verifying, initiate, initiating } = useEmailVerification();

  // OTP inputs
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Resend timer
  const [countdown, setCountdown] = useState(TIMER_SECS);
  const [canResend, setCanResend] = useState(false);

  // ErrorDisplay state
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('general');
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // ---- Helpers: ErrorDisplay ----
  const showError = (type: ErrorType, title: string, message: string) => {
    setErrorType(type);
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorDisplay(true);
  };
  const hideError = () => {
    setShowErrorDisplay(false);
    setErrorTitle(undefined);
    setErrorMessage(undefined);
  };
  const mapErrorType = (code?: string): ErrorType => {
    if (!code) return 'general';
    switch (code.toUpperCase()) {
      case 'NETWORK_ERROR':
      case 'CONNECTION_FAILED':
        return 'network';
      case 'INVALID_EMAIL':
      case 'INVALID_OTP':
      case 'INVALID_OTP_FORMAT':
        return 'validation';
      case 'UNAUTHORIZED':
      case 'AUTH_FAILED':
        return 'auth';
      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        return 'server';
      case 'USER_NOT_FOUND':
        return 'notFound';
      default:
        return 'general';
    }
  };

  // ---- Timer ----
  useEffect(() => {
    setCountdown(TIMER_SECS);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ---- Navigation ----
  const handleBackPress = () => router.back();

  // ---- OTP input handlers ----
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/[^\d]/g, '').slice(0, 1);
    const next = [...otp];
    next[index] = clean;
    setOtp(next);
    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ---- Actions ----
  const handleVerify = async () => {
    hideError();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Vibration.vibrate(100);
      showError('validation', 'Invalid Code', 'Please enter the 6-digit code.');
      return;
    }
    try {
      const res = await verify({ otp: code, email: currentEmail });
      if (res?.success) {
        // Email verified — go back to KYC level 2
        router.replace('/kyc/kyc-upgrade');
      } else {
        showError(mapErrorType(res?.error), 'Verification Failed', res?.message || 'Failed to verify email address.');
      }
    } catch {
      showError('network', 'Connection Error', 'Unable to verify code. Please check your connection and try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend || initiating) return;
    hideError();
    try {
      const res = await initiate({ email: currentEmail });
      if (res?.success) {
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus?.();
        // restart timer
        setCountdown(TIMER_SECS);
        setCanResend(false);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        showError(mapErrorType(res?.error), 'Failed to Resend', res?.message || 'Could not resend code. Please try again.');
      }
    } catch {
      showError('network', 'Connection Error', 'Unable to resend code. Please check your connection and try again.');
    }
  };

  const isComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      {/* ErrorDisplay */}
      {showErrorDisplay && (
        <ErrorDisplay
          type={errorType}
          title={errorTitle}
          message={errorMessage}
          autoHide
          duration={4000}
          dismissible
          onDismiss={hideError}
        />
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter Verification Code</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        {/* Copy */}
        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to
            {currentEmail ? ` ${currentEmail}` : ' your email address'}.
          </Text>
        </View>

        {/* OTP boxes */}
        <View style={styles.otpContainer}>
          <View style={styles.otpInputs}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => (inputRefs.current[i] = ref)}
                style={[styles.otpInput, digit && styles.filledInput]}
                value={digit}
                onChangeText={v => handleOtpChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoFocus={i === 0}
                selectionColor={Colors.primary}
              />
            ))}
          </View>
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <View style={styles.resendTextContainer}>
            <Text style={styles.resendText}>Did not receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend || initiating} activeOpacity={0.7}>
              <Text
                style={[
                  styles.resendLink,
                  canResend && !initiating ? styles.activeResendLink : styles.inactiveResendLink,
                ]}
              >
                {initiating ? 'Sending…' : 'Resend'}
              </Text>
            </TouchableOpacity>
            {!canResend && <Text style={styles.resendText}> in {formatTime(countdown)}</Text>}
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Verify */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.verifyButton, isComplete ? styles.activeButton : styles.inactiveButton]}
            onPress={handleVerify}
            activeOpacity={0.7}
            disabled={verifying}
          >
            <Text
              style={[
                styles.verifyButtonText,
                isComplete ? styles.activeButtonText : styles.inactiveButtonText,
              ]}
            >
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ——— Styles (same look/feel as your reset-pin OTP screen) ———
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Layout.spacing.lg },

  headerSection: { paddingTop: 12, paddingBottom: 6 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.02)', overflow: 'hidden' },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  emptySpace: { width: 48 },

  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.xl, alignItems: 'center' },
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
    lineHeight: 20,
  },

  otpContainer: { alignItems: 'center', marginBottom: Layout.spacing.xxl },
  otpInputs: { flexDirection: 'row', gap: 12 },
  otpInput: {
    width: 45,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#E0DEFF',
    fontSize: 16,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
  },
  filledInput: { borderColor: Colors.primary, backgroundColor: '#E0DEFF' },

  resendContainer: { alignItems: 'center', marginBottom: Layout.spacing.lg },
  resendTextContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  resendText: { fontSize: 13, color: Colors.text.secondary, fontFamily: Typography.regular, lineHeight: 18 },
  resendLink: { fontSize: 13, fontFamily: Typography.medium, textDecorationLine: 'underline', lineHeight: 18 },
  activeResendLink: { color: Colors.primary },
  inactiveResendLink: { color: Colors.text.secondary },

  spacer: { flex: 1 },

  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg },
  verifyButton: { paddingVertical: Layout.spacing.md, borderRadius: Layout.borderRadius.lg, alignItems: 'center', borderWidth: 1 },
  activeButton: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  inactiveButton: { backgroundColor: 'transparent', borderColor: '#E0E0E0' },
  verifyButtonText: { ...Typography.styles.bodyMedium, fontWeight: '600' },
  activeButtonText: { color: Colors.surface },
  inactiveButtonText: { color: Colors.text.secondary },
});