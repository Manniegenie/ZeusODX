import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import useResetPin from '../../hooks/useResetPin';

export default function PinResetSendScreen() {
  const router = useRouter();
  const { initiate, initiating } = useResetPin();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBackPress = () => router.back();

  const handleSendOtp = async () => {
    setErrorMsg(null);
    try {
      const res = await initiate();
      if (res && res.success === true) {
        // IMPORTANT: route name must match the file EXACTLY: app/profile/verify-otp.tsx
        router.push('/profile/verifyOTP');
      } else {
        setErrorMsg(res?.message || 'Failed to send verification code. Please try again.');
      }
    } catch {
      setErrorMsg('Unable to send verification code. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset PIN</Text>
            <View style={styles.emptySpace} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.subtitle}>We'll send a verification code to your registered email address.</Text>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendButton, initiating && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={initiating}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>{initiating ? 'Sending…' : 'Send Verification Code'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Layout.spacing.lg },
  headerSection: { paddingTop: 12, paddingBottom: 6 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: {
    color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600',
    flex: 1, textAlign: 'center', marginHorizontal: 16,
  },
  emptySpace: { width: 40 },
  header: { paddingTop: Layout.spacing.xl, marginBottom: Layout.spacing.lg, alignItems: 'center' },
  title: { fontFamily: Typography.bold, fontSize: 24, lineHeight: 28, color: Colors.primaryText, marginBottom: Layout.spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Layout.spacing.md, lineHeight: 20 },
  errorBanner: { marginTop: 12, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, maxWidth: 420 },
  errorText: { color: '#991B1B', fontFamily: Typography.regular, fontSize: 13, textAlign: 'center' },
  spacer: { flex: 1 },
  buttonContainer: { paddingBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg },
  sendButton: { backgroundColor: Colors.primary, paddingVertical: Layout.spacing.md, borderRadius: Layout.borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  sendButtonText: { ...Typography.styles.bodyMedium, color: Colors.surface, fontWeight: '600' },
});
