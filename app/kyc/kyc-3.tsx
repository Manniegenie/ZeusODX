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
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useVerificationStatus } from '../../hooks/useVerification';

// Icons
import checkmarkIcon from '../../components/icons/green-checkmark.png';
import verifiedIcon from '../../components/icons/verified.png';
import currentIcon from '../../components/icons/current.png';
import upNextIcon from '../../components/icons/up-next.png';

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

const KYCLevel3Screen: React.FC = () => {
  const router = useRouter();

  // Fetch once on mount; no polling, no refetch on focus/reconnect
  const { 
    loading, 
    error, 
    kyc3Progress,
    addressVerified
  } = useVerificationStatus({
    autoFetch: true,
    pollMs: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const kyc3Pct = Math.max(0, Math.min(100, kyc3Progress?.percentage ?? 0));
  const addressClickable = !addressVerified;

  const handleGoBack = (): void => {
    router.back();
  };

  const handleAddressPress = (): void => {
    if (!addressClickable) return;
    router.push('/kyc/address-verify');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Header Section (mirrors other screens) */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Level 3 Verification</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Complete address verification to unlock the highest limits and full platform privileges.
              </Text>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to ₦50,000,000 daily and ₦500,000,000 monthly in fiat
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to $5,000,000 in crypto
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Buy Utilities up to ₦500,000 daily and ₦2,000,000 monthly
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Complete Fiat Verification to Withdraw NGNZ
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Level 3 Progress</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={styles.progressBar}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: kyc3Pct, min: 0, max: 100 }}
                >
                  <View style={[styles.progressFill, { width: `${kyc3Pct}%` }]} />
                </View>

                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.progressText}>Loading progress…</Text>
                  </View>
                ) : (
                  <Text style={styles.progressText}>{kyc3Pct}% complete</Text>
                )}

                {!!error && !loading && (
                  <Text style={styles.progressErrorText}>Unable to refresh progress</Text>
                )}
              </View>
            </View>
          </View>

          {/* Verification Steps Section */}
          <View style={styles.section}>
            {/* Address Verification (unclickable when already verified) */}
            <TouchableOpacity
              activeOpacity={addressClickable ? 0.8 : 1}
              style={[
                styles.verificationCard,
                { borderColor: '#C7D2FE' },
                !addressClickable && styles.disabledCard,
              ]}
              onPress={addressClickable ? handleAddressPress : undefined}
              disabled={!addressClickable}
              accessibilityState={{ disabled: !addressClickable }}
              testID="addressVerificationCard"
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Address Verification</Text>
                  <Text
                    style={[
                      styles.verificationSubtitle,
                      !addressClickable && styles.disabledText,
                    ]}
                  >
                    {addressVerified
                      ? 'Your address has been successfully verified.'
                      : 'Tap to verify your address (Utility bill / Bank statement)'}
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {addressVerified ? (
                    <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                  ) : (
                    <Text style={{ fontSize: 18, color: '#35297F' }}>›</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
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
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  // Header styles (matching the other screens)
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  subtitleContainer: {
    paddingHorizontal: 0,
  },
  subtitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'left',
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text?.primary || '#111827',
    marginTop: 8,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },

  progressCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 12,
  },
  progressTitle: {
    color: '#065F46',
    fontFamily: Typography.medium || 'System',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: { alignItems: 'center' },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    color: '#065F46',
    fontFamily: Typography.medium || 'System',
    fontSize: 10,
    fontWeight: '500',
  },
  progressErrorText: {
    marginTop: 4,
    color: '#B45309',
    fontFamily: Typography.regular || 'System',
    fontSize: 10,
  },

  verificationCard: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabledCard: {
    opacity: 0.55,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  verificationTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationSubtitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
  },
  disabledText: { color: '#9CA3AF' },

  checkmarkContainer: { justifyContent: 'center', alignItems: 'center' },
  checkmarkIcon: { width: 20, height: 20, resizeMode: 'contain' },
});

export default KYCLevel3Screen;