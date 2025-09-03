// app/kyc/verify/doc.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import {
  SmileIDDocumentVerificationView,
  type DocumentVerificationParams,
} from '@smile_identity/react-native-expo';

export default function DocVerify() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: 'PASSPORT' | 'DRIVERS_LICENSE' }>();
  const [show, setShow] = useState(false);

  const docType: 'PASSPORT' | 'DRIVERS_LICENSE' =
    type === 'DRIVERS_LICENSE' || type === 'PASSPORT' ? type : 'PASSPORT';
  const captureBothSides = docType !== 'PASSPORT';

  const params: DocumentVerificationParams = useMemo(
    () => ({
      countryCode: 'NG',
      documentType: docType,
      captureBothSides,
      allowGalleryUpload: true,
      showInstructions: true,
      useStrictMode: false,
      skipApiSubmission: false,
      extraPartnerParams: { flow: `docv_${docType.toLowerCase()}` },
    }),
    [docType, captureBothSides]
  );

  const onSuccess = () => {
    setShow(false);
    Alert.alert('Submitted', 'Your document has been submitted for verification.');
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (matches your other screens’ spacing) */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {docType === 'PASSPORT' ? 'Verify with Passport' : 'Verify with Driver’s License'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sub}>
            We’ll scan your document and capture a selfie to confirm it’s you.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={() => setShow(true)}>
            <Text style={styles.ctaText}>Start</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={show}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShow(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <SmileIDDocumentVerificationView
            style={{ flex: 1 }}
            params={params}
            onResult={onSuccess}
            onError={onError}
          />
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
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 13, marginBottom: 12 },
  cta: { backgroundColor: '#35297F', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#fff', fontWeight: '600' },
});
