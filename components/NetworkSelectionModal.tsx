import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

const TOKEN_ICONS: Record<string, any> = {
  BTC:  require('./icons/btc-icon.png'),
  ETH:  require('./icons/eth-icon.png'),
  SOL:  require('./icons/sol-icon.png'),
  USDT: require('./icons/usdt-icon.png'),
  USDC: require('./icons/usdc-icon.png'),
  TRX:  require('./icons/Tron.png'),
  BNB:  require('./icons/bnb-icon.png'),
  MATIC:require('./icons/matic-icon.png'),
  TON:  require('./icons/ton-icon.png'),
  NGNZ: require('./icons/NGNZ.png'),
  AVAX: require('./icons/avax-icon.png'),
};

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const handleNetworkPress = (network: NetworkOption) => {
    onSelectNetwork(network);
    onClose();
  };

  const renderNetworkOption = ({ item }: { item: NetworkOption }) => {
    const isSelected = selectedNetwork?.id === item.id || selectedNetwork?.code === item.code;
    const tokenIcon = tokenSymbol ? TOKEN_ICONS[tokenSymbol.toUpperCase()] : null;

    return (
      <TouchableOpacity
        style={[styles.networkItem, isSelected && styles.networkItemSelected]}
        onPress={() => handleNetworkPress(item)}
        activeOpacity={0.7}
      >
        {tokenIcon && (
          <View style={styles.networkTokenIconWrap}>
            <Image source={tokenIcon} style={styles.networkTokenIcon} />
          </View>
        )}
        <View style={styles.networkInfo}>
          <Text style={styles.networkName}>{item.name}</Text>
          {item.feeUsd && (
            <Text style={styles.networkFee}>Fee: ~${item.feeUsd.toFixed(2)}</Text>
          )}
        </View>
        {isSelected && <Text style={styles.checkMark}>✓</Text>}
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
      <ActivityIndicator size="large" color={colors.primary} />
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
                <View style={styles.modalTitleRow}>
                  {tokenSymbol && TOKEN_ICONS[tokenSymbol.toUpperCase()] && (
                    <Image source={TOKEN_ICONS[tokenSymbol.toUpperCase()]} style={styles.modalTokenIcon} />
                  )}
                  <Text style={styles.modalTitle}>
                    {tokenSymbol ? `${tokenSymbol} Networks` : 'Select Network'}
                  </Text>
                </View>
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

const makeStyles = (colors: AppColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTokenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  modalTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  closeButtonContainer: {
    padding: Layout.spacing.xs,
  },
  closeButton: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  networkList: {
    paddingBottom: Layout.spacing.sm,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: colors.card,
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: 10,
  },
  networkItemSelected: {
    backgroundColor: colors.separator,
  },
  networkTokenIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  networkTokenIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  networkInfo: {
    flex: 1,
  },
  checkMark: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  networkName: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  networkFee: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
  },
  retryButtonText: {
    color: colors.card,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkSelectionModal;
