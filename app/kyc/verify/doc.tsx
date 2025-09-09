// app/kyc/verify/doc.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  Modal, ScrollView, Animated, Dimensions, TouchableWithoutFeedback
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import ErrorDisplay from '../../../components/ErrorDisplay';

type ErrorType = 'network' | 'server' | 'notFound' | 'general';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = Math.min(0.9 * SCREEN_HEIGHT, 640);

export default function DocVerify() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type?: 'PASSPORT' | 'DRIVERS_LICENSE' }>();

  const [show, setShow] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('general');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const docType: 'PASSPORT' | 'DRIVERS_LICENSE' =
    type === 'DRIVERS_LICENSE' || type === 'PASSPORT' ? type : 'PASSPORT';

  const hideError = useCallback(() => { setShowError(false); }, []);

  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  useEffect(() => {
    if (show) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: MODAL_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [show, slideAnim]);

  const handleBackdropPress = () => setShow(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {showError && (
        <ErrorDisplay
          type={errorType}
          message={errorMessage}
          onDismiss={hideError}
        />
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {docType === 'PASSPORT' ? 'Verify with Passport' : 'Verify with Driver’s License'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sub}>Verification is temporarily unavailable.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => setShow(true)} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Open Placeholder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalWrapper}>
                <Animated.View
                  style={[styles.modalContainer, { height: MODAL_HEIGHT, width: SCREEN_WIDTH, transform: [{ translateY: slideAnim }] }]}
                >
                  <View style={styles.handleBar} />
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>
                      {docType === 'PASSPORT' ? 'Passport' : 'Driver’s License'}
                    </Text>
                  </View>

                  <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderText}>
                      KYC capture has been removed.{"\n"}We’ll re-enable this flow later.
                    </Text>
                    <TouchableOpacity style={[styles.cta, { marginTop: 16 }]} onPress={() => setShow(false)}>
                      <Text style={styles.ctaText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <View style={[styles.safeAreaExtension, { height: insets.bottom, width: SCREEN_WIDTH }]} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    flex: 1, textAlign: 'center', marginHorizontal: 16,
  },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 13, marginBottom: 12 },
  cta: { backgroundColor: '#35297F', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#fff', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrapper: { alignSelf: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, overflow: 'hidden' },
  safeAreaExtension: { backgroundColor: '#FFFFFF', alignSelf: 'center' },
  handleBar: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetHeader: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' },
  sheetTitle: { color: Colors.text?.primary || '#111827', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
  placeholderBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholderText: { textAlign: 'center', color: Colors.text?.secondary || '#6B7280' },
});
