import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import useResetPin from '../../hooks/useResetPin';

const OTP_LENGTH = 6;
const TIMER_SECS = 120;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { verifyOtp, verifying, initiate, initiating } = useResetPin();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(TIMER_SECS);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

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
    if (clean && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Vibration.vibrate(100);
      return;
    }
    setErrorMsg(null);
    try {
      const res = await verifyOtp(code);
      if (res && res.success === true) {
        router.push({ pathname: '/profile/new-pin', params: { otp: code } });
      } else {
        setErrorMsg(res?.message || 'Failed to verify code. Please try again.');
      }
    } catch {
      setErrorMsg('Unable to verify code. Please check your connection and try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend || initiating) return;
    setErrorMsg(null);
    const res = await initiate();
    if (res && res.success === true) {
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
      setErrorMsg(res?.message || 'Could not resend code. Please try again.');
    }
  };

  const isComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter Verification Code</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code we sent to your email address.</Text>
          {errorMsg ? (
            <View style={styles.errorBanner}><Text style={styles.errorText}>{errorMsg}</Text></View>
          ) : null}
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
            <TouchableOpacity onPress={handleResend} disabled={!canResend || initiating} activeOpacity={0.7}>
              <Text style={[styles.resendLink, canResend && !initiating ? styles.activeResendLink : styles.inactiveResendLink]}>
                {initiating ? 'Sending…' : 'Resend'}
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
            <Text style={[styles.verifyButtonText, isComplete ? styles.activeButtonText : styles.inactiveButtonText]}>
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: {
    color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600',
    flex: 1, textAlign: 'center', marginHorizontal: 16,
  },
  emptySpace: { width: 40 },
  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.xl, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Layout.spacing.md, lineHeight: 20 },
  errorBanner: { marginTop: 12, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, maxWidth: 420 },
  errorText: { color: '#991B1B', fontFamily: Typography.regular, fontSize: 13, textAlign: 'center' },
  otpContainer: { alignItems: 'center', marginBottom: Layout.spacing.xxl },
  otpInputs: { flexDirection: 'row', gap: 12 },
  otpInput: { width: 45, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#E0DEFF', fontSize: 16, fontFamily: Typography.medium, color: Colors.text.primary },
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
