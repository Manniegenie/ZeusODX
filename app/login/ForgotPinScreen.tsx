// app/login/ForgotPinScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import ErrorDisplay from '../../components/ErrorDisplay';
import { useForgotPin } from '../../hooks/useforgotpin';

// Back icon import - matching BTC-BSC screen
import backIcon from '../../components/icons/backy.png';

export default function ForgotPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Forgot pin hook
  const {
    initiate,
    loading,
    error,
    phoneNumber: hookPhoneNumber,
    setPhoneNumber: setHookPhoneNumber,
  } = useForgotPin();

  // UI state
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorMessageLocal, setErrorMessageLocal] = useState<string | undefined>(undefined);

  // Safely read phoneNumber param (supports phoneNumber | phonenumber | phone)
  const rawParam = params?.phoneNumber ?? params?.phonenumber ?? params?.phone ?? undefined;
  const passedPhone = Array.isArray(rawParam)
    ? rawParam[0] ?? ''
    : (typeof rawParam === 'string' ? rawParam : '');

  // If a phone param is provided, store it in hook state (once)
  useEffect(() => {
    if (passedPhone && !hookPhoneNumber) {
      setHookPhoneNumber(String(passedPhone));
    }
  }, [passedPhone, hookPhoneNumber, setHookPhoneNumber]);

  const handleBackPress = () => router.back();

  const showError = (title: string, message: string) => {
    setErrorMessageLocal(message);
    setShowErrorDisplay(true);
  };

  const hideError = () => {
    setShowErrorDisplay(false);
    setErrorMessageLocal(undefined);
  };

  const handleSendOtp = async () => {
    hideError();

    // Use passed phone or hook phone
    const phoneToUse = (passedPhone && passedPhone.trim())
      ? passedPhone.trim()
      : (hookPhoneNumber && hookPhoneNumber.trim() ? hookPhoneNumber.trim() : '');

    if (!phoneToUse) {
      showError('Phone Required', 'We need your phone number to start the PIN reset. Please go back and enter your phone number.');
      return;
    }

    try {
      // Pass phoneToUse explicitly so hook stores and service receives it
      const res = await initiate(phoneToUse);
      if (res?.success) {
        // Pass the phone param into the verify screen
        router.push({
          pathname: '/login/ForgotPinVerifyScreen',
          params: { phoneNumber: phoneToUse },
        });
      } else {
        showError('Failed to Send Code', res?.error || res?.message || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      showError('Connection Error', err?.message || 'Unable to send verification code. Check your connection and try again.');
    }
  };

  const showInlineError = Boolean(error) && !showErrorDisplay;

  return (
    <SafeAreaView style={styles.container}>
      {showErrorDisplay && (
        <ErrorDisplay
          type="general"
          title="Forgot PIN"
          message={errorMessageLocal}
          autoHide
          duration={4000}
          dismissible
          onDismiss={hideError}
        />
      )}

      {showInlineError && (
        <ErrorDisplay
          type="general"
          title="Forgot PIN"
          message={String(error)}
          autoHide
          duration={4000}
          dismissible
          onDismiss={() => {}}
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
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot PIN</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        {/* Copy */}
        <View style={styles.header}>
          <Text style={styles.title}>Reset your PIN</Text>
          <Text style={styles.subtitle}>
            We'll send a 6-digit verification code to the email associated with your phone number.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Send OTP */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendButton, loading && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={loading}
            activeOpacity={0.7}
            testID="sendOtpButton"
          >
            <Text style={styles.sendButtonText}>
              {loading ? 'Sending…' : 'Send Verification Code'}
            </Text>
          </TouchableOpacity>

          {!passedPhone && !hookPhoneNumber && (
            <Text style={styles.helperText}>
              Please go back and enter your phone number to continue.
            </Text>
          )}
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
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  emptySpace: { width: 40 },

  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.lg, alignItems: 'center' },
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

  spacer: { flex: 1 },

  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg, alignItems: 'center', width: '100%' },
  sendButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sendButtonText: { ...Typography.styles.bodyMedium, color: Colors.surface, fontWeight: '600' },
  helperText: { marginTop: 8, color: Colors.text.secondary, ...Typography.styles.caption, textAlign: 'center' },
});