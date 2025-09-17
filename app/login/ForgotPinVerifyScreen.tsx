// app/login/ForgotPinVerifyScreen.tsx
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
import { useUserProfile } from '../../hooks/useProfile';
import { useForgotPin } from '../../hooks/useforgotpin';

const OTP_LENGTH = 6;
const TIMER_SECS = 120;

function maskEmailFirstThree(email = '') {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email.replace(/.(?=.{2})/g, '*');
  const [local, domain] = parts;
  const visible = local.slice(0, 3);
  return `${visible}${local.length > 3 ? '***' : '***'}@${domain}`;
}

export default function ForgotPinVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phoneNumber?: string }>();

  const { profile } = useUserProfile({ auto: true });
  const currentEmail = useMemo(() => String(profile?.email || ''), [profile]);
  const maskedEmail = useMemo(() => maskEmailFirstThree(currentEmail), [currentEmail]);
  const profilePhone = useMemo(() => String(profile?.phonenumber || ''), [profile]);

  const {
    verifyOtp,
    initiate,
    loading: verifying,
    error,
    phoneNumber: hookPhoneNumber,
    setPhoneNumber: setHookPhoneNumber,
  } = useForgotPin();

  const rawParam = params?.phoneNumber ?? params?.phonenumber ?? params?.phone ?? undefined;
  const passedPhone = Array.isArray(rawParam) ? (rawParam[0] ?? '') : (typeof rawParam === 'string' ? rawParam : '');

  useEffect(() => {
    if (passedPhone && !hookPhoneNumber) {
      setHookPhoneNumber(String(passedPhone));
    }
  }, [passedPhone, hookPhoneNumber, setHookPhoneNumber]);

  useEffect(() => {
    if (!hookPhoneNumber && !passedPhone && profilePhone) {
      setHookPhoneNumber(profilePhone);
    }
  }, [profilePhone, hookPhoneNumber, passedPhone, setHookPhoneNumber]);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [countdown, setCountdown] = useState(TIMER_SECS);
  const [canResend, setCanResend] = useState(false);
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

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

  const handleBackPress = () => router.back();

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

  const resolvePhoneToUse = () => {
    const candidates = [
      (passedPhone && passedPhone.trim()) ? passedPhone.trim() : '',
      (hookPhoneNumber && hookPhoneNumber.trim()) ? hookPhoneNumber.trim() : '',
      (profilePhone && profilePhone.trim()) ? profilePhone.trim() : ''
    ];
    return candidates.find(p => !!p) ?? '';
  };

  const handleVerify = async () => {
    setShowErrorDisplay(false);
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Vibration.vibrate(100);
      setErrorTitle('Invalid Code');
      setErrorMessage('Please enter the 6-digit code.');
      setShowErrorDisplay(true);
      return;
    }

    const phoneToUse = resolvePhoneToUse();
    if (!phoneToUse) {
      setErrorTitle('Phone Required');
      setErrorMessage('No phone number available for this process. Go back and retry from the login screen.');
      setShowErrorDisplay(true);
      return;
    }

    try {
      console.log('About to call verifyOtp with:', code, phoneToUse);
      const res = await verifyOtp(code, phoneToUse);
      console.log('verifyOtp response:', res);
      
      if (res?.success) {
        router.replace({
          pathname: '/login/new-pin',
          params: { phoneNumber: phoneToUse },
        });
      } else {
        setErrorTitle('Verification Failed');
        setErrorMessage(res?.error || res?.data?.message || 'Failed to verify code.');
        setShowErrorDisplay(true);
      }
    } catch (err: any) {
      setErrorTitle('Connection Error');
      setErrorMessage(err?.message || 'Unable to verify code. Please check your connection and try again.');
      setShowErrorDisplay(true);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setShowErrorDisplay(false);

    const phoneToUse = resolvePhoneToUse();
    if (!phoneToUse) {
      setErrorTitle('Phone Required');
      setErrorMessage('No phone number available for this process. Go back and retry from the login screen.');
      setShowErrorDisplay(true);
      return;
    }

    try {
      const res = await initiate(phoneToUse);
      if (res?.success) {
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus?.();
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
        setErrorTitle('Failed to Resend');
        setErrorMessage(res?.error || res?.data?.message || 'Could not resend code. Please try again.');
        setShowErrorDisplay(true);
      }
    } catch (err: any) {
      setErrorTitle('Connection Error');
      setErrorMessage(err?.message || 'Unable to resend code. Please check your connection and try again.');
      setShowErrorDisplay(true);
    }
  };

  const isComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      {showErrorDisplay && (
        <ErrorDisplay
          type="general"
          title={errorTitle}
          message={errorMessage}
          autoHide
          duration={4000}
          dismissible
          onDismiss={() => setShowErrorDisplay(false)}
        />
      )}

      {error && !showErrorDisplay && (
        <ErrorDisplay
          type="general"
          title="Verification Error"
          message={String(error)}
          autoHide
          duration={4000}
          dismissible
          onDismiss={() => {}}
        />
      )}

      <View style={styles.content}>
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

        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{' '}
            {currentEmail ? <Text style={{ fontFamily: Typography.medium }}>{maskedEmail}</Text> : 'your email address'}.
          </Text>
        </View>

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

        <View style={styles.resendContainer}>
          <View style={styles.resendTextContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend} activeOpacity={0.7}>
              <Text
                style={[
                  styles.resendLink,
                  canResend ? styles.activeResendLink : styles.inactiveResendLink,
                ]}
              >
                Resend
              </Text>
            </TouchableOpacity>
            {!canResend && <Text style={styles.resendText}> in {formatTime(countdown)}</Text>}
          </View>
        </View>

        <View style={styles.spacer} />

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