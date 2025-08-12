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
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useDashboard } from '../../hooks/useDashboard';

// Icons - replace with actual paths
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
  
  // Toggle states
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState<boolean>(true);

  // User data - using dashboard data with dash fallbacks
  const userData = {
    name: `${firstname} ${lastname}`.trim() || '-',
    email: email || '-',
    phone: phonenumber || '-',
    avatar: profileAvatarIcon
  };

  // Navigation handlers
  const handleGoBack = (): void => {
    router.back();
  };

  // Option handlers
  const handlePersonalDetails = (): void => {
    router.push('/profile/personal-details');
  };

  const handleReferEarn = (): void => {
    router.push('/profile/refer-earn');
  };

  const handleBankDetails = (): void => {
    router.push('/profile/bank-details');
  };

  const handle2FAToggle = (value: boolean): void => {
    if (value) {
      // Navigate to 2FA setup/management when enabled
      router.push('/user/2FA');
    }
    // Handle 2FA preference update
  };

  const handleResetPin = (): void => {
    router.push('/profile/reset-pin');
  };

  const handleUpdateKYC = (): void => {
    router.push('/kyc/kyc-upgrade');
  };

  const handleTermsConditions = (): void => {
    router.push('/profile/terms-conditions');
  };

  const handlePrivacyPolicy = (): void => {
    router.push('/profile/privacy-policy');
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion logic
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // Toggle handlers
  const handleNotificationToggle = (value: boolean): void => {
    setNotificationEnabled(value);
    // Handle notification preference update
  };

  const handleFingerprintToggle = (value: boolean): void => {
    setFingerprintEnabled(value);
    // Handle fingerprint preference update
  };

  // Profile sections configuration
  const profileSections: ProfileSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      options: [
        {
          id: 'personal-details',
          title: 'Personal Details',
          iconSrc: personalDetailsIcon,
          hasChevron: true,
          onPress: handlePersonalDetails,
        },
        {
          id: 'refer-earn',
          title: 'Refer & earn',
          iconSrc: referEarnIcon,
          hasChevron: true,
          onPress: handleReferEarn,
        },
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
        {
          id: 'bank-details',
          title: 'Bank Details',
          iconSrc: bankDetailsIcon,
          hasChevron: true,
          onPress: handleBankDetails,
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      options: [
        {
          id: '2fa',
          title: '2FA (Two Factor Authentication)',
          iconSrc: twoFAIcon,
          hasToggle: true,
          toggleValue: is2FAEnabled,
          onToggle: handle2FAToggle,
        },
        {
          id: 'reset-pin',
          title: 'Reset PIN',
          iconSrc: pinIcon,
          hasChevron: true,
          onPress: handleResetPin,
        },
        {
          id: 'fingerprint',
          title: 'Fingerprint',
          iconSrc: fingerprintIcon,
          hasToggle: true,
          toggleValue: fingerprintEnabled,
          onToggle: handleFingerprintToggle,
        },
      ],
    },
    {
      id: 'other',
      options: [
        {
          id: 'update-kyc',
          title: 'Update KYC',
          iconSrc: kycIcon,
          hasChevron: true,
          onPress: handleUpdateKYC,
        },
        {
          id: 'terms-conditions',
          title: 'Terms & Conditions',
          iconSrc: termsIcon,
          hasChevron: true,
          onPress: handleTermsConditions,
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          iconSrc: privacyIcon,
          hasChevron: true,
          onPress: handlePrivacyPolicy,
        },
      ],
    },
    {
      id: 'actions',
      options: [
        {
          id: 'logout',
          title: 'Log Out',
          iconSrc: logoutIcon,
          onPress: handleLogout,
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
    >
      <View style={styles.optionContent}>
        <Image source={option.iconSrc} style={styles.optionIcon} />
        <Text style={[
          styles.optionTitle,
          option.isDestructive && styles.optionTitleDestructive
        ]}>
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
      {section.title && (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      <View style={styles.sectionContent}>
        {section.options.map((option, index) => (
          <View key={option.id}>
            {renderProfileOption(option)}
            {index < section.options.length - 1 && (
              <View style={styles.optionSeparator} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#35297F" barStyle="light-content" />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* User Profile Info */}
          <View style={styles.userProfileContainer}>
            <View style={styles.avatarContainer}>
              <Image source={userData.avatar} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.userPhone}>{userData.phone}</Text>
          </View>
        </View>

        {/* Scrollable Content */}
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
  container: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F8F9FA' 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1,
    backgroundColor: Colors.background || '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 80, // Account for bottom tab navigator
  },

  // Header styles
  headerSection: {
    backgroundColor: '#35297F',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  backButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // User profile styles
  userProfileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    resizeMode: 'cover',
  },
  userName: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 3,
  },
  userEmail: {
    color: '#E5E7EB',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 2,
  },
  userPhone: {
    color: '#E5E7EB',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
  },

  // Section styles
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 6,
  },
  sectionContent: {
    backgroundColor: Colors.surface || '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Option styles
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface || '#FFFFFF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  optionTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
  },
  optionTitleDestructive: {
    color: '#EF4444',
  },
  optionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    tintColor: Colors.text?.secondary || '#9CA3AF',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 48, // Align with text after icon
  },
});

export default ProfileScreen;