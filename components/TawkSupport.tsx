import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Linking,
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

import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { Typography } from '../constants/Typography';
import { useUserProfile } from '../hooks/useProfile';


/* ================= Tawk Context ================= */

type TawkContextType = { open: () => void; close: () => void };
const TawkContext = createContext<TawkContextType>({ open: () => {}, close: () => {} });

export function useTawk() {
  return useContext(TawkContext);
}

/* ================= Provider (place once in _layout.tsx, inside AuthContext) ================= */

type TawkProviderProps = {
  children: React.ReactNode;
  directLink?: string;
  title?: string;
};

export function TawkProvider({
  children,
  directLink = 'https://tawk.to/chat/68b186eb517e5918ffb583a8/1j3qne2kl',
  title = 'Support • ZeusODX',
}: TawkProviderProps) {
  const [visible, setVisible] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  const open = useCallback(() => {
    setHasEverOpened(true);
    setVisible(true);
  }, []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <TawkContext.Provider value={{ open, close }}>
      {children}
      {/* Overlay is only mounted after first open, then stays alive forever */}
      {hasEverOpened && (
        <TawkOverlay visible={visible} onClose={close} directLink={directLink} title={title} />
      )}
    </TawkContext.Provider>
  );
}

/* ================= Persistent overlay — no Modal, WebView never unmounts ================= */

type TawkOverlayProps = {
  visible: boolean;
  onClose: () => void;
  directLink: string;
  title: string;
};

function TawkOverlay({ visible, onClose, directLink, title }: TawkOverlayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { height: screenH } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenH)).current;
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Only interactive once open animation starts; stops after close animation finishes
  const [isInteractable, setIsInteractable] = useState(false);

  const { profile, displayName } = useUserProfile();
  const p = profile as any;
  const userName = useMemo(
    () => displayName || p?.fullName || p?.username || '',
    [displayName, p]
  );
  const userEmail = useMemo(
    () => p?.email || p?.contactEmail || '',
    [p]
  );

  const [loading, setLoading] = useState(true);
  const webRef = useRef<any>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsInteractable(true);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }).start();
    } else {
      Animated.timing(translateY, { toValue: screenH, duration: 220, useNativeDriver: true }).start(() =>
        setIsInteractable(false)
      );
    }
  }, [visible, screenH]);

  // Push visitor identity each time the sheet opens (Tawk is already loaded; session persists)
  useEffect(() => {
    if (!visible || !webRef.current) return;
    const js = `
      try {
        window.Tawk_API = window.Tawk_API || {};
        if (typeof window.Tawk_API.setAttributes === 'function') {
          window.Tawk_API.setAttributes(
            { name: ${JSON.stringify(userName || '')}, email: ${JSON.stringify(userEmail || '')} },
            function(){}
          );
        }
      } catch(e) {}
      true;
    `;
    const t = setTimeout(() => webRef.current?.injectJavaScript(js), 400);
    return () => clearTimeout(t);
  }, [visible, userName, userEmail]);

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

  const injectedBefore = useMemo(
    () => `
    (function() {
      try {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.visitor = {
          name: ${JSON.stringify(userName || '')},
          email: ${JSON.stringify(userEmail || '')}
        };
        const style = document.createElement('style');
        style.textContent = \`
          .tawk-textarea-wrapper, .tawk-input-container,
          textarea[placeholder*="Type your message"], textarea[placeholder*="type"] {
            max-height: 120px !important; min-height: 44px !important;
          }
          .tawk-textarea, .tawk-min-container textarea, .tawk-composer textarea {
            max-height: 100px !important; overflow-y: auto !important;
          }
          .tawk-min-container, .tawk-chat-panel {
            max-height: 100% !important; display: flex !important; flex-direction: column !important;
          }
          .tawk-message-list, .tawk-messages-container {
            flex: 1 !important; overflow-y: auto !important; min-height: 0 !important;
          }
          .tawk-composer-area, .tawk-form-container, .tawk-input-area {
            flex: 0 0 auto !important; max-height: 140px !important;
          }
          html, body { height: 100% !important; overflow: hidden !important; }
        \`;
        document.head.appendChild(style);
      } catch (e) {}
    })();
    true;
  `,
    [userName, userEmail]
  );

  return (
    <Animated.View
      pointerEvents={isInteractable ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        styles.chatContainer,
        { zIndex: 999, transform: [{ translateY }] },
      ]}
    >
      {/* Full-screen chat, anchored from the TOP: the header can never be pushed
          off-screen by the keyboard. The WebView below shrinks above the keyboard. */}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.titleRow}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.webContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0 }]}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
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
            nestedScrollEnabled
            androidLayerType="hardware"
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            keyboardDisplayRequiresUserAction={false}
            onTouchStart={() => {}}
            bounces={false}
            hideKeyboardAccessoryView={false}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            scrollEnabled
            userAgent={
              Platform.select({
                android: 'Mozilla/5.0 (Linux; Android 12; rv:109.0) Gecko/109.0 Firefox/109.0',
                ios: undefined,
                default: undefined,
              }) as string | undefined
            }
          />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

/* ================= Styles ================= */

const makeStyles = (colors: AppColors) => StyleSheet.create({
  chatContainer: {
    backgroundColor: colors.card,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  sheetTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    fontFamily: (Typography?.medium as any) || 'System',
  },

  closeTxt: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: '400',
    lineHeight: 22,
  },

  webContainer: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },

  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    zIndex: 2,
  },
});
