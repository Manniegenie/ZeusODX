// app/profile/confirm-new-pin.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Vibration } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ErrorDisplay from '../../components/ErrorDisplay';
import { useForgotPin } from '../../hooks/useforgotpin';

export default function ResetPinConfirmScreen() {
  const router = useRouter();
  const { resetPin, loading: changing, error, setPhoneNumber } = useForgotPin();

  // newPin comes from previous screen via params
  const params = useLocalSearchParams();
  const rawNewPin = params?.newPin;
  const newPinValue = Array.isArray(rawNewPin) ? String(rawNewPin[0]) : String(rawNewPin ?? '');

  // optional phone param (so we can populate hook)
  const rawPhoneParam = params?.phoneNumber ?? params?.phonenumber ?? params?.phone ?? undefined;
  const phoneNumber = Array.isArray(rawPhoneParam) ? (rawPhoneParam[0] ?? '') : (typeof rawPhoneParam === 'string' ? rawPhoneParam : '');

  const [confirmPin, setConfirmPin] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Toast/ErrorDisplay state (used for both error and success)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const [toastType, setToastType] = useState<'general' | 'success' | 'network' | 'validation'>(() => 'general');

  const PIN_LENGTH = 6;

  // Populate the hook's phoneNumber if passed in params
  useEffect(() => {
    if (phoneNumber && phoneNumber.trim() && setPhoneNumber) {
      setPhoneNumber(phoneNumber.trim());
    }
  }, [phoneNumber, setPhoneNumber]);

  const handleNumberPress = (number: string) => {
    if (confirmPin.length < PIN_LENGTH) {
      setConfirmPin(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    setConfirmPin(prev => prev.slice(0, -1));
  };

  const handleBackPress = () => {
    router.back();
  };

  const showToast = (type: 'general' | 'success' | 'network' | 'validation', title?: string, message?: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
    setToastTitle(undefined);
    setToastMessage(undefined);
  };

  const handleConfirm = async () => {
    setInlineError(null);

    if (confirmPin.length !== PIN_LENGTH) {
      Vibration.vibrate(100);
      showToast('validation', 'Incomplete PIN', 'Please enter the full 6-digit PIN.');
      return;
    }

    if (confirmPin !== newPinValue) {
      Vibration.vibrate(100);
      setConfirmPin('');
      showToast('validation', 'PIN Mismatch', 'The PINs you entered do not match. Please try again.');
      return;
    }

    // Call resetPin (hook will use stored phoneNumber or the one we set earlier)
    const res = await resetPin({
      newPin: String(newPinValue || '').trim(),
      confirmPin: String(confirmPin || '').trim(),
      twoFactorCode: '', // 2FA no longer required per backend update
      phoneNumber: phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : undefined,
    });

    if (res?.success) {
      // show success toast and navigate after dismiss
      showToast('success', 'PIN Reset Successful', 'Your PIN has been reset. Tap continue to go to login.');
    } else {
      // prefer server-provided message, fallback to generic
      const msg = res?.error || res?.message || 'Failed to reset PIN. Please try again.';
      setInlineError(msg);
      showToast('general', 'Reset Failed', msg);
    }
  };

  // When success toast is dismissed, navigate to login-pin
  useEffect(() => {
    if (!toastVisible && toastType === 'success') {
      // small delay to let hide animation (if any) finish — optional
      router.replace('/login/login-phone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastVisible, toastType]);

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[styles.pinDot, i < confirmPin.length && styles.filledDot]}
        />
      );
    }
    return dots;
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫'],
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((number, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.numberButton, number === '' && styles.emptyButton]}
            onPress={() => {
              if (number === '⌫') handleBackspace();
              else if (number !== '') handleNumberPress(number);
            }}
            disabled={number === '' || changing}
            activeOpacity={0.7}
          >
            <Text style={[styles.numberText, number === '⌫' && styles.backspaceText]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast / ErrorDisplay */}
      {toastVisible && (
        <ErrorDisplay
          type={toastType === 'success' ? 'general' : toastType}
          title={toastTitle}
          message={toastMessage}
          autoHide
          duration={3000}
          dismissible
          onDismiss={hideToast}
        />
      )}

      {/* Inline hook error (if set by hook) shown below header as fallback */}
      {error && !toastVisible && (
        <ErrorDisplay
          type="general"
          title="Error"
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
              disabled={changing}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Reset PIN</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Confirm new PIN</Text>
          <Text style={styles.subtitle}>Please re-enter your new PIN to confirm</Text>

          {/* Inline error from resetPin */}
          {inlineError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{inlineError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.pinContainer}>
          <View style={styles.pinDots}>{renderPinDots()}</View>
        </View>

        <View style={styles.numberPad}>{renderNumberPad()}</View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirmPin.length === PIN_LENGTH ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={changing}
          >
            <Text
              style={[
                styles.confirmButtonText,
                confirmPin.length === PIN_LENGTH ? styles.activeButtonText : styles.inactiveButtonText,
              ]}
            >
              {changing ? 'Resetting PIN…' : 'Reset PIN'}
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
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  emptySpace: { width: 40 },
  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.xxl, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Layout.spacing.md, lineHeight: 20 },
  errorBanner: {
    marginTop: 12,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    maxWidth: 420,
  },
  errorText: { color: '#991B1B', fontFamily: Typography.regular, fontSize: 13, textAlign: 'center' },
  pinContainer: { alignItems: 'center', marginBottom: Layout.spacing.xxl },
  pinDots: { flexDirection: 'row', gap: Layout.spacing.md },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: 'transparent',
  },
  filledDot: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  numberPad: { flex: 1, justifyContent: 'center', paddingVertical: Layout.spacing.lg },
  numberRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Layout.spacing.lg, paddingHorizontal: Layout.spacing.xl },
  numberButton: {
    width: 70, height: 70, borderRadius: 8, backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  emptyButton: { borderColor: 'transparent' },
  numberText: { fontSize: 24, fontFamily: Typography.medium, color: Colors.text.primary },
  backspaceText: { fontSize: 20, color: Colors.text.secondary },
  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg },
  confirmButton: { paddingVertical: Layout.spacing.md, borderRadius: Layout.borderRadius.lg, alignItems: 'center', borderWidth: 1 },
  activeButton: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  inactiveButton: { backgroundColor: 'transparent', borderColor: '#E0E0E0' },
  confirmButtonText: { ...Typography.styles.bodyMedium, fontWeight: '600' },
  activeButtonText: { color: Colors.surface },
  inactiveButtonText: { color: Colors.text.secondary },
});
