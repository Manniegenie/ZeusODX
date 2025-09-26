import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ImageSourcePropType
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';

// KYC status badge icons - replace with actual paths
import verifiedIcon from '../../components/icons/verified.png';
import currentIcon from '../../components/icons/current.png';
import upNextIcon from '../../components/icons/up-next.png';

// Type definitions
interface KYCLevel {
  id: string;
  level?: number;
  title: string;
  status: 'verified' | 'current' | 'up-next';
  statusText: string;
  iconSrc: ImageSourcePropType;
  description?: string;
  clickable: boolean;
}

const KYCUpgradeScreen: React.FC = () => {
  const router = useRouter();

  // KYC levels configuration - removed Level 3
  const kycLevels: KYCLevel[] = [
    {
      id: 'level1',
      level: 1,
      title: 'Level 1',
      status: 'verified',
      statusText: 'Verified',
      iconSrc: verifiedIcon,
      description: 'Basic verification completed',
      clickable: true
    },
    {
      id: 'level2',
      level: 2,
      title: 'Level 2',
      status: 'current',
      statusText: 'Current',
      iconSrc: currentIcon,
      description: 'Identity + Facial Verification + Address Verification',
      clickable: true
    },
    {
      id: 'Fiat',
      title: 'Fiat',
      status: 'current',
      statusText: 'Current',
      iconSrc: currentIcon,
      description: 'BVN Verification + Add Bank Account',
      clickable: true
    }
  ];

  // Navigation handler
  const handleGoBack = (): void => {
    router.back();
  };

  // KYC level selection handler
  const handleKYCLevelPress = (level: KYCLevel): void => {
    if (!level.clickable) return;
    
    // Handle specific level routing
    switch (level.id) {
      case 'level1':
        router.push('/kyc/kyc-1');
        break;
      case 'level2':
        router.push('/kyc/kyc-2');
        break;
      case 'Fiat':
        router.push('/kyc/fiat');
        break;
      default:
        console.log(`KYC Level ${level.level} selected`);
    }
  };

  // Get status badge styles
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'verified':
        return styles.verifiedBadge;
      case 'current':
        return styles.currentBadge;
      case 'up-next':
        return styles.upNextBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'verified':
        return styles.verifiedText;
      case 'current':
        return styles.currentText;
      case 'up-next':
        return styles.upNextText;
      default:
        return styles.defaultText;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.headerTitle}>Upgrade KYC</Text>

              {/* Spacer to center title */}
              <View style={styles.headerSpacer} />
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Upgrade your KYC to boost your limits, access exclusive perks, and enjoy a smoother experience.
              </Text>
            </View>
          </View>

          {/* KYC Levels Section */}
          <View style={styles.levelsSection}>
            {kycLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  !level.clickable && styles.levelCardDisabled
                ]}
                onPress={() => handleKYCLevelPress(level)}
                activeOpacity={level.clickable ? 0.8 : 1}
                disabled={!level.clickable}
              >
                <View style={styles.levelCardContent}>
                  {/* Level Title */}
                  <View style={styles.levelTitleContainer}>
                    <Text style={styles.levelTitle}>{level.title}</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(level.status)]}>
                      <Text style={[styles.statusText, getStatusTextStyle(level.status)]}>
                        {level.statusText}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow Icon */}
                  {level.clickable && (
                    <View style={styles.arrowContainer}>
                      <Text style={styles.arrowIcon}>›</Text>
                    </View>
                  )}
                </View>

                {/* Level Description (optional) */}
                {level.description && (
                  <Text style={styles.levelDescription}>{level.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
    flex: 1 
  },

  // Header styles (matching airtime screen)
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 48,  // Increased from 40
    height: 48, // Increased from 40
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)', // Very subtle background instead of transparent
    overflow: 'hidden', // Better Android performance
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18, // Same as airtime screen
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 48, // Updated to match new back button width
    height: 48, // Updated to match new back button height
  },
  subtitleContainer: {
    paddingHorizontal: 0,
  },
  subtitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13, // Reduced by 20% from 16
    fontWeight: '400',
    lineHeight: 18, // Adjusted proportionally
    textAlign: 'left',
  },

  // Levels section styles
  levelsSection: {
    paddingHorizontal: 16,
    gap: 12, // Reduced from 16
  },

  // Level card styles (reduced by 20%)
  levelCard: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8, // Reduced from 12
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16, // Reduced from 20
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  levelCardDisabled: {
    opacity: 0.6,
  },
  levelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelTitleContainer: {
    flex: 1,
  },
  levelTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14, // Reduced by 20% from 18 (14.4 rounded down)
    fontWeight: '600',
  },
  levelDescription: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11, // Reduced by 20% from 14 (11.2 rounded down)
    fontWeight: '400',
    marginTop: 6, // Reduced from 8
    lineHeight: 16, // Adjusted proportionally
  },

  // Status badge styles (reduced)
  statusContainer: {
    marginHorizontal: 12, // Reduced from 16
  },
  statusBadge: {
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 5, // Reduced from 6
    borderRadius: 12, // Reduced from 16
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5', // Light green background
  },
  currentBadge: {
    backgroundColor: '#FEF3C7', // Light yellow/orange background
  },
  upNextBadge: {
    backgroundColor: '#E0E7FF', // Light purple background
  },
  defaultBadge: {
    backgroundColor: '#F3F4F6',
  },

  // Status text styles (reduced by 20%)
  statusText: {
    fontFamily: Typography.medium || 'System',
    fontSize: 10, // Reduced by 20% from 12 (9.6 rounded up)
    fontWeight: '600',
  },
  verifiedText: {
    color: '#065F46', // Dark green text
  },
  currentText: {
    color: '#92400E', // Dark orange text
  },
  upNextText: {
    color: '#3730A3', // Dark purple text
  },
  defaultText: {
    color: '#6B7280',
  },

  // Arrow styles (reduced)
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 20, // Reduced from 24
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '300',
  },
});

export default KYCUpgradeScreen;