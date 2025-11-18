import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useUserProfile } from '../hooks/useProfile';

/* ================= Bottom Sheet Base (75% height) ================= */

const EXTRA_BOTTOM_PADDING = 12;

const Sheet = ({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const { height: screenH } = useWindowDimensions();
  const SHEET_HEIGHT = Math.round(screenH * 0.75); // 75% screen height
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard visibility for iOS
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY, SHEET_HEIGHT]);

  const bottomPadding = insets.bottom + EXTRA_BOTTOM_PADDING;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
              height: SHEET_HEIGHT,
              marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
            },
          ]}
        >
          <View style={styles.handleBar} />
          <SafeAreaView style={{ flex: 1, paddingBottom: bottomPadding }} edges={['bottom']}>
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* ================= Tawk Chat Bottom Sheet ================= */

type TawkChatSheetProps = {
  visible: boolean;
  onClose: () => void;
  directLink?: string;
  title?: string;
};

export function TawkChatSheet({
  visible,
  onClose,
  title = 'Support • ZeusODX',
  directLink = 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl',
}: TawkChatSheetProps) {
  const { profile, displayName } = useUserProfile();
  const userName = useMemo(() => displayName || profile?.fullName || profile?.username || '', [displayName, profile]);
  const userEmail = useMemo(() => profile?.email || profile?.contactEmail || '', [profile]);

  const [loading, setLoading] = useState(true);
  const webRef = useRef<any>(null);

  // Allow-list navigation targets
  const allowInApp = (url: string) => {
    if (url.startsWith('about:blank') || url.startsWith('data:') || url.startsWith('blob:')) return true;
    try {
      const parsed = new URL(url);
      const host = parsed.host?.toLowerCase();
      const scheme = parsed.protocol.replace(':', '');

      if (scheme === 'http' || scheme === 'https') {
        return (
          host.endsWith('tawk.to') ||
          host.endsWith('embed.tawk.to') ||
          host.endsWith('va.tawk.to') ||
          host.endsWith('tawk.link')
        );
      }
      if (['mailto', 'tel', 'sms', 'intent', 'whatsapp'].includes(scheme)) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
    } catch {
      return true;
    }
    return true;
  };

  // Inject CSS to limit input height and set visitor info
  const injectedBefore = useMemo(
    () => `
    (function() {
      try {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.visitor = {
          name: ${JSON.stringify(userName || '')},
          email: ${JSON.stringify(userEmail || '')}
        };
        
        // Add CSS to limit message input height
        const style = document.createElement('style');
        style.textContent = \`
          /* Limit message input container height */
          .tawk-textarea-wrapper,
          .tawk-input-container,
          textarea[placeholder*="Type your message"],
          textarea[placeholder*="type"] {
            max-height: 120px !important;
            min-height: 44px !important;
          }
          
          /* Ensure textarea doesn't stretch indefinitely */
          .tawk-textarea,
          .tawk-min-container textarea,
          .tawk-composer textarea {
            max-height: 100px !important;
            overflow-y: auto !important;
          }
          
          /* Fix chat container layout */
          .tawk-min-container,
          .tawk-chat-panel {
            max-height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Message list takes remaining space */
          .tawk-message-list,
          .tawk-messages-container {
            flex: 1 !important;
            overflow-y: auto !important;
            min-height: 0 !important;
          }
          
          /* Input area fixed height */
          .tawk-composer-area,
          .tawk-form-container,
          .tawk-input-area {
            flex: 0 0 auto !important;
            max-height: 140px !important;
          }
          
          /* Prevent body/html stretching */
          html, body {
            height: 100% !important;
            overflow: hidden !important;
          }
        \`;
        document.head.appendChild(style);
      } catch (e) {}
    })();
    true;
  `,
    [userName, userEmail]
  );

  // Update visitor attributes after mount
  useEffect(() => {
    if (!webRef.current) return;
    const js = `
      try {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.setAttributes && window.Tawk_API.setAttributes({
          name: ${JSON.stringify(userName || '')},
          email: ${JSON.stringify(userEmail || '')}
        }, function(){});
      } catch (e) {}
      true;
    `;
    const t = setTimeout(() => webRef.current?.injectJavaScript(js), 600);
    return () => clearTimeout(t);
  }, [userName, userEmail, visible]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View style={styles.titleRow}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Web content */}
      <View style={styles.webContainer}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary || '#007AFF'} />
          </View>
        )}

        <WebView
          ref={webRef}
          source={{ uri: directLink }}
          startInLoadingState
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={injectedBefore}
          onShouldStartLoadWithRequest={(req) => {
            if (allowInApp(req.url)) return true;
            Linking.openURL(req.url).catch(() => {});
            return false;
          }}
          androidHardwareAccelerationDisabled={false}
          nestedScrollEnabled={true}
          androidLayerType="hardware"
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          keyboardDisplayRequiresUserAction={false}
          onTouchStart={() => {}}
          bounces={false}
          hideKeyboardAccessoryView={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          scrollEnabled={true}
          userAgent={
            Platform.select({
              android: 'Mozilla/5.0 (Linux; Android 12; rv:109.0) Gecko/109.0 Firefox/109.0',
              ios: undefined,
              default: undefined,
            }) as string | undefined
          }
        />
      </View>
    </Sheet>
  );
}

/* ============== Prefetcher (warm Tawk on app startup) ============== */
export function TawkPrefetcher({
  directLink = 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl',
}: {
  directLink?: string;
}) {
  const { profile, displayName } = useUserProfile();
  const userName = useMemo(() => displayName || profile?.fullName || profile?.username || '', [displayName, profile]);
  const userEmail = useMemo(() => profile?.email || profile?.contactEmail || '', [profile]);

  const injectedBefore = useMemo(
    () =>
      `(function(){try{window.Tawk_API=window.Tawk_API||{};window.Tawk_API.visitor={name:${JSON.stringify(
        userName || ''
      )},email:${JSON.stringify(userEmail || '')}};}catch(e){}})();true;`,
    [userName, userEmail]
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        overflow: 'hidden',
      }}
    >
      <WebView
        source={{ uri: directLink }}
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },

  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 6,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },

  sheetTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: (Typography?.medium as any) || 'System',
  },

  closeTxt: {
    fontSize: 22,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 22,
  },

  webContainer: {
    flex: 1,
    backgroundColor: Colors.background || '#0b0b10',
    overflow: 'hidden',
  },

  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,s0.95)',
    zIndex: 2,
  },
});

export default TawkChatSheet;