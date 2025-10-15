import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import BaseModal from './ui/BaseModal';

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
        style={[
          styles.networkItem,
          isSelected && styles.selectedNetworkItem
        ]}
        onPress={() => handleNetworkPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.networkInfo}>
          <Text style={styles.networkName}>{item.name}</Text>
          {item.feeUsd && (
            <Text style={styles.networkFee}>Fee: ~${item.feeUsd.toFixed(2)}</Text>
          )}
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
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
    <BaseModal
      visible={visible}
      onClose={onClose}
      type="bottom"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Select Network{tokenSymbol ? ` for ${tokenSymbol}` : ''}
          </Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {renderContent()}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    maxHeight: '70%',
    minHeight: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg || 16,
    paddingVertical: Layout.spacing.md || 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: Typography.bold || 'System',
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: Layout.spacing.xs || 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '500',
  },
  networkList: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg || 16,
    paddingHorizontal: Layout.spacing.lg || 16,
    backgroundColor: '#F0EFFF',
    marginBottom: Layout.spacing.sm || 8,
    marginHorizontal: Layout.spacing.md || 12,
    borderRadius: Layout.borderRadius?.md || 8,
  },
  selectedNetworkItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.primary || '#35297F',
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  networkFee: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '400',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary || '#35297F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.surface || '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  networkLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl || 24,
  },
  networkLoadingText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    marginTop: Layout.spacing.md || 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl || 24,
  },
  emptyText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    textAlign: 'center',
    marginBottom: Layout.spacing.md || 12,
  },
  retryButton: {
    backgroundColor: Colors.primary || '#35297F',
    borderRadius: Layout.borderRadius?.md || 8,
    paddingVertical: Layout.spacing.sm || 8,
    paddingHorizontal: Layout.spacing.lg || 16,
  },
  retryButtonText: {
    color: Colors.surface || '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkSelectionModal;
