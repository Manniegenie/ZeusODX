// components/TransferMethodModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const internalWalletIcon = require('../components/icons/internal-wallet.png');
const externalWalletIcon = require('../components/icons/external-wallet.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// ↓↓↓ smaller height here
const MODAL_HEIGHT = 250;

export interface TransferMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface TransferMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMethod: (method: TransferMethod) => void;
  title?: string;
}

export default function TransferMethodModal({
  visible,
  onClose,
  onSelectMethod,
  title = 'Choose Transfer Method',
}: TransferMethodModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const transferMethods: TransferMethod[] = [
    {
      id: 'zeus',
      title: 'Send to ZeusODX Username',
      description: 'Fast and easy, transfer to another ZeusODX user',
      icon: internalWalletIcon,
    },
    {
      id: 'external',
      title: 'Transfer to an external wallet',
      description: 'Send to an outside wallet address',
      icon: externalWalletIcon,
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleMethodPress = (method: TransferMethod) => {
    onClose();
    onSelectMethod(method);
  };

  const renderTransferMethod = ({ item }: { item: TransferMethod }) => (
    <TouchableOpacity
      style={styles.transferMethodItem}
      onPress={() => handleMethodPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.transferMethodIcon}>
        <Image source={item.icon} style={styles.transferMethodIconImage} />
      </View>
      <View style={styles.transferMethodContent}>
        <Text style={styles.transferMethodTitle}>{item.title}</Text>
        <Text style={styles.transferMethodDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  { transform: [{ translateY: slideAnim }], width: Math.min(393, SCREEN_WIDTH) },
                ]}
              >
                <View className="handle">
                  <View style={styles.handleBar} />
                </View>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={transferMethods}
                  renderItem={renderTransferMethod}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                />
              </Animated.View>

              {/* bottom safe area in white so the sheet reaches the very end */}
              <View
                style={[
                  styles.safeAreaExtension,
                  { height: insets.bottom, width: Math.min(393, SCREEN_WIDTH) },
                ]}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrapper: { alignSelf: 'center' },

  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: (Layout.spacing?.md || 12) * 1.155,
    paddingTop: (Layout.spacing?.md || 12) * 1.155,
    overflow: 'hidden',
  },
  safeAreaExtension: { backgroundColor: Colors.surface || '#FFFFFF', alignSelf: 'center' },

  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: (Layout.spacing?.md || 12) * 1.155,
  },
  modalTitle: {
    fontFamily: Typography.bold || 'System',
    fontSize: 16.3,
    color: Colors.text?.primary || '#111827',
  },
  closeButton: {
    fontSize: 15,
    color: Colors.text?.secondary || '#6B7280',
    padding: (Layout.spacing?.xs || 6) * 1.155,
  },

  listContent: {
    paddingBottom: (Layout.spacing?.md || 12),
  },

  transferMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: (Layout.spacing?.sm || 8) * 2,
    paddingHorizontal: (Layout.spacing?.xs || 6) * 2,
    backgroundColor: '#F0EFFF',
    marginBottom: (Layout.spacing?.xs || 6) * 3,
    borderRadius: (Layout.borderRadius?.sm || 6) * 3,
  },
  transferMethodIcon: {
    width: 42,
    height: 42,
    borderRadius: 19,
    backgroundColor: Colors.primary || '#35297F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferMethodIconImage: { width: 36.75, height: 36.75, resizeMode: 'cover' },
  transferMethodContent: { flex: 1, marginLeft: (Layout.spacing?.sm || 8) * 1.155 },
  transferMethodTitle: {
    fontFamily: Typography.medium || 'System',
    fontSize: 12.7,
    color: Colors.text?.primary || '#111827',
    marginBottom: 1,
  },
  transferMethodDescription: {
    fontFamily: Typography.regular || 'System',
    fontSize: 11.55,
    color: Colors.text?.secondary || '#6B7280',
  },
});
