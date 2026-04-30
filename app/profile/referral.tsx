import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Polyline, Svg } from 'react-native-svg';
import {
  ActivityIndicator,
  Clipboard,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useReferral } from '../../hooks/useReferral';

import AddressCopied from '../../components/AddressCopied';
import backIcon from '../../components/icons/backy.png';
import copyIcon from '../../components/icons/copy-icon.png';

export default function ReferralScreen() {
  const router = useRouter();
  const { referralData, loading, error, refetch } = useReferral();
  const [showCopied, setShowCopied] = React.useState(false);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCopyCode = useCallback(async () => {
    if (!referralData?.referralCode) return;
    try {
      await Clipboard.setString(referralData.referralCode);
      setShowCopied(true);
    } catch {
      // silently fail — clipboard unavailable
    }
  }, [referralData?.referralCode]);

  const fmt = (n: number) =>
    n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        {showCopied && <AddressCopied onDismiss={() => setShowCopied(false)} />}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Referral</Text>
              <View style={styles.headerRight} />
            </View>
          </View>

          {loading ? (
            <View style={styles.centeredState}>
              <ActivityIndicator size="large" color="#35297F" />
              <Text style={styles.stateText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.centeredState}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : referralData ? (
            <>
              {/* Referral Code */}
              <View style={styles.section}>
                <Text style={styles.label}>Your Referral Code</Text>
                <View style={styles.codeCard}>
                  <Text style={styles.codeText}>{referralData.referralCode}</Text>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Image source={copyIcon} style={styles.copyIcon} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeHint}>
                  Share your code. When referrals swap Crypto → NGNZ, you earn NGNZ equal to the USD value of their swap.
                </Text>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { marginRight: 8 }]}>
                  <Text style={styles.statValue}>{referralData.totalReferrals ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Referrals</Text>
                </View>
                <View style={[styles.statCard, { marginLeft: 8 }]}>
                  <Text style={styles.statValue}>{referralData.totalConversions ?? 0}</Text>
                  <Text style={styles.statLabel}>Conversions</Text>
                </View>
              </View>

              {/* Earnings */}
              <View style={styles.section}>
                <Text style={styles.label}>Earnings</Text>
                <View style={styles.card}>
                  <View style={styles.earningsRow}>
                    <View>
                      <Text style={styles.earningsLabel}>Total Earned</Text>
                      <Text style={styles.earningsValueGreen}>₦{fmt(referralData.totalEarnings ?? 0)}</Text>
                    </View>
                    <Svg width={80} height={36} viewBox="0 0 80 36">
                      <Polyline
                        points="0,30 13,22 26,25 40,14 53,18 66,8 80,4"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                </View>
              </View>

              {/* How it works */}
              <View style={styles.section}>
                <Text style={styles.label}>How it works</Text>
                <View style={styles.card}>
                  {[
                    'Share your referral code with friends.',
                    'They sign up on ZeusODX using your code.',
                    'Every time they swap Crypto → NGNZ, you earn NGNZ equal to the USD value of their swap.',
                  ].map((step, i) => (
                    <View key={i} style={[styles.stepRow, i < 2 && styles.stepRowBorder]}>
                      <Text style={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</Text>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F7F6FF' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Header
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
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
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
  headerRight: { width: 40 },

  // States
  centeredState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 16,
  },
  stateText: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  label: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Referral code card
  codeCard: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#35297F',
    letterSpacing: 4,
    fontFamily: Typography.bold || 'System',
  },
  copyIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  codeHint: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    lineHeight: 17,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#35297F',
    fontFamily: Typography.bold || 'System',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
  },

  // Earnings
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  earningsLabel: {
    fontSize: 15,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
  },
  earningsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
  },
  earningsValueGreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: Typography.bold || 'System',
    marginTop: 2,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepNumber: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: Typography.bold || 'System',
    color: '#EDE9FF',
    width: 44,
    textAlign: 'center',
    includeFontPadding: false,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    lineHeight: 21,
  },
});
