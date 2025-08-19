// app/profile/profile.tsx (or wherever this file lives)
import React, { useState } from 'react';
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
  ImageSourcePropType
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useDashboard } from '../../hooks/useDashboard';
import { useBiometricAuth } from '../../hooks/usebiometric';
import useLogout from '../../hooks/useLogout'; // 👈 use the hook

// Icons
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
import termsIcon from '../../components/icons/terms.png';
import privacyIcon from '../../components/icons/privacy.png';
import logoutIcon from '../../components/icons/logout.png';
import deleteIcon from '../../components/icons/delete.png';

interface ProfileOption {
  id: string;
  title: string;
  iconSrc: ImageSourcePropType;
  hasChevron?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  isDestructive?: boolean;
}

interface ProfileSection {
  id: string;
  title?: string;
  options: ProfileOption[];
}

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { firstname, lastname, email, phonenumber, is2FAEnabled } = useDashboard();

  // 🔐 Logout hook wiring
  const { logout, loggingOut } = useLogout({
    clearStorage: async () => {
      // Wipe local auth state
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
    },
    onSuccess: () => {
      // Only navigate when API says success
      router.replace('/login/login-phone');
    },
    onError: (e) => {
      Alert.alert('Logout failed', e?.message || 'Could not log out. Please try again.');
    },
  });

  // Biometric hook
  const {
    isBiometricSupported,
    isEnrolled,
    getBiometricTypeName,
    openBiometricSettings,
    getSetupInstructions
  } = useBiometricAuth();

  // Toggles
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState<boolean>(isEnrolled);

  // User card
  const userData = {
    name: `${firstname} ${lastname}`.trim() || '-',
    email: email || '-',
    phone: phonenumber || '-',
    avatar: profileAvatarIcon
  };

  // Always send back to dashboard
  const handleGoBack = (): void => {
    router.replace('/user/dashboard');
  };

  // Nav handlers
  const handlePersonalDetails = (): void => router.push('/profile/personal-details');
  const handleReferEarn = (): void => router.push('/profile/refer-earn');
  const handleBankDetails = (): void => router.push('/profile/bank-details');
  const handleResetPin = (): void => router.push('/profile/pin-reset');
  const handleUpdateKYC = (): void => router.push('/kyc/kyc-upgrade');
  const handleTermsConditions = (): void => router.push('/profile/terms-conditions');
  const handlePrivacyPolicy = (): void => router.push('/profile/privacy-policy');

  const handle2FAToggle = (value: boolean): void => {
    if (value) router.push('/profile/2FA');
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => router.replace('/auth/login'),
        }
      ]
    );
  };

  // Notification + Biometrics
  const handleNotificationToggle = (value: boolean): void => {
    setNotificationEnabled(value);
  };

  const handleFingerprintToggle = async (value: boolean): Promise<void> => {
    if (!isBiometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not supported on this device.', [{ text: 'OK' }]);
      return;
    }
    if (!isEnrolled && value) {
      const instructions = getSetupInstructions();
      Alert.alert(
        'Biometric Setup Required',
        `${instructions}\n\nWould you like to open Settings now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              const opened = await openBiometricSettings();
              if (!opened) {
                Alert.alert('Settings', 'Please open your device Settings and set up biometric authentication.', [{ text: 'OK' }]);
              }
            }
          }
        ]
      );
      return;
    }
    setFingerprintEnabled(value);
  };

  const getBiometricOption = (): ProfileOption => ({
    id: 'fingerprint',
    title: isBiometricSupported ? getBiometricTypeName() : 'Biometric',
    iconSrc: fingerprintIcon,
    hasToggle: true,
    toggleValue: isEnrolled && fingerprintEnabled,
    onToggle: handleFingerprintToggle,
  });

  // 🚪 Logout flow using the hook
  const confirmAndLogout = () => {
    if (loggingOut) return; // ignore double-taps
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: loggingOut ? 'Logging out…' : 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Pull credentials needed by the API
              const [userId, refreshToken] = await Promise.all([
                SecureStore.getItemAsync('userId'),
                SecureStore.getItemAsync('refreshToken'),
              ]);

              if (userId && refreshToken) {
                const res = await logout({ userId, refreshToken });
                // onSuccess/onError in the hook handle navigation & error UI
                if (!res?.success) {
                  // No navigation: show a friendly message (hook onError already alerted)
                  // You can also add extra telemetry here if desired
                }
              } else {
                // Fallback: no token found locally → clear storage and take user to login
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                await SecureStore.deleteItemAsync('userId');
                router.replace('/login/login-phone');
              }
            } catch {
              Alert.alert('Logout failed', 'Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  // Sections
  const profileSections: ProfileSection[] = [
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
        { id: '2fa', title: '2FA (Two Factor Authentication)', iconSrc: twoFAIcon, hasToggle: true, toggleValue: is2FAEnabled, onToggle: handle2FAToggle },
        { id: 'reset-pin', title: 'Reset PIN', iconSrc: pinIcon, hasChevron: true, onPress: handleResetPin },
        getBiometricOption(),
      ],
    },
    {
      id: 'other',
      options: [
        { id: 'update-kyc', title: 'Update KYC', iconSrc: kycIcon, hasChevron: true, onPress: handleUpdateKYC },
        { id: 'terms-conditions', title: 'Terms & Conditions', iconSrc: termsIcon, hasChevron: true, onPress: handleTermsConditions },
        { id: 'privacy-policy', title: 'Privacy Policy', iconSrc: privacyIcon, hasChevron: true, onPress: handlePrivacyPolicy },
      ],
    },
    {
      id: 'actions',
      options: [
        {
          id: 'logout',
          title: loggingOut ? 'Logging out…' : 'Log Out', // 👈 reflect state
          iconSrc: logoutIcon,
          onPress: confirmAndLogout,                     // 👈 use the hook
          isDestructive: true,
        },
        {
          id: 'delete-account',
          title: 'Delete account',
          iconSrc: deleteIcon,
          isDestructive: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderProfileOption = (option: ProfileOption): JSX.Element => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionContainer}
      onPress={option.onPress}
      activeOpacity={0.7}
      disabled={option.id === 'logout' && loggingOut} // prevent taps while logging out
    >
      <View style={styles.optionContent}>
        <Image source={option.iconSrc} style={styles.optionIcon} />
        <Text
          style={[
            styles.optionTitle,
            option.isDestructive && styles.optionTitleDestructive,
            option.id === 'logout' && loggingOut && { opacity: 0.7 },
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
            thumbColor={option.toggleValue ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        )}
        {option.hasChevron && (
          <Image source={chevronRightIcon} style={styles.chevronIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProfileSection = (section: ProfileSection): JSX.Element => (
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

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* User card */}
          <View style={styles.userProfileContainer}>
            <View style={styles.avatarContainer}>
              <Image source={userData.avatar} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.userPhone}>{userData.phone}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {profileSections.map(renderProfileSection)}
        </ScrollView>
      </SafeAreaView>

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
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  backButtonText: { fontSize: 18, color: '#FFFFFF', fontWeight: '500' },

  userProfileContainer: { alignItems: 'center' },
  avatarContainer: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  avatar: { width: 45, height: 45, borderRadius: 22.5, resizeMode: 'cover' },
  userName: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600', marginBottom: 3 },
  userEmail: { color: '#E5E7EB', fontFamily: Typography.regular || 'System', fontSize: 13, fontWeight: '400', marginBottom: 2 },
  userPhone: { color: '#E5E7EB', fontFamily: Typography.regular || 'System', fontSize: 13, fontWeight: '400' },

  section: { marginBottom: 16 },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.medium || 'System',
    fontSize: 13, fontWeight: '500', marginBottom: 8, marginLeft: 16, marginTop: 6,
  },
  sectionContent: {
    backgroundColor: Colors.surface || '#FFFFFF',
    marginHorizontal: 16, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  optionContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface || '#FFFFFF',
  },
  optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIcon: { width: 20, height: 20, marginRight: 12, resizeMode: 'contain' },
  optionTitle: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 15, fontWeight: '400', flex: 1 },
  optionTitleDestructive: { color: '#EF4444' },
  optionAction: { flexDirection: 'row', alignItems: 'center' },
  chevronIcon: { width: 14, height: 14, resizeMode: 'contain', tintColor: Colors.text?.secondary || '#9CA3AF' },
  optionSeparator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 },
});

export default ProfileScreen;
