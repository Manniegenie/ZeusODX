// app/kyc/level2.tsx (KYCLevel2Screen)
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
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useVerificationStatus } from '../../hooks/useVerification';

// Icons
import checkmarkIcon from '../../components/icons/green-checkmark.png';

const KYCLevel2Screen: React.FC = () => {
  const router = useRouter();

  // Use updated hook with KYC2-specific progress
  const {
    loading,
    error,
    kyc2Progress,
    emailVerified,
    identityVerified
  } = useVerificationStatus({
    autoFetch: true,
    pollMs: 15000,
  });

  const kyc2Pct = Math.max(0, Math.min(100, kyc2Progress?.percentage ?? 0));

  const handleGoBack = (): void => {
    router.back();
  };

  const handleEmailPress = (): void => {
    // Always allow navigation so user can re-trigger/see status screen
    router.push('/kyc/verify-email');
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Level 2 Verification</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to ₦25,000,000 daily and ₦200,000,000 monthly in fiat
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to $2,000,000 in crypto
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

          {/* Progress Section - Shows KYC2-specific progress */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Level 2 Progress</Text>

              <View style={styles.progressBarContainer}>
                <View
                  style={styles.progressBar}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: kyc2Pct, min: 0, max: 100 }}
                >
                  <View style={[styles.progressFill, { width: `${kyc2Pct}%` }]} />
                </View>

                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.progressText}>Loading progress…</Text>
                  </View>
                ) : (
                  <Text style={styles.progressText}>{kyc2Pct}% complete</Text>
                )}

                {!!error && !loading && (
                  <Text style={styles.progressErrorText}>Unable to refresh progress</Text>
                )}
              </View>
            </View>
          </View>

          {/* Verification Steps Section */}
          <View style={styles.section}>
            {/* Email Verification (PRESSABLE) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleEmailPress}
              style={[styles.verificationCard, !emailVerified && styles.incompleteCard]}
              testID="emailVerificationCard"
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Email Verification</Text>
                  <Text
                    style={[
                      styles.verificationSubtitle,
                      !emailVerified && styles.incompleteText
                    ]}
                  >
                    {emailVerified
                      ? "Your email address has been successfully verified."
                      : "Tap to verify your email address."}
                  </Text>
                </View>

                <View style={styles.checkmarkContainer}>
                  {emailVerified ? (
                    <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                  ) : (
                    <Text style={{ fontSize: 18, color: '#35297F' }}>›</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Identity Verification */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.verificationCard, { borderColor: '#C7D2FE' }]}
              onPress={() => router.push('/kyc/verify')}
              testID="identityVerificationCard"
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Identity Verification</Text>
                  <Text style={styles.verificationSubtitle}>
                    {identityVerified
                      ? "Your identity has been successfully verified."
                      : "Tap to verify your identity (NIN / Passport / Driver's License + selfie)"}
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {identityVerified ? (
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
  safeArea: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },

  // Header styles
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    width: 40,
  },

  // Section styles
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Benefits section styles
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

  // Progress section styles
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
  progressBarContainer: {
    alignItems: 'center',
  },
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

  // Verification card styles
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
  incompleteCard: {
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
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
  incompleteText: {
    color: '#92400E',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  pendingIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default KYCLevel2Screen;
