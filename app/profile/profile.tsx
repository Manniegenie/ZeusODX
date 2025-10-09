import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  AppState,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useUserProfile } from '../../hooks/useProfile';
import { useBiometricAuth } from '../../hooks/usebiometric';
import useLogout from '../../hooks/useLogout';
import { useNotifications } from '../../hooks/usenotification';
import { authService } from '../../services/authService';

import DeleteAccountModal from '../../components/DeleteAccount';

import backIcon from '../../components/icons/backy.png';
import profileAvatarIcon from '../../components/icons/profile-avatar.png';
import chevronRightIcon from '../../components/icons/chevron-right.png';
import personalDetailsIcon from '../../components/icons/personal-details.png';
import referEarnIcon from '../../components/icons/refer-earn.png';
import notificationIcon from '../../components/icons/notification.png';
import bankDetailsIcon from '../../components/icons/bank-details.png';
import twoFAIcon from '../../components/icons/2FA.png';
import pinIcon from '../../components/icons/pin.png';
import fingerprintIcon from '../../components/icons/fingerprint.png';
import kycIcon from '../../components/icons/kyc.png';
import logoutIcon from '../../components/icons/logout.png';
import deleteIcon from '../../components/icons/delete.png';

const BiometricModal = ({ visible, onClose, config }) => {
  if (!config) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>{config.title}</Text>
          <Text style={modalStyles.message}>{config.message}</Text>
          
          <View style={modalStyles.buttonContainer}>
            {config.cancelText && (
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={onClose}
              >
                <Text style={modalStyles.cancelButtonText}>{config.cancelText}</Text>
              </TouchableOpacity>
            )}
            
            {config.confirmText && (
              <TouchableOpacity
                style={[
                  modalStyles.button,
                  modalStyles.confirmButton,
                  config.isDestructive && modalStyles.destructiveButton
                ]}
                onPress={() => {
                  onClose();
                  if (config.onConfirm) config.onConfirm();
                }}
              >
                <Text style={[
                  modalStyles.confirmButtonText,
                  config.isDestructive && modalStyles.destructiveButtonText
                ]}>
                  {config.confirmText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    onError: (e) => Alert.alert('Logout failed', e?.message || 'Could not log out.'),
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
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [biometricModalConfig, setBiometricModalConfig] = useState(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  useEffect(() => {
    setNotificationEnabled(isNotificationEnabled);
  }, [isNotificationEnabled]);

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

    return () => {
      subscription.remove();
    };
  }, [isEnrolled]);

  const showBiometricInfo = (config) => {
    setBiometricModalConfig(config);
    setShowBiometricModal(true);
  };

  const closeBiometricModal = () => {
    setShowBiometricModal(false);
    setBiometricModalConfig(null);
  };

  const handleGoBack = () => {
    if (isAnyOperationInProgress) return;
    router.replace('/user/dashboard');
  };

  const handlePersonalDetails = () => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/personal-details');
  };

  const handleReferEarn = () => {
    if (isAnyOperationInProgress) return;
    router.push('/profile/refer-earn');
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

  const handle2FAToggle = (value) => {
    if (isAnyOperationInProgress) return;
    if (value) router.push('/profile/2FA');
  };

  const handleDeleteAccount = () => {
    if (isAnyOperationInProgress) return;
    setShowDeleteModal(true);
  };

  const handleNotificationToggle = async (value) => {
    if (isAnyOperationInProgress) return;

    if (value) {
      const result = await enableNotifications();
      
      if (result.success) {
        showBiometricInfo({
          title: 'Notifications Enabled',
          message: 'You will now receive notifications.',
          confirmText: 'OK',
        });
      } else {
        showBiometricInfo({
          title: 'Unable to Enable Notifications',
          message: result.message || 'Please enable notifications in Settings.',
          cancelText: 'Cancel',
          confirmText: 'Open Settings',
          onConfirm: openNotificationSettings,
        });
      }
    } else {
      showBiometricInfo({
        title: 'Disable Notifications',
        message: 'To disable notifications, please turn them off in your device Settings.',
        cancelText: 'Cancel',
        confirmText: 'Open Settings',
        onConfirm: openNotificationSettings,
      });
    }
  };

  const handleBiometricToggle = async (value) => {
    if (isAnyOperationInProgress || isBiometricLoading) return;

    if (!isBiometricSupported) {
      showBiometricInfo({
        title: 'Not Supported',
        message: 'Biometric authentication is not supported on this device.',
        confirmText: 'OK',
      });
      return;
    }

    if (value) {
      if (!isEnrolled) {
        const biometricType = getBiometricTypeName();
        const instructions = getSetupInstructions();
        showBiometricInfo({
          title: 'Biometric Setup Required',
          message: `${biometricType} is not set up on your device.\n\n${instructions}\n\nWould you like to open Settings?`,
          cancelText: 'Cancel',
          confirmText: 'Open Settings',
          onConfirm: async () => {
            const opened = await openBiometricSettings();
            if (!opened) {
              showBiometricInfo({
                title: 'Settings',
                message: `Please open Settings manually to set up ${biometricType}.`,
                confirmText: 'OK',
              });
            }
          },
        });
        return;
      }

      const biometricType = getBiometricTypeName();
      showBiometricInfo({
        title: `Enable ${biometricType} Login`,
        message: `To enable ${biometricType} authentication, you need to log in with your PIN. You will be logged out and can enable it on your next login.`,
        cancelText: 'Cancel',
        confirmText: 'Log Out & Enable',
        onConfirm: async () => {
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
            showBiometricInfo({
              title: 'Logout Failed',
              message: 'Please try again.',
              confirmText: 'OK',
            });
          }
        },
      });
    } else {
      const biometricType = getBiometricTypeName();
      const wasEnabled = fingerprintEnabled;
      
      console.log('🔐 [Biometric] Starting disable process, current state:', wasEnabled);
      
      setIsBiometricLoading(true);
      
      try {
        console.log('🔐 [Biometric] Requesting authentication...');
        
        const authResult = await authenticate({
          promptMessage: `Authenticate to disable ${biometricType} login`,
        });

        console.log('🔐 [Biometric] Auth result:', authResult);

        if (authResult.success) {
          console.log('✅ [Biometric] Authentication successful');
          
          try {
            const clearResult = await authService.clearBiometricPin();
            
            if (!clearResult.success) {
              console.error('❌ [Biometric] Failed to clear PIN:', clearResult.error);
              throw new Error(clearResult.error || 'Failed to clear biometric PIN');
            }
            
            console.log('✅ [Biometric] PIN cleared from secure store');
            
            const stillHasPin = await authService.hasBiometricPin();
            
            if (stillHasPin) {
              console.error('❌ [Biometric] PIN still exists after clearing!');
              throw new Error('Failed to clear biometric PIN');
            }
            
            console.log('✅ [Biometric] Verified PIN is cleared');
            
            setFingerprintEnabled(false);
            
            showBiometricInfo({
              title: 'Success',
              message: `${biometricType} login has been disabled.`,
              confirmText: 'OK',
            });
          } catch (clearError) {
            console.error('❌ [Biometric] Error clearing PIN:', clearError);
            
            setFingerprintEnabled(wasEnabled);
            
            showBiometricInfo({
              title: 'Error',
              message: 'Failed to disable biometric login. Please try again.',
              confirmText: 'OK',
            });
          }
        } else {
          console.log('❌ [Biometric] Authentication failed or cancelled');
          
          setFingerprintEnabled(wasEnabled);
          
          if (authResult.error && !authResult.error.toLowerCase().includes('cancel')) {
            showBiometricInfo({
              title: 'Authentication Failed',
              message: 'Could not verify your identity. Please try again.',
              confirmText: 'OK',
            });
          }
        }
      } catch (error) {
        console.error('❌ [Biometric] Unexpected error:', error);
        
        setFingerprintEnabled(wasEnabled);
        
        showBiometricInfo({
          title: 'Error',
          message: 'An error occurred. Please try again.',
          confirmText: 'OK',
        });
      } finally {
        setIsBiometricLoading(false);
        console.log('🔐 [Biometric] Process complete');
      }
    }
  };

  const getBiometricOption = () => ({
    id: 'biometrics',
    title: 'Biometrics',
    iconSrc: fingerprintIcon,
    hasToggle: true,
    toggleValue: fingerprintEnabled && isEnrolled,
    onToggle: handleBiometricToggle,
  });

  const confirmAndLogout = () => {
    if (isAnyOperationInProgress) return;

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  };

  const userData = {
    name: displayName || '-',
    email: profile?.email || '-',
    phone: profile?.phoneNumber || '-',
    avatar: hasAvatar ? { uri: avatarUrl } : profileAvatarIcon,
  };

  const profileSections = [
    {
      id: 'profile',
      title: 'Profile',
      options: [
        { id: 'personal-details', title: 'Personal Details', iconSrc: personalDetailsIcon, hasChevron: true, onPress: handlePersonalDetails },
        { id: 'refer-earn', title: 'Refer & earn', iconSrc: referEarnIcon, hasChevron: true, onPress: handleReferEarn },
        {
          id: 'notification',
          title: 'Notification',
          iconSrc: notificationIcon,
          hasToggle: true,
          toggleValue: notificationEnabled,
          onToggle: handleNotificationToggle,
        },
      ],
    },
    {
      id: 'account',
      title: 'Account',
      options: [
        { id: 'bank-details', title: 'Bank Details', iconSrc: bankDetailsIcon, hasChevron: true, onPress: handleBankDetails },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      options: [
        { id: '2fa', title: '2FA (Two Factor Authentication)', iconSrc: twoFAIcon, hasToggle: true, toggleValue: profile?.is2FAEnabled, onToggle: handle2FAToggle },
        { id: 'reset-pin', title: 'Reset PIN', iconSrc: pinIcon, hasChevron: true, onPress: handleResetPin },
        getBiometricOption(),
      ],
    },
    {
      id: 'other',
      options: [
        { id: 'update-kyc', title: 'Update KYC', iconSrc: kycIcon, hasChevron: true, onPress: handleUpdateKYC },
      ],
    },
    {
      id: 'actions',
      options: [
        { id: 'logout', title: loggingOut ? 'Logging out…' : 'Log Out', iconSrc: logoutIcon, onPress: confirmAndLogout, isDestructive: true },
        { id: 'delete-account', title: 'Delete account', iconSrc: deleteIcon, isDestructive: true, onPress: handleDeleteAccount },
      ],
    },
  ];

  const renderProfileOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionContainer, 
        (isAnyOperationInProgress || isBiometricLoading) && styles.optionContainerDisabled
      ]}
      onPress={option.onPress}
      activeOpacity={(isAnyOperationInProgress || isBiometricLoading) ? 1 : 0.7}
      disabled={isAnyOperationInProgress || isBiometricLoading}
    >
      <View style={styles.optionContent}>
        <Image 
          source={option.iconSrc} 
          style={[
            styles.optionIcon, 
            (isAnyOperationInProgress || isBiometricLoading) && styles.optionIconDisabled
          ]} 
        />
        <Text
          style={[
            styles.optionTitle,
            option.isDestructive && styles.optionTitleDestructive,
            (isAnyOperationInProgress || isBiometricLoading) && styles.optionTitleDisabled,
          ]}
        >
          {option.title}
        </Text>
      </View>

      <View style={styles.optionAction}>
        {option.hasToggle && (
          <Switch
            value={option.toggleValue}
            onValueChange={option.onToggle}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
            disabled={isAnyOperationInProgress || isBiometricLoading}
            style={(isAnyOperationInProgress || isBiometricLoading) ? { opacity: 0.5 } : {}}
          />
        )}
        {option.hasChevron && (
          <Image
            source={chevronRightIcon}
            style={[
              styles.chevronIcon, 
              (isAnyOperationInProgress || isBiometricLoading) && styles.chevronIconDisabled
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProfileSection = (section) => (
    <View key={section.id} style={styles.section}>
      {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
      <View style={styles.sectionContent}>
        {section.options.map((option, index) => (
          <View key={option.id}>
            {renderProfileOption(option)}
            {index < section.options.length - 1 && <View style={styles.optionSeparator} />}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#35297F" barStyle="light-content" />

        <View style={[
          styles.headerSection, 
          (isAnyOperationInProgress || isBiometricLoading) && styles.headerSectionDisabled
        ]}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={(isAnyOperationInProgress || isBiometricLoading) ? 1 : 0.7}
              disabled={isAnyOperationInProgress || isBiometricLoading}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.userProfileContainer}>
            <View style={styles.avatarContainer}>
              <Image source={userData.avatar} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.userPhone}>{userData.phone}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!(isAnyOperationInProgress || isBiometricLoading)}
        >
          {profileSections.map(renderProfileSection)}
        </ScrollView>
      </SafeAreaView>

      <BiometricModal 
        visible={showBiometricModal}
        onClose={closeBiometricModal}
        config={biometricModalConfig}
      />

      <DeleteAccountModal 
        visible={showDeleteModal && !(isAnyOperationInProgress || isBiometricLoading)} 
        onClose={() => setShowDeleteModal(false)} 
      />

      <BottomTabNavigator activeTab="profile" />
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: Typography.bold || 'System',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text?.primary || '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text?.secondary || '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: Colors.primary || '#35297F',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text?.primary || '#111827',
  },
  confirmButtonText: {
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  scrollContent: { paddingBottom: 80 },

  headerSection: { backgroundColor: '#35297F', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  headerSectionDisabled: { opacity: 0.7 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backIcon: { width: 24, height: 24, resizeMode: 'contain', tintColor: '#FFFFFF' },

  userProfileContainer: { alignItems: 'center' },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, resizeMode: 'cover' },
  userName: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600', marginBottom: 3 },
  userEmail: { color: '#E5E7EB', fontFamily: Typography.regular || 'System', fontSize: 13, fontWeight: '400', marginBottom: 2 },
  userPhone: { color: '#E5E7EB', fontFamily: Typography.regular || 'System', fontSize: 13, fontWeight: '400' },

  section: { marginBottom: 16 },
  sectionTitle: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.medium || 'System', fontSize: 13, fontWeight: '500', marginBottom: 8, marginLeft: 16, marginTop: 6 },
  sectionContent: { backgroundColor: Colors.surface || '#FFFFFF', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  optionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface || '#FFFFFF' },
  optionContainerDisabled: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIcon: { width: 20, height: 20, marginRight: 12, resizeMode: 'contain' },
  optionIconDisabled: { opacity: 0.5 },
  optionTitle: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 15, fontWeight: '400', flex: 1 },
  optionTitleDestructive: { color: '#EF4444' },
  optionTitleDisabled: { color: '#9CA3AF' },
  optionAction: { flexDirection: 'row', alignItems: 'center' },
  chevronIcon: { width: 14, height: 14, resizeMode: 'contain', tintColor: Colors.text?.secondary || '#9CA3AF' },
  chevronIconDisabled: { opacity: 0.5 },
  optionSeparator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 },
});

export default ProfileScreen;