import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Modal, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { SmileIDBiometricKYCView, type BiometricKYCParams } from '@smile_identity/react-native-expo';

export default function NINVerify() {
  const router = useRouter();
  const [nin, setNin] = useState('');
  const [show, setShow] = useState(false);
  const valid = /^\d{11}$/.test(nin);

  const params: BiometricKYCParams = useMemo(() => ({
    showInstructions: true,
    allowNewEnroll: true,
    useStrictMode: false,
    skipApiSubmission: false,
    consentInformation: {
      consentGrantedDate: new Date().toISOString(),
      personalDetailsConsentGranted: true,
      contactInfoConsentGranted: true,
      documentInfoConsentGranted: true,
    },
    idInfo: {
      country: 'NG',
      idType: 'NIN',          // <-- use NIN (fixes “configuration not set” for many setups)
      idNumber: nin,
      entered: true,
    },
    extraPartnerParams: { flow: 'nin_biometric_kyc' },
  }), [nin]);

  const start = () => {
    if (!valid) return Alert.alert('NIN required', 'Enter a valid 11-digit NIN to continue.');
    setShow(true);
  };

  const onSuccess = () => {
    setShow(false);
    Alert.alert('Submitted', 'Your verification has been submitted.');
    router.back();
  };

  const onError = (evt: any) => {
    setShow(false);
    const msg = evt?.nativeEvent?.error?.message || 'Verification failed. Try again.';
    Alert.alert('Error', msg);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify using NIN</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sub}>We’ll validate your NIN with the authority and capture a selfie.</Text>

          <TextInput
            value={nin}
            onChangeText={setNin}
            inputMode="numeric"
            maxLength={11}
            placeholder="Enter 11-digit NIN"
            style={styles.input}
          />

          <TouchableOpacity style={[styles.cta, { opacity: valid ? 1 : 0.5 }]} disabled={!valid} onPress={start}>
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={show} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShow(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <SmileIDBiometricKYCView style={{ flex: 1 }} params={params} onResult={onSuccess} onError={onError} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 13, marginBottom: 12 },
  input: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  cta: { backgroundColor: '#35297F', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  ctaText: { color: '#fff', fontWeight: '600' },
});
