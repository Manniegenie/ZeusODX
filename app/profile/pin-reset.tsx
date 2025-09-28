// app/profile/pin-reset-send.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import useResetPin from '../../hooks/useResetPin';
import ErrorDisplay from '../../components/ErrorDisplay';

// Type definitions for ErrorDisplay
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

// use same back icon as other screens
import backIcon from '../../components/icons/backy.png';

export default function PinResetSendScreen() {
  const router = useRouter();
  const { initiate, initiating } = useResetPin();
  
  // Error display state
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  const handleBackPress = () => {
    if (!initiating) router.back();
  };

  // Helper functions for error handling
  const showErrorMessage = (errorData: ErrorDisplayData): void => {
    setErrorDisplayData(errorData);
    setShowErrorDisplay(true);
  };

  const hideErrorDisplay = (): void => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  const getErrorType = (errorCode?: string): ErrorDisplayData['type'] => {
    if (!errorCode) return 'general';
    
    switch (errorCode.toUpperCase()) {
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
    // Clear any existing errors
    hideErrorDisplay();
    
    try {
      const res = await initiate();
      if (res && res.success === true) {
        // IMPORTANT: route name must match the file EXACTLY: app/profile/verify-otp.tsx
        router.push('/profile/verify-otp');
      } else {
        // Use ErrorDisplay instead of simple error banner
        const errorType = getErrorType(res?.errorCode);
        
        showErrorMessage({
          type: errorType,
          title: 'Failed to Send Code',
          message: res?.message || 'Failed to send verification code. Please try again.',
          autoHide: true,
          duration: 4000,
          dismissible: true
        });
      }
    } catch (error) {
      // Handle network/connection errors
      showErrorMessage({
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to send verification code. Please check your connection and try again.',
        autoHide: true,
        duration: 4000,
        dismissible: true
      });
    }
  };

  const backDisabled = Boolean(initiating);

  return (
    <SafeAreaView style={styles.container}>
      {/* Error Display */}
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

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={backDisabled ? 1 : 0.7}
              disabled={backDisabled}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>

            {/* Centered title (absolute positioned) */}
            <Text style={styles.headerTitle}>Reset PIN</Text>

            <View style={styles.emptySpace} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.subtitle}>We'll send a verification code to your registered email address.</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendButton, initiating && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={initiating}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>{initiating ? 'Sending…' : 'Send Verification Code'}</Text>
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
  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.lg, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Layout.spacing.md, lineHeight: 20 },
  spacer: { flex: 1 },
  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg },
  sendButton: { backgroundColor: Colors.primary, paddingVertical: Layout.spacing.md, borderRadius: Layout.borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  sendButtonText: { ...Typography.styles.bodyMedium, color: Colors.surface, fontWeight: '600' },
});
