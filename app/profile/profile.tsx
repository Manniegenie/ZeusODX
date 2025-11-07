import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    AppState,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import { use2FA } from '../../hooks/use2FA';
import { useBiometricAuth } from '../../hooks/usebiometric';
import useLogout from '../../hooks/useLogout';
import { useNotifications } from '../../hooks/usenotification';
import { useUserProfile } from '../../hooks/useProfile';
import { authService } from '../../services/authService';

import TwoFactorAuthModal from '../../components/2FA';
import DeleteAccountModal from '../../components/DeleteAccount';
import ErrorDisplay from '../../components/ErrorDisplay';
import LogoutModal from '../../components/LogoutModal';

import twoFAIcon from '../../components/icons/2FA.png';
import backIcon from '../../components/icons/backy.png';
import bankDetailsIcon from '../../components/icons/bank-details.png';
import chevronRightIcon from '../../components/icons/chevron-right.png';
import deleteIcon from '../../components/icons/delete.png';
import fingerprintIcon from '../../components/icons/fingerprint.png';
import kycIcon from '../../components/icons/kyc.png';
import logoutIcon from '../../components/icons/logout.png';
import notificationIcon from '../../components/icons/notification.png';
import personalDetailsIcon from '../../components/icons/personal-details.png';
import pinIcon from '../../components/icons/pin.png';
import profileAvatarIcon from '../../components/icons/profile-avatar.png';

