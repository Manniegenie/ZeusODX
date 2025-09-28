// app/profile/confirm-new-pin.tsx
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Vibration, Alert, Image } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import TwoFactorAuthModal from '../../components/2FA';
import useResetPin from '../../hooks/useResetPin';

// use same back icon as other screens
import backIcon from '../../components/icons/backy.png';

export default function ResetPinConfirmScreen() {
  const router = useRouter();
  const { changePin, changing } = useResetPin();

  // NOTE: newPin comes from the previous screen via params
  const { newPin } = useLocalSearchParams();
  const newPinValue = Array.isArray(newPin) ? newPin[0] : (newPin ?? '');

  const [confirmPin, setConfirmPin] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const PIN_LENGTH = 6;

  const handleNumberPress = (number: string) => {
    if (confirmPin.length < PIN_LENGTH) {
      setConfirmPin(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    setConfirmPin(prev => prev.slice(0, -1));
  };

  const handleBackPress = () => {
    if (!changing) router.back();
  };

  const handleConfirm = () => {
    setErrorMsg(null);
    if (confirmPin.length === PIN_LENGTH) {
      if (confirmPin === newPinValue) {
        // PINs match - show 2FA modal
        setShow2FAModal(true);
      } else {
        // PINs don't match
        Alert.alert(
          'PIN Mismatch',
          'The PINs you entered do not match. Please try again.',
          [{ text: 'OK', onPress: () => setConfirmPin('') }]
        );
        Vibration.vibrate(100);
      }
    } else {
      // Vibrate if PIN incomplete
      Vibration.vibrate(100);
    }
  };

  const handle2FASubmit = async (code: string) => {
    // Sanitize TOTP
    const twoFactorCode = String(code || '').trim();
    setErrorMsg(null);

    const res = await changePin({
      newPin: String(newPinValue || '').trim(),
      confirmPin: String(confirmPin || '').trim(),
      twoFactorCode,
    });

    if (res?.success) {
      setShow2FAModal(false);
      Alert.alert(
        'PIN Reset Successful',
        'Your PIN has been successfully reset. You can now use your new PIN to access your account.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Adjust this route to where you want to land after success
              router.replace('/profile/profile');
            },
          },
        ]
      );
    } else {
      // Do not close modal; show inline error below subtitle
      setErrorMsg(res?.message || 'Failed to change PIN. Please try again.');
    }
  };

  const handle2FAClose = () => {
    if (!changing) setShow2FAModal(false);
  };

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

  const backDisabled = Boolean(changing);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header with Image Back Button (centered title) */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={backDisabled ? 1 : 0.7}
            disabled={backDisabled}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

          {/* Centered title using absolute-position pattern */}
          <Text style={styles.headerTitle}>Reset PIN</Text>

          {/* spacer to keep title centered */}
          <View style={styles.emptySpace} />
        </View>

        {/* Header Content */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm new PIN</Text>
          <Text style={styles.subtitle}>Please re-enter your new PIN to confirm</Text>

          {/* Inline error from changePin / 2FA */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
        </View>

        {/* PIN Display */}
        <View style={styles.pinContainer}>
          <View style={styles.pinDots}>{renderPinDots()}</View>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>{renderNumberPad()}</View>

        {/* Confirm Button */}
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
              {changing ? 'Submitting…' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2FA Modal */}
      <TwoFactorAuthModal
        visible={show2FAModal}
        onClose={handle2FAClose}
        onSubmit={handle2FASubmit}
        loading={changing}
        title="Security Verification"
        subtitle="Enter your 6-digit authenticator code to complete PIN reset"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Layout.spacing.lg },

  // Header with back button
  headerSection: {
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  emptySpace: { width: 40 },

  // Main header content
  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.xxl, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Layout.spacing.md, lineHeight: 20 },

  // Error banner
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

  // PIN display
  pinContainer: { alignItems: 'center', marginBottom: Layout.spacing.xxl },
  pinDots: { flexDirection: 'row', gap: Layout.spacing.md },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: 'transparent',
  },
  filledDot: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  // Number pad
  numberPad: { flex: 1, justifyContent: 'center', paddingVertical: Layout.spacing.lg },
  numberRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Layout.spacing.lg, paddingHorizontal: Layout.spacing.xl },
  numberButton: {
    width: 70, height: 70, borderRadius: 8, backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  emptyButton: { borderColor: 'transparent' },
  numberText: { fontSize: 24, fontFamily: Typography.medium, color: Colors.text.primary },
  backspaceText: { fontSize: 20, color: Colors.text.secondary },

  // Button
  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg },
  confirmButton: { paddingVertical: Layout.spacing.md, borderRadius: Layout.borderRadius.lg, alignItems: 'center', borderWidth: 1 },
  activeButton: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  inactiveButton: { backgroundColor: 'transparent', borderColor: '#E0E0E0' },
  confirmButtonText: { ...Typography.styles.bodyMedium, fontWeight: '600' },
  activeButtonText: { color: Colors.surface },
  inactiveButtonText: { color: Colors.text.secondary },
});
