// app/profile/profile.tsx
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

// Delete Account modal
import DeleteAccountModal from '../../components/DeleteAccount';

// Icons
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

  const { isBiometricSupported, isEnrolled, getBiometricTypeName, openBiometricSettings, getSetupInstructions } =
    useBiometricAuth();

  const { isPermissionGranted, isInitialized, turnOffNotifications, turnOnNotifications, isLoading: isNotificationLoading } =
    useNotifications();

  const isAnyOperationInProgress = loggingOut || isNotificationLoading || isProfileLoading;

  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(isEnrolled);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync notification toggle with actual permission status
  useEffect(() => {
    setNotificationEnabled(isPermissionGranted && isInitialized);
  }, [isPermissionGranted, isInitialized]);

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

    try {
      if (value) {
        const success = await turnOnNotifications();
        setNotificationEnabled(success);
        if (!success)
          Alert.alert('Unable to Enable Notifications', 'Please check device settings.');
      } else {
        const success = await turnOffNotifications();
        setNotificationEnabled(!success);
        if (!success) Alert.alert('Failed to disable notifications.');
      }
    } catch {
      setNotificationEnabled(!value);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (isAnyOperationInProgress) return;

    if (!isBiometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not supported on this device.');
      return;
    }

    if (!isEnrolled && value) {
      const biometricType = getBiometricTypeName();
      const instructions = getSetupInstructions();
      Alert.alert(
        'Biometric Setup Required',
        `${biometricType} not set up.\n\n${instructions}\n\nOpen Settings?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              const opened = await openBiometricSettings();
              if (!opened) Alert.alert('Settings', `Please open Settings to set up ${biometricType}.`);
            },
          },
        ]
      );
      return;
    }

    setFingerprintEnabled(value);
  };

  const getBiometricOption = () => ({
    id: 'biometrics',
    title: 'Biometrics',
    iconSrc: fingerprintIcon,
    hasToggle: true,
    toggleValue: isEnrolled && fingerprintEnabled,
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
      style={[styles.optionContainer, isAnyOperationInProgress && styles.optionContainerDisabled]}
      onPress={option.onPress}
      activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
      disabled={isAnyOperationInProgress}
    >
      <View style={styles.optionContent}>
        <Image source={option.iconSrc} style={[styles.optionIcon, isAnyOperationInProgress && styles.optionIconDisabled]} />
        <Text
          style={[
            styles.optionTitle,
            option.isDestructive && styles.optionTitleDestructive,
            isAnyOperationInProgress && styles.optionTitleDisabled,
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
            disabled={isAnyOperationInProgress}
            style={isAnyOperationInProgress ? { opacity: 0.5 } : {}}
          />
        )}
        {option.hasChevron && (
          <Image
            source={chevronRightIcon}
            style={[styles.chevronIcon, isAnyOperationInProgress && styles.chevronIconDisabled]}
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

        <View style={[styles.headerSection, isAnyOperationInProgress && styles.headerSectionDisabled]}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
              disabled={isAnyOperationInProgress}
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
          scrollEnabled={!isAnyOperationInProgress}
        >
          {profileSections.map(renderProfileSection)}
        </ScrollView>
      </SafeAreaView>

      <DeleteAccountModal visible={showDeleteModal && !isAnyOperationInProgress} onClose={() => setShowDeleteModal(false)} />

      <BottomTabNavigator activeTab="profile" />
    </View>
  );
};

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
