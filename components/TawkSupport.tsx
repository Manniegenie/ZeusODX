import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useUserProfile as useProfileHookMaybe } from '../hooks/useProfile';
import { useUserProfile as useProfileHookAltMaybe } from '../hooks/useProfile';

// ---- small helper so this works when your hook file is named either way
const useUserProfile = (opts?: any) =>
  (useProfileHookMaybe || useProfileHookAltMaybe)(opts);

/* ================= Bottom Sheet Base (90% height) ================= */

const EXTRA_BOTTOM_PADDING = 20; // tweak this to change the extra gap you want

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
  const SHEET_HEIGHT = Math.round(screenH * 0.9); // 90% screen height
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const insets = useSafeAreaInsets();

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

  // combined bottom padding: safe-area + extra gap
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
            },
          ]}
        >
          <View style={styles.handleBar} />
          {/* Safe area for bottom notch; content fills remaining height.
              We add explicit extra paddingBottom so content won't butt up to bottom */}
          <SafeAreaView style={{ flex: 1, paddingBottom: bottomPadding }} edges={['bottom']}>
            <KeyboardAvoidingView
              style={{ flex: 1, paddingBottom: 0 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              {children}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* ================= Tawk Chat Bottom Sheet (90%) ================= */

type TawkChatSheetProps = {
  visible: boolean;
  onClose: () => void;
  directLink?: string; // Tawk.to Direct Chat Link
  title?: string;
};

export function TawkChatSheet({
  visible,
  onClose,
  title = 'Support • ZeusODX',
  directLink = 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl',
}: TawkChatSheetProps) {
  const { profile, displayName } = useUserProfile({ auto: true });
  const userName = useMemo(() => displayName || profile?.fullName || profile?.username || '', [displayName, profile]);
  const userEmail = useMemo(() => profile?.email || profile?.contactEmail || '', [profile]);

  const [loading, setLoading] = useState(true);
  const webRef = useRef<any>(null);

  // Allow-list navigation targets (incl. about:blank/data/blob)
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

  // Prefill visitor info before content loads
  const injectedBefore = useMemo(
    () => `
    (function() {
      try {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.visitor = {
          name: ${JSON.stringify(userName || '')},
          email: ${JSON.stringify(userEmail || '')}
        };
      } catch (e) {}
    })();
    true;
  `,
    [userName, userEmail]
  );

  // Update attributes after mount (in case profile arrives late)
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

      {/* Web content fills remaining space */}
      <View style={styles.webContainer}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        )}

        <WebView
          ref={webRef}
          source={{ uri: directLink }}
          startInLoadingState
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlaybook
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={injectedBefore}
          onShouldStartLoadWithRequest={(req) => {
            if (allowInApp(req.url)) return true;
            Linking.openURL(req.url).catch(() => {});
            return false;
          }}
          // Android-specific optimizations for touch handling
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
          onTouchStart={() => {}} // Prevents touch conflicts
          bounces={false}
          // KEY FIXES for keyboard/input layer issues
          hideKeyboardAccessoryView={true}
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
  const { profile, displayName } = useUserProfile({ auto: true });
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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

  // Full-width bottom sheet, 90% height (set in-line), rounded top
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
    elevation: 10, // Android shadow/elevation
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  handleBar: { width: 42, height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 6 },

  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 6 },
  sheetTitle: {
    flex: 1,
    fontSize: 13,              // reduced from 15
    fontWeight: '600',         // slightly lighter
    color: '#111827',
    textAlign: 'center',
    fontFamily: (Typography?.medium as any) || 'System',
  },
  closeTxt: { fontSize: 14, color: '#6B7280', fontWeight: '600' }, // reduced from 16

  webContainer: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    backgroundColor: Colors.background || '#0b0b10',
    overflow: 'hidden', // Ensure WebView stays contained
  },

  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

export default TawkChatSheet;
