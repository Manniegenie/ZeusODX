import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AppState,
    Image,
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

  // Profile data
  const {
    profile,
    loading: isProfileLoading,
    displayName,
    avatarUrl,
    hasAvatar,
    refetch,
  } = useUserProfile();

  // Logout
  const { logout, loggingOut } = useLogout({
    clearStorage: async () => {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
    },
    onSuccess: () => router.replace('/login/login-phone'),
    onError: (e) => showError('general', 'Logout Failed', e?.message || 'Could not log out. Please try again.'),
  });

  // Biometric auth
  const { 
    isBiometricSupported, 
    isEnrolled, 
    getBiometricTypeName, 
    openBiometricSettings, 
    getSetupInstructions,
    authenticate 
  } = useBiometricAuth();

  // Notifications
  const { 
    isEnabled: isNotificationEnabled, 
    isLoading: isNotificationLoading,
    requestPermission: requestNotificationPermission,
    openSettings: openNotificationSettings,
  } = useNotifications();

  // 2FA
  const { disable2FA, loading: is2FADisabling } = use2FA();

  // Local state
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<{
    type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
    title?: string;
    message?: string;
  } | null>(null);

  // Computed values
  const isAnyOperationInProgress = useMemo(() => 
    loggingOut || isNotificationLoading || isProfileLoading || isBiometricLoading,
    [loggingOut, isNotificationLoading, isProfileLoading, isBiometricLoading]
  );

  // Sync notification state
  useEffect(() => {
    setNotificationEnabled(isNotificationEnabled);
  }, [isNotificationEnabled]);

  // Sync 2FA state from profile
  useEffect(() => {
    if (profile?.is2FAEnabled !== undefined) {
      setTwoFAEnabled(profile.is2FAEnabled);
    }
  }, [profile?.is2FAEnabled]);

  // Load biometric state
  useEffect(() => {
    const loadBiometricState = async () => {
      try {
        const hasPinStored = await authService.hasBiometricPin();
        setFingerprintEnabled(hasPinStored && isEnrolled);
      } catch (error) {
        setFingerprintEnabled(false);
      }
    };
    
    if (isEnrolled) {
      loadBiometricState();
    } else {
      setFingerprintEnabled(false);
    }
  }, [isEnrolled]);

  // Listen to app state changes for biometric
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && isEnrolled) {
        try {
          const hasPinStored = await authService.hasBiometricPin();
          setFingerprintEnabled(hasPinStored && isEnrolled);
        } catch {
          setFingerprintEnabled(false);
        }
      }
    });
    return () => subscription.remove();
  }, [isEnrolled]);

  // Refetch profile when screen comes into focus (like dashboard)
  useFocusEffect(
    useCallback(() => {
      if (refetch) {
        refetch().catch(() => {
          // Silently handle refetch errors - they're logged in the service
        });
      }
    }, [refetch])
  );

  // Error handling
  const showError = useCallback((type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance', title: string, message: string) => {
    setErrorDisplayData({ type, title, message });
    setShowErrorDisplay(true);
  }, []);

  const hideError = useCallback(() => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  }, []);

  // Modal handlers - using Alert instead of modal overlay
  const showInfo = useCallback((title: string, message: string, onConfirm: (() => void) | null = null) => {
    Alert.alert(
      title,
      message,
      [
        ...(onConfirm ? [{
          text: 'Cancel',
          style: 'cancel' as const,
        }] : []),
        {
          text: 'OK',
          onPress: onConfirm || undefined,
        },
      ]
    );
  }, []);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    if (isAnyOperationInProgress) return;
    router.replace('/user/dashboard');
  }, [isAnyOperationInProgress, router]);

  const handlePersonalDetails = useCallback(() => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/personal-details');
  }, [isAnyOperationInProgress, router]);

  const handleBankDetails = useCallback(() => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/bank-details');
  }, [isAnyOperationInProgress, router]);

  const handleResetPin = useCallback(() => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/pin-reset');
  }, [isAnyOperationInProgress, router]);

  const handleUpdateKYC = useCallback(() => {
    if (isAnyOperationInProgress) return;
    router.push('/kyc/kyc-upgrade');
  }, [isAnyOperationInProgress, router]);

  // 2FA handlers
  const handle2FAToggle = useCallback((value: boolean) => {
    if (isAnyOperationInProgress) return;
    if (value) {
      setTwoFAEnabled(value);
      router.push('/profile/2FA');
    } else {
      setShow2FADisableModal(true);
    }
  }, [isAnyOperationInProgress, router]);

  const handle2FADisableSubmit = useCallback(async (code: string) => {
    try {
      const result = await disable2FA(code);
      
      if (result?.success) {
        setTwoFAEnabled(false);
        setShow2FADisableModal(false);
        showInfo('2FA Disabled', 'Two-factor authentication has been successfully disabled.');
        refetch();
      } else {
        const errorMessage = result?.message || 'Invalid 2FA code. Please try again.';
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
  }, [disable2FA, refetch, showError, showInfo]);

  const handle2FADisableClose = useCallback(() => {
    if (!is2FADisabling) {
      setShow2FADisableModal(false);
    }
  }, [is2FADisabling]);

  // Notification handlers
  const handleNotificationToggle = useCallback(async (value: boolean) => {
    if (isAnyOperationInProgress) return;

    if (value) {
      const result = await requestNotificationPermission();
      if (result?.success) {
        showInfo('Notifications Enabled', 'You will now receive notifications.');
      } else {
        showInfo(
          'Unable to Enable Notifications',
          result?.message || 'Please enable notifications in Settings.',
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
  }, [isAnyOperationInProgress, requestNotificationPermission, openNotificationSettings, showInfo]);

  // Biometric handlers
  const handleBiometricToggle = useCallback(async (value: boolean) => {
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
          } catch {
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
            if (!clearResult?.success) {
              throw new Error(clearResult?.error || 'Failed to clear biometric PIN');
            }
            
            const stillHasPin = await authService.hasBiometricPin();
            if (stillHasPin) {
              throw new Error('Failed to clear biometric PIN');
            }
            
            setFingerprintEnabled(false);
            showInfo('Success', `${biometricType} login has been disabled.`);
          } catch (clearError) {
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
        setFingerprintEnabled(wasEnabled);
        showError('general', 'Error', 'An error occurred. Please try again.');
      } finally {
        setIsBiometricLoading(false);
      }
    }
  }, [
    isAnyOperationInProgress,
    isBiometricLoading,
    isBiometricSupported,
    isEnrolled,
    fingerprintEnabled,
    getBiometricTypeName,
    getSetupInstructions,
    openBiometricSettings,
    showInfo,
    logout,
    router,
    authenticate,
    showError
  ]);

  // Logout handlers
  const handleLogout = useCallback(() => {
    if (isAnyOperationInProgress) return;
    setShowLogoutModal(true);
  }, [isAnyOperationInProgress]);

  const confirmLogout = useCallback(async () => {
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
  }, [logout, router]);

  // Delete account handler
  const handleDeleteAccount = useCallback(() => {
    if (isAnyOperationInProgress) return;
    setShowDeleteModal(true);
  }, [isAnyOperationInProgress]);

  // Profile data for display
  const userData = useMemo(() => ({
    name: displayName || '-',
    email: profile?.email || '-',
    phone: profile?.phoneNumber || '-',
    avatar: hasAvatar ? { uri: avatarUrl } : profileAvatarIcon,
  }), [displayName, profile?.email, profile?.phoneNumber, hasAvatar, avatarUrl]);

  // Profile options configuration
  const profileOptions = useMemo(() => [
    { id: 'personal-details', title: 'Personal Details', icon: personalDetailsIcon, onPress: handlePersonalDetails, hasChevron: true },
    { id: 'notification', title: 'Notification', icon: notificationIcon, hasToggle: true, toggleValue: notificationEnabled, onToggle: handleNotificationToggle },
    { id: 'bank-details', title: 'Bank Details', icon: bankDetailsIcon, onPress: handleBankDetails, hasChevron: true },
    { id: '2fa', title: '2FA (Two Factor Authentication)', icon: twoFAIcon, hasToggle: true, toggleValue: twoFAEnabled, onToggle: handle2FAToggle },
    { id: 'reset-pin', title: 'Reset PIN', icon: pinIcon, onPress: handleResetPin, hasChevron: true },
    { id: 'biometrics', title: 'Biometrics', icon: fingerprintIcon, hasToggle: true, toggleValue: fingerprintEnabled && isEnrolled, onToggle: handleBiometricToggle },
    { id: 'update-kyc', title: 'Update KYC', icon: kycIcon, onPress: handleUpdateKYC, hasChevron: true },
    { id: 'logout', title: loggingOut ? 'Logging out…' : 'Log Out', icon: logoutIcon, onPress: handleLogout, isDestructive: true },
    { id: 'delete-account', title: 'Delete account', icon: deleteIcon, onPress: handleDeleteAccount, isDestructive: true },
  ], [
    handlePersonalDetails,
    notificationEnabled,
    handleNotificationToggle,
    handleBankDetails,
    twoFAEnabled,
    handle2FAToggle,
    handleResetPin,
    fingerprintEnabled,
    isEnrolled,
    handleBiometricToggle,
    handleUpdateKYC,
    loggingOut,
    handleLogout,
    handleDeleteAccount
  ]);

  // Render option row
  const renderOption = useCallback((option: any) => (
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
  ), [isAnyOperationInProgress]);

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
});

export default ProfileScreen;
