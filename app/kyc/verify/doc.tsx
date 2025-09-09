// app/kyc/verify/doc.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  Modal, ScrollView, Animated, Dimensions, TouchableWithoutFeedback
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import ErrorDisplay from '../../../components/ErrorDisplay';

type ErrorType = 'network' | 'server' | 'notFound' | 'general';
interface ErrorDisplayData {
  type?: ErrorType;
  title?: string;
  message?: string;
  errorAction?: { title: string; message: string; actionText: string; route?: string; priority?: 'high' | 'medium' | 'low' };
  onActionPress?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

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
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  const getErrorType = (codeOrMsg?: string): ErrorType => {
    const s = (codeOrMsg || '').toLowerCase();
    if (s.includes('network') || s.includes('connection')) return 'network';
    if (s.includes('not found')) return 'notFound';
    if (s.includes('server') || s.includes('500')) return 'server';
    return 'general';
  };

  const showErrorMessage = useCallback((messageOrData: string | ErrorDisplayData) => {
    if (typeof messageOrData === 'string') {
      setErrorType(getErrorType(messageOrData));
      setErrorMessage(messageOrData);
      setErrorDisplayData(null);
      setShowError(true);
    } else {
      setErrorDisplayData(messageOrData);
      setErrorType(messageOrData.type || 'general');
      setErrorMessage(messageOrData.message || '');
      setShowError(true);
    }
  }, []);
  const hideError = useCallback(() => { setShowError(false); setErrorDisplayData(null); }, []);

  const docType: 'PASSPORT' | 'DRIVERS_LICENSE' =
    type === 'DRIVERS_LICENSE' || type === 'PASSPORT' ? type : 'PASSPORT';
  const captureBothSides = docType !== 'PASSPORT';

  // Build the HTML for the web component
  const html = useMemo(() => {
    // You can pin a version (e.g. v2.0.0) or use major (v2)
    const cdnSrc = 'https://cdn.smileidentity.com/js/v2/smart-camera-web.js';
    // Attributes: theme color, instructions toggle, capture-id etc.
    const themeColor = '#35297F';
    const hideBackAttr = captureBothSides ? '' : 'hide-back-of-id'; // passport => front only (hide back)
    const captureIdAttr = 'capture-id'; // includes selfie + doc when present

    // The component raises custom events; we forward them to RN via postMessage.
    // If you want to POST to your backend now, do it inside handlePublish().
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
  <script src="${cdnSrc}"></script>
  <style>
    html, body { margin:0; padding:0; background:#FFFFFF; height:100%; }
    .container { height:100vh; display:flex; }
    smart-camera-web, selfie-capture-screens, document-capture-screens { flex:1; }
  </style>
</head>
<body>
  <div class="container">
    <smart-camera-web
      theme-color="${themeColor}"
      ${captureIdAttr}
      ${hideBackAttr}
      ${docType === 'PASSPORT' ? 'hide-instructions' : ''}
    >
    </smart-camera-web>
  </div>

  <script>
    (function() {
      const app = document.querySelector('smart-camera-web');

      function post(type, payload) {
        const msg = JSON.stringify({ type, payload });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        }
      }

      // Publish => images + meta
      app.addEventListener('smart-camera-web.publish', function (e) {
        post('publish', e.detail);
      });

      // Optional extra events you may care about
      app.addEventListener('smart-camera-web.cancelled', function (e) {
        post('cancelled', e.detail || {});
      });
      app.addEventListener('smart-camera-web.back', function (e) {
        post('back', e.detail || {});
      });

      // Provide a little ready signal
      post('ready', { ok: true, version: 'v2' });
    })();
  </script>
</body>
</html>
    `;
  }, [captureBothSides, docType]);

  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  useEffect(() => {
    if (show) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: MODAL_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [show, slideAnim]);

  const handleBackdropPress = () => setShow(false);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'publish') {
        // You'll POST data.payload to your backend later (images + meta)
        setShow(false);
        if (showError) hideError();
        router.back();
      } else if (data?.type === 'cancelled') {
        setShow(false);
      } else if (data?.type === 'back') {
        // ignore or handle
      } else if (data?.type === 'ready') {
        // ready signal
      }
    } catch (e: any) {
      showErrorMessage('Verification failed. Try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {showError && (
        <ErrorDisplay
          type={errorType}
          title={errorDisplayData?.title}
          message={errorMessage || errorDisplayData?.message}
          errorAction={errorDisplayData?.errorAction}
          onActionPress={errorDisplayData?.onActionPress}
          autoHide={errorDisplayData?.autoHide !== false}
          duration={errorDisplayData?.duration || 4000}
          dismissible={errorDisplayData?.dismissible !== false}
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
          <Text style={styles.sub}>We’ll scan your document and capture a selfie.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => setShow(true)} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Start</Text>
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

                  <View style={styles.smileWrapper}>
                    <WebView
                      originWhitelist={['*']}
                      source={{ html }}
                      // Camera in WebView:
                      // iOS: make sure NSCameraUsageDescription is present (you already have it)
                      // Android: CAMERA permission already in app.json
                      javaScriptEnabled
                      domStorageEnabled
                      allowsInlineMediaPlayback
                      onMessage={onMessage}
                      // Helpful on some OEMs:
                      mediaPlaybackRequiresUserAction={false}
                    />
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
  smileWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
});
