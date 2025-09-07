import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import ErrorDisplay from '../../../components/ErrorDisplay'; // ← IMPORTED
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useNINVerification } from '../../../hooks/useninVerification'; // ← correct casing/path

type ErrorType = 'network' | 'server' | 'notFound' | 'general';

export default function NINVerify() {
  const router = useRouter();
  const [nin, setNin] = useState('');

  const { submitting, submitError, submitSuccess, submitNIN, validateNIN } =
    useNINVerification();

  // Banner state for ErrorDisplay (same vibe as your 2FA screen)
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('general');
  const [errorMessage, setErrorMessage] = useState('');

  const classifyError = (msg?: string): ErrorType => {
    const m = (msg || '').toLowerCase();
    if (m.includes('network') || m.includes('connection')) return 'network';
    if (m.includes('server') || m.includes('500')) return 'server';
    if (m.includes('not found')) return 'notFound';
    return 'general';
  };

  const openError = useCallback((msg: string) => {
    setErrorType(classifyError(msg));
    setErrorMessage(msg);
    setShowError(true);
  }, []);

  const closeError = useCallback(() => {
    setShowError(false);
  }, []);

  // Surface hook error in the banner
  useEffect(() => {
    if (submitError) openError(String(submitError));
  }, [submitError, openError]);

  // Validation
  const validation = useMemo(() => validateNIN(nin), [nin, validateNIN]);
  const isValidFormat = validation?.valid === true;

  const handleSubmit = async () => {
    if (!isValidFormat) {
      openError(validation?.message || 'NIN must be 11 digits.');
      return;
    }
    const res = await submitNIN({ nin });
    if (!res?.success) {
      openError(res?.message || 'Failed to submit NIN verification');
      return;
    }
    // success: keep UX minimal, then go back
    setTimeout(() => router.back(), 200);
  };

  useEffect(() => {
    if (submitSuccess) {
      const t = setTimeout(() => router.back(), 200);
      return () => clearTimeout(t);
    }
  }, [submitSuccess, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {showError && (
        <ErrorDisplay
          type={errorType}
          message={errorMessage}
          autoHide={false}
          dismissible
          onDismiss={closeError}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NIN Verification</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.sub}>Enter your 11-digit NIN.</Text>

          <View style={styles.inputContainer}>
            <TextInput
              value={nin}
              onChangeText={setNin}
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={11}
              placeholder="11-digit NIN"
              style={[
                styles.input,
                !isValidFormat && nin.length > 0 && styles.inputError,
              ]}
              editable={!submitting}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              testID="ninInput"
            />
            {!isValidFormat && nin.length > 0 && (
              <Text style={styles.errorText}>
                {validation?.message || 'NIN must be exactly 11 digits.'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.cta,
              { opacity: isValidFormat && !submitting ? 1 : 0.5 },
            ]}
            disabled={!isValidFormat || submitting}
            onPress={handleSubmit}
            activeOpacity={0.7}
            testID="submitNinButton"
          >
            {submitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.ctaText, { marginLeft: 8 }]}>
                  Submitting…
                </Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
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
  headerSpacer: { width: 40 },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 14, marginBottom: 12 },

  inputContainer: { marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },

  cta: {
    backgroundColor: '#35297F',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
});
