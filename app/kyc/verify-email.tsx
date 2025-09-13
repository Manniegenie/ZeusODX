import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import ErrorDisplay from '../../components/ErrorDisplay';
import { useEmailVerification } from '../../hooks/useEmailVerification';
import { useUserProfile } from '../../hooks/useProfile';

interface ErrorAction {
  title: string;
  message: string;
  actionText: string;
  route?: string;
  priority?: 'high' | 'medium' | 'low';
}
interface ErrorDisplayData {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  errorAction?: ErrorAction;
  onActionPress?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyEmailSendScreen() {
  const router = useRouter();

  // Profile → current email
  const { profile, loading: profileLoading } = useUserProfile({ auto: true });
  const currentEmail = useMemo(() => String(profile?.email || ''), [profile]);
  const hasValidEmail = useMemo(() => EMAIL_RE.test(currentEmail), [currentEmail]);

  // Email verification (initiate)
  const { initiate, initiating, initError } = useEmailVerification();

  // ErrorDisplay state
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  const handleBackPress = () => router.back();

  const showErrorMessage = (d: ErrorDisplayData) => {
    setErrorDisplayData(d);
    setShowErrorDisplay(true);
  };
  const hideErrorDisplay = () => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };
  const getErrorType = (code?: string): ErrorDisplayData['type'] => {
    if (!code) return 'general';
    switch (code.toUpperCase()) {
      case 'NETWORK_ERROR':
      case 'CONNECTION_FAILED':
        return 'network';
      case 'INVALID_EMAIL':
      case 'EMAIL_NOT_FOUND':
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

  const handleSendOtp = async () => {
    hideErrorDisplay();
    if (!hasValidEmail) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Email',
        message: currentEmail ? 'Email address appears invalid.' : 'No email address found on your profile.',
        autoHide: true,
        duration: 3500,
        dismissible: true,
      });
      return;
    }
    try {
      const res = await initiate({ email: currentEmail });
      if (res?.success) {
        router.push('/kyc/verify-otp');
      } else {
        showErrorMessage({
          type: getErrorType(res?.error),
          title: 'Failed to Send Code',
          message: res?.message || 'Failed to send verification code. Please try again.',
          autoHide: true,
          duration: 4000,
          dismissible: true,
        });
      }
    } catch {
      showErrorMessage({
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to send verification code. Check your connection and try again.',
        autoHide: true,
        duration: 4000,
        dismissible: true,
      });
    }
  };

  const showInlineError = Boolean(initError) && !showErrorDisplay;

  return (
    <SafeAreaView style={styles.container}>
      {/* Error banners */}
      {showErrorDisplay && errorDisplayData && (
        <ErrorDisplay
          type={errorDisplayData.type}
          title={errorDisplayData.title}
          message={errorDisplayData.message}
          errorAction={errorDisplayData.errorAction}
          onActionPress={errorDisplayData.onActionPress}
          autoHide={errorDisplayData.autoHide !== false}
          duration={errorDisplayData.duration || 4000}
          dismissible={errorDisplayData.dismissible !== false}
          onDismiss={hideErrorDisplay}
        />
      )}
      {showInlineError && (
        <ErrorDisplay
          type="general"
          title="Email Verification"
          message={String(initError)}
          autoHide
          duration={4000}
          dismissible
          onDismiss={hideErrorDisplay}
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
            <Text style={styles.headerTitle}>Verify Email</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        {/* Copy */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>We will send an OTP to:</Text>

          {/* Plain email text (no white background) */}
          <View style={styles.emailRow}>
            {profileLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>Loading…</Text>
              </View>
            ) : (
              <Text style={styles.emailText}>
                {currentEmail || 'No email on file'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push('/kyc/change-email')}
            activeOpacity={0.7}
            testID="changeEmailLink"
          >
            <Text style={styles.linkBtnText}>Change Email Address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {/* Send OTP */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendButton, (initiating || !hasValidEmail) && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={initiating || !hasValidEmail}
            activeOpacity={0.7}
            testID="sendOtpButton"
          >
            <Text style={styles.sendButtonText}>{initiating ? 'Sending…' : 'Send OTP'}</Text>
          </TouchableOpacity>

          {!hasValidEmail && !profileLoading && (
            <Text style={styles.helperText}>
              {currentEmail ? 'Email looks invalid. Update it first.' : 'Add an email to continue.'}
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

  // Plain email line (no background)
  emailRow: {
    marginTop: Layout.spacing.md,
    alignItems: 'center',
  },
  emailText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: Colors.text.secondary },

  linkBtn: { marginTop: Layout.spacing.sm },
  linkBtnText: { color: Colors.primary, fontWeight: '600' },

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
