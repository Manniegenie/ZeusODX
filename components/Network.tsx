import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  FlatList
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Typography } from '../constants/Typography';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
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

const NETWORK_LOGOS: Record<string, any> = {
  bitcoin:  require('../components/icons/btc-icon.png'),
  bsc:      require('../components/icons/bnb-icon.png'),
  ethereum: require('../components/icons/eth-icon.png'),
  arbitrum: require('../components/icons/eth-icon.png'),
  base:     require('../components/icons/eth-icon.png'),
  tron:     require('../components/icons/Tron.png'),
  trx:      require('../components/icons/Tron.png'),
  solana:   require('../components/icons/sol-icon.png'),
  ton:      require('../components/icons/ton-icon.png'),
  ngnz:     require('../components/icons/NGNZ.png'),
  polygon:  require('../components/icons/matic-icon.png'),
  matic:    require('../components/icons/matic-icon.png'),
};

export default function NetworkSelectionModal({
  visible,
  onClose,
  onNetworkSelect,
  selectedNetworkId,
  availableNetworks
}: NetworkSelectionModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const defaultNetworks: NetworkOption[] = [
    { id: 'ethereum', name: 'Ethereum (ETH)' },
    { id: 'tron',     name: 'Tron (TRX)' },
    { id: 'bitcoin',  name: 'Bitcoin' },
  ];

  const networks = availableNetworks || defaultNetworks;

  const handleNetworkPress = (network: NetworkOption) => {
    onNetworkSelect(network);
    onClose();
  };

  const renderNetworkOption = ({ item }: { item: NetworkOption }) => {
    const isSelected = selectedNetworkId === item.id;
    const logo = NETWORK_LOGOS[item.id.toLowerCase()];

    return (
      <TouchableOpacity
        style={[styles.networkItem, isSelected && styles.selectedNetworkItem]}
        onPress={() => handleNetworkPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.logoContainer}>
          {logo ? (
            <Image source={logo} style={styles.networkLogo} />
          ) : (
            <Text style={styles.logoFallback}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>

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
    borderBottomColor: '#E5E7EB',
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
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: colors.background,
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: 12,
  },
  selectedNetworkItem: {
    backgroundColor: '#EEF2FF',
  },
  logoContainer: {
    width: moderateScale(40, 0.1),
    height: moderateScale(40, 0.1),
    borderRadius: moderateScale(20, 0.1),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkLogo: {
    width: moderateScale(40, 0.1),
    height: moderateScale(40, 0.1),
    resizeMode: 'cover',
  },
  logoFallback: {
    fontSize: moderateScale(14, 0.1),
    fontWeight: '700',
    color: '#35297F',
    fontFamily: Typography.bold,
  },
  networkName: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
