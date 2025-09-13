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

const FiatScreen: React.FC = () => {
  const router = useRouter();

  // Use updated hook with individual fiat step helpers
  const { 
    loading, 
    error, 
    fiat,
    bvnVerified,
    hasBankAccount 
  } = useVerificationStatus({
    autoFetch: true,
    pollMs: 15000,
  });

  const fiatPct = Math.max(0, Math.min(100, fiat?.percentage ?? 0));

  const handleGoBack = (): void => {
    router.back();
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
          {/* Header Section (mirrored format) */}
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

              <Text style={styles.headerTitle}>Fiat Verification</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Complete BVN and add a verified bank account to enable Naira deposits and withdrawals.
              </Text>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and Deposit Naira
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Fiat Progress</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={styles.progressBar}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: fiatPct, min: 0, max: 100 }}
                >
                  <View style={[styles.progressFill, { width: `${fiatPct}%` }]} />
                </View>

                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.progressText}>Loading progress…</Text>
                  </View>
                ) : (
                  <Text style={styles.progressText}>{fiatPct}% complete</Text>
                )}

                {!!error && !loading && (
                  <Text style={styles.progressErrorText}>Unable to refresh progress</Text>
                )}
              </View>
            </View>
          </View>

          {/* Verification Steps Section */}
          <View style={styles.section}>
            {/* BVN Verification */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.verificationCard, !bvnVerified && styles.incompleteCard]}
              onPress={() => router.push('/fiat/bvn')}
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>BVN Verification</Text>
                  <Text style={[
                    styles.verificationSubtitle,
                    !bvnVerified && styles.incompleteText
                  ]}>
                    {bvnVerified 
                      ? 'Your BVN has been successfully verified.' 
                      : 'Verify your BVN to enable Naira withdrawals & deposits.'
                    }
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {bvnVerified ? (
                    <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                  ) : (
                    <View style={styles.pendingIcon}>
                      <Text style={styles.pendingText}>!</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Add Bank Account */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.verificationCard, !hasBankAccount && styles.incompleteCard]}
              onPress={() => router.push('/profile/add-bank')}
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Add Bank Account</Text>
                  <Text style={[
                    styles.verificationSubtitle,
                    !hasBankAccount && styles.incompleteText
                  ]}>
                    {hasBankAccount 
                      ? 'Your bank account has been successfully added.' 
                      : 'Add a verified bank account to receive withdrawals.'
                    }
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {hasBankAccount ? (
                    <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                  ) : (
                    <View style={styles.pendingIcon}>
                      <Text style={styles.pendingText}>!</Text>
                    </View>
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

export default FiatScreen;
