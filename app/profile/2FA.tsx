// app/user/2FA.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Clipboard,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import TwoFactorAuthModal from '../../components/2FA';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { use2FA } from '../../hooks/use2FA';

// Type definitions
interface QRCodeData {
  dataUrl: string;
  format: string;
  type: string;
}

interface TwoFAData {
  secretKey: string;
  qrCode?: QRCodeData | null;
  backupCodes?: string[];
  isEnabled: boolean;
}

interface ErrorDisplayData {
  type?: 'network' | 'server' | 'notFound' | 'general' | 'success';
  title?: string;
  message?: string;
  errorAction?: {
    title: string;
    message: string;
    actionText: string;
    route?: string;
    priority?: 'high' | 'medium' | 'low';
  };
  onActionPress?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

const copyIcon = require('../../components/icons/copy-icon.png');
const { width: screenWidth } = Dimensions.get('window');

const getHorizontalPadding = (): number => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  else return 28;
};

const horizontalPadding = getHorizontalPadding();

export default function TwoFASetupScreen() {
  const router = useRouter();
  const {
    loading,
    error,
    generate2FASecret,
    verify2FAToken,
    getCached2FAData,
    getErrorAction,
    clearErrors
  } = use2FA();

  const [twoFAData, setTwoFAData] = useState<TwoFAData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'notFound' | 'general' | 'success'>('general');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);

  useEffect(() => {
    const fetch2FAData = async (): Promise<void> => {
      const cachedData = getCached2FAData();
      if (cachedData) {
        setTwoFAData(cachedData);
      } else {
        await handleGenerate2FASecret();
      }
    };
    fetch2FAData();
  }, [getCached2FAData]);

  const handleGenerate2FASecret = async (): Promise<void> => {
    try {
      const result = await generate2FASecret();
      if (result.success) {
        setTwoFAData(result.data);
        setShowError(false);
      } else {
        showErrorMessage(result.error || 'Failed to generate 2FA secret');
      }
    } catch (error) {
      showErrorMessage('Network error occurred');
    }
  };

  const showErrorMessage = (messageOrData: string | ErrorDisplayData): void => {
    if (typeof messageOrData === 'string') {
      // Handle simple string messages
      let type: 'network' | 'server' | 'notFound' | 'general' | 'success' = 'general';
      if (messageOrData.includes('not found') || messageOrData.includes('not set up')) type = 'notFound';
      else if (messageOrData.includes('Network') || messageOrData.includes('connection')) type = 'network';
      else if (messageOrData.includes('Server') || messageOrData.includes('500')) type = 'server';
      
      setErrorType(type);
      setErrorMessage(messageOrData);
      setErrorDisplayData(null);
      setShowError(true);
    } else {
      // Handle ErrorDisplayData objects
      setErrorDisplayData(messageOrData);
      setErrorType(messageOrData.type || 'general');
      setErrorMessage(messageOrData.message || '');
      setShowError(true);
    }
  };

  const showSuccess = (message: string, title?: string, onComplete?: () => void): void => {
    showErrorMessage({
      type: 'success',
      title: title || 'Success!',
      message,
      autoHide: true,
      duration: 2500,
      dismissible: true
    });

    // Execute completion callback after success message duration
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 2500);
    }
  };

  const hideError = (): void => {
    setShowError(false);
    setErrorDisplayData(null);
  };

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await handleGenerate2FASecret();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const truncateSecret = (secret: string): string => {
    if (!secret || secret === 'Loading...') return secret;
    if (secret.length <= 20) return secret;
    return `${secret.slice(0, 10)}...${secret.slice(-10)}`;
  };

  const copySecretToClipboard = async (): Promise<void> => {
    if (!twoFAData?.secretKey) {
      showErrorMessage({
        type: 'general',
        title: 'Secret Not Available',
        message: '2FA secret key is not yet available',
        autoHide: true,
        duration: 3000
      });
      return;
    }
    
    try {
      await Clipboard.setString(twoFAData.secretKey);
      showSuccess('2FA secret key copied to clipboard', 'Copied!');
    } catch (error) {
      showErrorMessage({
        type: 'general',
        title: 'Copy Failed',
        message: 'Failed to copy secret key to clipboard',
        autoHide: true,
        duration: 3000
      });
    }
  };

  const handleContinueSetup = (): void => {
    setShowVerificationModal(true);
  };

  const handleVerificationModalClose = (): void => {
    setShowVerificationModal(false);
  };

  const handleVerificationSubmit = async (code: string): Promise<void> => {
    try {
      const result = await verify2FAToken(code);

      if (result.success) {
        // Close verification modal first
        setShowVerificationModal(false);
        
        // Show success message and navigate after delay
        showSuccess(
          '2FA has been enabled successfully. Your account is now more secure.',
          'Setup Complete!',
          () => {
            router.replace('/profile/profile');
          }
        );
      } else {
        // Handle errors
        setShowVerificationModal(false);
        
        const errorAction = getErrorAction?.(result.requiresAction);
        const errorType = getErrorType(result.error || 'GENERAL_ERROR');
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            errorAction: errorAction,
            onActionPress: () => {
              if (errorAction.route) {
                router.push(errorAction.route);
              } else {
                // Handle retry scenarios
                if (result.requiresAction === 'RETRY_TOKEN') {
                  setShowVerificationModal(true);
                }
              }
            },
            autoHide: false,
            dismissible: true
          });
        } else {
          showErrorMessage({
            type: errorType,
            title: 'Verification Failed',
            message: result.message || 'Something went wrong. Please try again.',
            autoHide: true,
            duration: 4000
          });
        }
      }
    } catch (error) {
      setShowVerificationModal(false);
      showErrorMessage({
        type: 'server',
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        autoHide: true,
        duration: 4000
      });
    }
  };

  const getErrorType = (errorCode: string): 'network' | 'server' | 'notFound' | 'general' => {
    switch (errorCode) {
      case 'INVALID_2FA_TOKEN':
      case 'INVALID_TOKEN_FORMAT':
        return 'general';
      case 'SETUP_NOT_COMPLETED':
      case 'USER_NOT_FOUND':
        return 'notFound';
      case 'NETWORK_ERROR':
        return 'network';
      case 'SERVICE_ERROR':
        return 'server';
      default:
        return 'general';
    }
  };

  const isLoading = loading;
  const secretError = error;
  const displaySecret = twoFAData?.secretKey || 'Loading...';
  const qrCodeData = twoFAData?.qrCode?.dataUrl;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {showError && (
          <ErrorDisplay 
            type={errorType} 
            title={errorDisplayData?.title}
            message={errorMessage || errorDisplayData?.message}
            errorAction={errorDisplayData?.errorAction}
            onActionPress={errorDisplayData?.onActionPress}
            autoHide={errorDisplayData?.autoHide !== false}
            duration={errorDisplayData?.duration || 4000}
            dismissible={errorDisplayData?.dismissible !== false}
            onDismiss={hideError} 
          />
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerGroup}>
              <Text style={styles.headerTitle}>2FA Setup</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>Scan the QR code with your authenticator app</Text>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Generating 2FA secret...</Text>
                </View>
              ) : qrCodeData ? (
                <Image source={{ uri: qrCodeData }} style={styles.qrCodeImage} resizeMode="contain" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.noQrText}>QR Code Unavailable</Text>
                  <Text style={styles.placeholderText}>Secret key available below</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.secretSection}>
            <Text style={styles.sectionLabel}>Secret Key</Text>
            <View style={styles.secretContainer}>
              <Text style={styles.secretText}>{truncateSecret(displaySecret)}</Text>
              <TouchableOpacity
                style={[styles.copyButton, !twoFAData?.secretKey && styles.copyButtonDisabled]}
                onPress={copySecretToClipboard}
                disabled={!twoFAData?.secretKey}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.secretHelper}>
              If you can't scan the QR code, manually enter this secret key into your authenticator app
            </Text>
          </View>

          {/* Continue Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !twoFAData?.secretKey && styles.continueButtonDisabled
              ]}
              onPress={handleContinueSetup}
              disabled={!twoFAData?.secretKey || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Processing...' : 'Continue Setup'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Setup Instructions</Text>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>1.</Text>
              <Text style={styles.stepText}>Install an authenticator app like Google Authenticator or Authy</Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>2.</Text>
              <Text style={styles.stepText}>Scan the QR code above or manually enter the secret key</Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>3.</Text>
              <Text style={styles.stepText}>Enter the 6-digit code from your app to complete setup</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabNavigator activeTab="profile" />

      {/* 2FA Verification Modal */}
      <TwoFactorAuthModal
        visible={showVerificationModal}
        onClose={handleVerificationModalClose}
        onSubmit={handleVerificationSubmit}
        loading={loading}
        title="Verify 2FA Setup"
        subtitle="Enter the 6-digit code from your authenticator app to complete setup"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 15,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  headerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
  },
  subtitleSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  qrSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 20,
    alignItems: 'center',
  },
  qrContainer: {
    width: Math.min(200, screenWidth * 0.5),
    height: Math.min(200, screenWidth * 0.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noQrText: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  secretSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
  },
  sectionLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 12,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
    marginBottom: 8,
  },
  secretText: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    marginRight: 12,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  copyButtonDisabled: {
    opacity: 0.5,
  },
  copyIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  secretHelper: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  instructionsSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
  },
  instructionsTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    color: Colors.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    width: 20,
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: '#35297F', // Purple color
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
  },
});