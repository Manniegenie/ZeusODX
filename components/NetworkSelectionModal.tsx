import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

interface NetworkOption {
  id: string;
  name: string;
  code: string;
  feeUsd?: number;
  isActive?: boolean;
}

interface NetworkSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectNetwork: (network: NetworkOption) => void;
  selectedNetwork?: NetworkOption | null;
  networks: NetworkOption[];
  isLoading: boolean;
  error?: Error | null;
  tokenSymbol?: string;
}

const NetworkSelectionModal: React.FC<NetworkSelectionModalProps> = ({
  visible,
  onClose,
  onSelectNetwork,
  selectedNetwork,
  networks,
  isLoading,
  error,
  tokenSymbol,
}) => {
  const handleNetworkPress = (network: NetworkOption) => {
    onSelectNetwork(network);
    onClose();
  };

  const renderNetworkOption = ({ item }: { item: NetworkOption }) => {
    const isSelected = selectedNetwork?.id === item.id || selectedNetwork?.code === item.code;
    
    return (
      <TouchableOpacity 
        style={styles.networkItem}
        onPress={() => handleNetworkPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.networkInfo}>
          <Text style={styles.networkName}>{item.name}</Text>
          {item.feeUsd && (
            <Text style={styles.networkFee}>Fee: ~${item.feeUsd.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error?.message 
          ? `Failed to load networks${tokenSymbol ? ` for ${tokenSymbol}` : ''}`
          : `No networks available${tokenSymbol ? ` for ${tokenSymbol}` : ''}`
        }
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={onClose}>
          <Text style={styles.retryButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.networkLoadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.networkLoadingText}>Loading networks...</Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (error || networks.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={networks}
        renderItem={renderNetworkOption}
        keyExtractor={(item) => item.id || item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.networkList}
      />
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
                <Text style={styles.modalTitle}>
                  Select Network{tokenSymbol ? ` for ${tokenSymbol}` : ''}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {renderContent()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

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
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  networkFee: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  networkLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  networkLoadingText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
  },
  retryButtonText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkSelectionModal;
