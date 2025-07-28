import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Modal,
  FlatList
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

interface NetworkOption {
  id: string;
  name: string;
  isActive?: boolean;
}

interface NetworkSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onNetworkSelect: (network: NetworkOption) => void;
  selectedNetworkId?: string;
  availableNetworks?: NetworkOption[];
}

export default function NetworkSelectionModal({
  visible,
  onClose,
  onNetworkSelect,
  selectedNetworkId,
  availableNetworks
}: NetworkSelectionModalProps) {

  const defaultNetworks: NetworkOption[] = [
    {
      id: 'ethereum',
      name: 'Ethereum (ETH)',
    },
    {
      id: 'tron',
      name: 'Tron (Trx)',
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
    }
  ];

  const networks = availableNetworks || defaultNetworks;

  const handleNetworkPress = (network: NetworkOption) => {
    onNetworkSelect(network);
    onClose();
  };

  const renderNetworkOption = ({ item }: { item: NetworkOption }) => {
    const isSelected = selectedNetworkId === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.networkItem,
          isSelected && styles.selectedNetworkItem
        ]}
        onPress={() => handleNetworkPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.networkName}>{item.name}</Text>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Network</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={networks}
                renderItem={renderNetworkOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.networkList}
              />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    width: '100%',
    height: '45%',
    minHeight: '45%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    paddingBottom: Layout.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  closeButtonContainer: {
    padding: Layout.spacing.xs,
  },
  closeButton: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  networkList: {
    paddingBottom: Layout.spacing.sm,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: '#F0EFFF',
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  selectedNetworkItem: {
    backgroundColor: '#EEF2FF',
  },
  networkName: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: 'bold',
  },
});