const ProfileScreen = () => {
  const router = useRouter();

  const {
    profile,
    loading: isProfileLoading,
    displayName,
    avatarUrl,
    hasAvatar,
    refetch,
  } = useUserProfile({ auto: true });

  const { logout, loggingOut } = useLogout({
    clearStorage: async () => {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
    },
    onSuccess: () => router.replace('/login/login-phone'),
    onError: (e) => showError('general', 'Logout Failed', e?.message || 'Could not log out. Please try again.'),
  });

  const { 
    isBiometricSupported, 
    isEnrolled, 
    getBiometricTypeName, 
    openBiometricSettings, 
    getSetupInstructions,
    authenticate 
  } = useBiometricAuth();

  const { 
    isEnabled: isNotificationEnabled, 
    isLoading: isNotificationLoading,
    enable: enableNotifications,
    openSettings: openNotificationSettings,
  } = useNotifications();

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: string; onConfirm: (() => void) | null }>({ 
    title: '', 
    message: '', 
    onConfirm: null 
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  
  const { disable2FA, loading: is2FADisabling } = use2FA();

  // ErrorDisplay state
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<{
    type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
    title?: string;
    message?: string;
  } | null>(null);

  const showError = (type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance', title: string, message: string) => {
    setErrorDisplayData({ type, title, message });
    setShowErrorDisplay(true);
  };

  const hideError = () => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  useEffect(() => {
    setNotificationEnabled(isNotificationEnabled);
  }, [isNotificationEnabled]);

  useEffect(() => {
    if ((profile as any)?.is2FAEnabled !== undefined) {
      setTwoFAEnabled((profile as any).is2FAEnabled);
    }
  }, [(profile as any)?.is2FAEnabled]);

  const isAnyOperationInProgress = loggingOut || isNotificationLoading || isProfileLoading || isBiometricLoading;

  useEffect(() => {
    const loadBiometricState = async () => {
      try {
        const hasPinStored = await authService.hasBiometricPin();
        setFingerprintEnabled(hasPinStored && isEnrolled);
      } catch (error) {
        console.error('Failed to load biometric state:', error);
        setFingerprintEnabled(false);
      }
    };
    loadBiometricState();
  }, [isEnrolled]);

  useEffect(() => {
    if (!isEnrolled) {
      setFingerprintEnabled(false);
    }
  }, [isEnrolled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const hasPinStored = await authService.hasBiometricPin();
        setFingerprintEnabled(hasPinStored && isEnrolled);
      }
    });
    return () => subscription.remove();
  }, [isEnrolled]);

  useFocusEffect(
    React.useCallback(() => {
      if (refetch) {
        refetch();
      }
    }, [refetch])
  );

  const showInfo = (title: string, message: string, onConfirm: (() => void) | null = null) => {
    setInfoModalContent({ title, message, onConfirm });
    setShowInfoModal(true);
  };

  const closeInfoModal = () => {
    setShowInfoModal(false);
    setInfoModalContent({ title: '', message: '', onConfirm: null as (() => void) | null });
  };

  const handleGoBack = () => {
    if (isAnyOperationInProgress) return;
    router.replace('/user/dashboard');
  };

  const handlePersonalDetails = () => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/personal-details');
  };

  const handleBankDetails = () => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/bank-details');
  };

  const handleResetPin = () => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/pin-reset');
  };

  const handleUpdateKYC = () => {
    if (isAnyOperationInProgress) return;
    router.push('/kyc/kyc-upgrade');
  };

  const handle2FAToggle = (value: boolean) => {
    if (isAnyOperationInProgress) return;
    if (value) {
      // Enable 2FA - navigate to setup screen
      setTwoFAEnabled(value);
      router.push('/profile/2FA');
    } else {
      // Disable 2FA - show verification modal
      setShow2FADisableModal(true);
    }
  };

  const handle2FADisableSubmit = async (code: string) => {
    try {
      const result = await disable2FA(code);
      
      if (result && (result as any).success) {
        setTwoFAEnabled(false);
        setShow2FADisableModal(false);
        showInfo('2FA Disabled', 'Two-factor authentication has been successfully disabled.');
        // Refresh profile to get updated 2FA status
        refetch();
      } else {
        const errorMessage = (result as any)?.message || 'Invalid 2FA code. Please try again.';
        const errorType = errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection') 
          ? 'network' 
          : errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('code')
          ? 'validation'
          : 'general';
        showError(errorType, 'Verification Failed', errorMessage);
      }
    } catch (error) {
      showError('network', 'Error', 'An error occurred while disabling 2FA. Please check your connection and try again.');
    }
  };

  const handle2FADisableClose = () => {
    if (!is2FADisabling) {
      setShow2FADisableModal(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isAnyOperationInProgress) return;
    setShowDeleteModal(true);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (isAnyOperationInProgress) return;

    if (value) {
      const result = await enableNotifications();
      if (result && result.success) {
        showInfo('Notifications Enabled', 'You will now receive notifications.');
      } else {
        showInfo(
          'Unable to Enable Notifications',
          (result && result.message) || 'Please enable notifications in Settings.',
          openNotificationSettings as (() => void) | null
        );
      }
    } else {
      showInfo(
        'Disable Notifications',
        'To disable notifications, please turn them off in your device Settings.',
        openNotificationSettings as (() => void) | null
      );
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (isAnyOperationInProgress || isBiometricLoading) return;

    if (!isBiometricSupported) {
      showInfo('Not Supported', 'Biometric authentication is not supported on this device.');
      return;
    }

    if (value) {
      if (!isEnrolled) {
        const biometricType = getBiometricTypeName();
        const instructions = getSetupInstructions();
        showInfo(
          'Biometric Setup Required',
          `${biometricType} is not set up on your device.\n\n${instructions}\n\nWould you like to open Settings?`,
          openBiometricSettings as (() => void) | null
        );
        return;
      }

      const biometricType = getBiometricTypeName();
      showInfo(
        `Enable ${biometricType} Login`,
        `To enable ${biometricType} authentication, you need to log in with your PIN. You will be logged out and can enable it on your next login.`,
        (async () => {
          try {
            const [userId, refreshToken] = await Promise.all([
              SecureStore.getItemAsync('userId'),
              SecureStore.getItemAsync('refreshToken'),
            ]);
            if (userId && refreshToken) {
              await logout({ userId, refreshToken });
            } else {
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              await SecureStore.deleteItemAsync('userId');
              router.replace('/login/login-phone');
            }
            } catch (error) {
              console.error('Logout error:', error);
              showError('general', 'Logout Failed', 'Please try again.');
            }
        }) as (() => void) | null
      );
    } else {
      const biometricType = getBiometricTypeName();
      const wasEnabled = fingerprintEnabled;
      
      setIsBiometricLoading(true);
      
      try {
        const authResult = await authenticate({
          promptMessage: `Authenticate to disable ${biometricType} login`,
        });

        if (authResult.success) {
          try {
            const clearResult: any = await authService.clearBiometricPin();
            if (!clearResult || !clearResult.success) {
              throw new Error((clearResult && clearResult.error) || 'Failed to clear biometric PIN');
            }
            
            const stillHasPin = await authService.hasBiometricPin();
            if (stillHasPin) {
              throw new Error('Failed to clear biometric PIN');
            }
            
            setFingerprintEnabled(false);
            showInfo('Success', `${biometricType} login has been disabled.`);
          } catch (clearError) {
            console.error('Error clearing PIN:', clearError);
            setFingerprintEnabled(wasEnabled);
            const errorMessage = (clearError as any)?.message || 'Failed to disable biometric login. Please try again.';
            const errorType = errorMessage.toLowerCase().includes('network') ? 'network' : 'general';
            showError(errorType, 'Error', errorMessage);
          }
        } else {
          setFingerprintEnabled(wasEnabled);
          if (authResult.error && !authResult.error.toLowerCase().includes('cancel')) {
            showError('auth', 'Authentication Failed', 'Could not verify your identity. Please try again.');
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setFingerprintEnabled(wasEnabled);
        showError('general', 'Error', 'An error occurred. Please try again.');
      } finally {
        setIsBiometricLoading(false);
      }
    }
  };

  const handleLogout = () => {
    if (isAnyOperationInProgress) return;
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const [userId, refreshToken] = await Promise.all([
        SecureStore.getItemAsync('userId'),
        SecureStore.getItemAsync('refreshToken'),
      ]);
      if (userId && refreshToken) {
        await logout({ userId, refreshToken });
      } else {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userId');
        router.replace('/login/login-phone');
      }
    } catch {
      Alert.alert('Logout failed', 'Please check your connection.');
    }
  };

  const userData = {
    name: displayName || '-',
    email: (profile as any)?.email || '-',
    phone: (profile as any)?.phoneNumber || '-',
    avatar: hasAvatar ? { uri: avatarUrl } : profileAvatarIcon,
  };

  // Simplified profile options array
  const profileOptions = [
    { id: 'personal-details', title: 'Personal Details', icon: personalDetailsIcon, onPress: handlePersonalDetails, hasChevron: true },
    { id: 'notification', title: 'Notification', icon: notificationIcon, hasToggle: true, toggleValue: notificationEnabled, onToggle: handleNotificationToggle },
    { id: 'bank-details', title: 'Bank Details', icon: bankDetailsIcon, onPress: handleBankDetails, hasChevron: true },
    { id: '2fa', title: '2FA (Two Factor Authentication)', icon: twoFAIcon, hasToggle: true, toggleValue: twoFAEnabled, onToggle: handle2FAToggle },
    { id: 'reset-pin', title: 'Reset PIN', icon: pinIcon, onPress: handleResetPin, hasChevron: true },
    { id: 'biometrics', title: 'Biometrics', icon: fingerprintIcon, hasToggle: true, toggleValue: fingerprintEnabled && isEnrolled, onToggle: handleBiometricToggle },
    { id: 'update-kyc', title: 'Update KYC', icon: kycIcon, onPress: handleUpdateKYC, hasChevron: true },
    { id: 'logout', title: loggingOut ? 'Logging out…' : 'Log Out', icon: logoutIcon, onPress: handleLogout, isDestructive: true },
    { id: 'delete-account', title: 'Delete account', icon: deleteIcon, onPress: handleDeleteAccount, isDestructive: true },
  ];

  const renderOption = (option: any) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionRow, isAnyOperationInProgress && styles.optionRowDisabled]}
      onPress={option.onPress}
      activeOpacity={0.7}
      disabled={isAnyOperationInProgress}
    >
      <View style={styles.optionLeft}>
        <Image source={option.icon} style={styles.optionIcon} />
        <Text style={[styles.optionText, option.isDestructive && styles.optionTextDestructive]}>
          {option.title}
        </Text>
      </View>
      
      <View style={styles.optionRight}>
        {option.hasToggle && (
          <Switch
            value={option.toggleValue}
            onValueChange={option.onToggle}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
            disabled={isAnyOperationInProgress}
          />
        )}
        {option.hasChevron && (
          <Image source={chevronRightIcon} style={styles.chevronIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#35297F" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            disabled={isAnyOperationInProgress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        {/* User Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image source={userData.avatar} style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <Text style={styles.userPhone}>{userData.phone}</Text>
        </View>

        {/* Options List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsContainer}>
            {profileOptions.map((option, index) => (
              <View key={option.id}>
                {renderOption(option)}
                {index < profileOptions.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeInfoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{infoModalContent.title}</Text>
            <Text style={styles.modalMessage}>{infoModalContent.message}</Text>
            <View style={styles.modalButtons}>
              {infoModalContent.onConfirm && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={closeInfoModal}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  if (infoModalContent.onConfirm) {
                    infoModalContent.onConfirm();
                  }
                  closeInfoModal();
                }}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {infoModalContent.onConfirm ? 'OK' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DeleteAccountModal 
        visible={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />

      <LogoutModal 
        visible={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        loading={loggingOut}
      />

      <TwoFactorAuthModal
        visible={show2FADisableModal}
        onClose={handle2FADisableClose}
        onSubmit={handle2FADisableSubmit}
        loading={is2FADisabling}
        title="Disable Two-Factor Authentication"
        subtitle="Enter your 6-digit 2FA code to disable two-factor authentication"
      />

      {showErrorDisplay && errorDisplayData && (
        <ErrorDisplay
          type={errorDisplayData.type}
          title={errorDisplayData.title}
          message={errorDisplayData.message}
          onDismiss={hideError}
          autoHide={true}
          duration={5000}
          dismissible={true}
        />
      )}

      <BottomTabNavigator activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#35297F',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#35297F',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  optionTextDestructive: {
    color: '#EF4444',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
    tintColor: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonConfirm: {
    backgroundColor: '#35297F',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
