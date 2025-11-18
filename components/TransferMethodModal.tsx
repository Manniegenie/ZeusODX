// components/TransferMethodModal.tsx
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

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
                  { transform: [{ translateY: slideAnim }] },
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
                  { height: insets.bottom },
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignSelf: 'center',
    width: '100%',
  },

  modalContainer: {
    width: '100%',
    height: MODAL_HEIGHT,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },
  safeAreaExtension: { backgroundColor: Colors.surface || '#FFFFFF', alignSelf: 'center', width: '100%' },

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
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Typography.bold || 'System',
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
  },
  closeButton: {
    fontSize: 16,
    color: Colors.text?.secondary || '#6B7280',
    padding: 6,
  },

  listContent: {
    paddingBottom: 24,
  },

  transferMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#F0EFFF',
    marginBottom: 12,
    borderRadius: 16,
  },
  transferMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary || '#35297F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferMethodIconImage: { width: 28, height: 28, resizeMode: 'contain' },
  transferMethodContent: { flex: 1, marginLeft: 12 },
  transferMethodTitle: {
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    color: Colors.text?.primary || '#111827',
    marginBottom: 4,
  },
  transferMethodDescription: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    color: Colors.text?.secondary || '#6B7280',
  },
});
