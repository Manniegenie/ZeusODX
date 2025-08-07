import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Image,
  SafeAreaView
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

// Icons
const internalWalletIcon = require('../components/icons/internal-wallet.png');
const externalWalletIcon = require('../components/icons/external-wallet.png');

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
  title = "Choose Transfer Method"
}: TransferMethodModalProps) {

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

  const handleMethodPress = (method: TransferMethod) => {
    onClose();
    onSelectMethod(method);
  };

  const renderTransferMethod = ({ item }: { item: TransferMethod }) => (
    <TouchableOpacity
      style={styles.transferMethodItem}
      onPress={() => handleMethodPress(item)}
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheetContainer}>
              <View style={styles.dragHandle} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={transferMethods}
                renderItem={renderTransferMethod}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
              <SafeAreaView />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: { 
    backgroundColor: Colors.surface, 
    borderTopLeftRadius: Layout.borderRadius.xl * 1.155, 
    borderTopRightRadius: Layout.borderRadius.xl * 1.155, 
    padding: Layout.spacing.md * 1.155, 
    width: '100%',
    maxHeight: '63%', // slightly taller
  },
  dragHandle: {
    width: 52.5, // was 50
    height: 5.25, // was 5
    borderRadius: 2.6,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: Layout.spacing.sm * 1.05
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Layout.spacing.md * 1.155
  },
  modalTitle: { 
    fontFamily: Typography.bold, 
    fontSize: 16.3, // was 15.5
    color: Colors.text.primary 
  },
  closeButton: { 
    fontSize: 15, 
    color: Colors.text.secondary, 
    padding: Layout.spacing.xs * 1.155
  },
  transferMethodItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Layout.spacing.sm * 2, 
    paddingHorizontal: Layout.spacing.xs * 2, 
    backgroundColor: '#F0EFFF', 
    marginBottom: Layout.spacing.xs * 3, 
    borderRadius: Layout.borderRadius.sm * 3
  },
  transferMethodIcon: { 
    width: 42, 
    height: 42, 
    borderRadius: 19, 
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  transferMethodIconImage: { 
    width: 36.75, 
    height: 36.75, 
    resizeMode: 'cover' 
  },
  transferMethodContent: { 
    flex: 1, 
    marginLeft: Layout.spacing.sm * 1.155 
  },
  transferMethodTitle: { 
    fontFamily: Typography.medium, 
    fontSize: 12.7, 
    color: Colors.text.primary, 
    marginBottom: 1 
  },
  transferMethodDescription: { 
    fontFamily: Typography.regular, 
    fontSize: 11.55, 
    color: Colors.text.secondary 
  },
});
