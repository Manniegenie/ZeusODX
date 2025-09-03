// app/kyc/level2.tsx (KYCLevel2Screen)
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useVerificationStatus } from '../../hooks/useVerification';
import { apiClient } from '../../services/apiClient'; // ⬅️ add this

import checkmarkIcon from '../../components/icons/green-checkmark.png';

const KYCLevel2Screen: React.FC = () => {
  const router = useRouter();

  // Progress (from your verification hook)
  const { loading, error, overall, kyc } = useVerificationStatus({
    autoFetch: true,
    pollMs: 15000,
  });
  const overallPct = Math.max(0, Math.min(100, overall?.percentage ?? 0));
  const level2Complete = (kyc?.completedSteps ?? 0) >= 2;

  // Email status (fetch from profile/me)
  const [emailVerified, setEmailVerified] = React.useState<boolean>(false);
  const [emailLoading, setEmailLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/auth/me'); // adjust to your profile endpoint
        if (!mounted) return;
        setEmailVerified(!!res?.data?.emailVerified);
      } catch {
        if (!mounted) return;
        setEmailVerified(false);
      } finally {
        if (mounted) setEmailLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleGoBack = () => router.back();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Level 2 Verification</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <View style={styles.benefitItem}><View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>Withdraw and transfer up to ₦25,000,000 daily and ₦200,000,000 monthly in fiat</Text>
            </View>
            <View style={styles.benefitItem}><View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>Withdraw and transfer up to $2,000,000 in crypto</Text>
            </View>
            <View style={styles.benefitItem}><View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>Buy Utilities up to ₦500,000 daily and ₦2,000,000 monthly</Text>
            </View>
            <View style={styles.benefitItem}><View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>Complete Fiat Verification to Withdraw NGNZ</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Overall Progress</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar} accessibilityRole="progressbar" accessibilityValue={{ now: overallPct, min: 0, max: 100 }}>
                  <View style={[styles.progressFill, { width: `${overallPct}%` }]} />
                </View>
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.progressText}>Loading progress…</Text>
                  </View>
                ) : (
                  <Text style={styles.progressText}>{overallPct}% complete</Text>
                )}
                {!!error && !loading && <Text style={styles.progressErrorText}>Unable to refresh progress</Text>}
              </View>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.section}>
            {/* Email Verification (now dynamic) */}
            <TouchableOpacity
              activeOpacity={emailVerified ? 1 : 0.8}
              style={styles.verificationCard}
              onPress={() => { if (!emailVerified) router.push('/verify/email'); /* adjust route */ }}
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Email Verification</Text>
                  <Text style={styles.verificationSubtitle}>
                    {emailLoading
                      ? 'Checking email status…'
                      : emailVerified
                        ? 'Your email address has been successfully verified.'
                        : 'Verify your email address to continue.'}
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {emailLoading ? (
                    <ActivityIndicator size="small" />
                  ) : emailVerified ? (
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
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Identity Verification</Text>
                  <Text style={styles.verificationSubtitle}>
                    Tap to verify your identity (NIN / Passport / Driver’s License + selfie)
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  {level2Complete ? (
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
  // … (unchanged from your file)
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  benefitItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bulletPoint: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.text?.primary || '#111827', marginTop: 8, marginRight: 12 },
  benefitText: { flex: 1, color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 13, fontWeight: '400', lineHeight: 18 },
  progressCard: { backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#D1FAE5', padding: 12 },
  progressTitle: { color: '#065F46', fontFamily: Typography.medium || 'System', fontSize: 12, fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  progressBarContainer: { alignItems: 'center' },
  progressBar: { width: '100%', height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  progressText: { color: '#065F46', fontFamily: Typography.medium || 'System', fontSize: 10, fontWeight: '500' },
  progressErrorText: { marginTop: 4, color: '#B45309', fontFamily: Typography.regular || 'System', fontSize: 10 },
  verificationCard: { backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  verificationContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verificationInfo: { flex: 1, marginRight: 16 },
  verificationTitle: { color: Colors.text?.primary || '#111827', fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  verificationSubtitle: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 11, fontWeight: '400', lineHeight: 16 },
  checkmarkContainer: { justifyContent: 'center', alignItems: 'center' },
  checkmarkIcon: { width: 20, height: 20, resizeMode: 'contain' },
});

export default KYCLevel2Screen;
