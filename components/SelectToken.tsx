import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

// Icons
const btcIcon = require('../components/icons/btc-icon.png');
const ethIcon = require('../components/icons/eth-icon.png');
const solIcon = require('../components/icons/sol-icon.png');
const usdtIcon = require('../components/icons/usdt-icon.png');
const usdcIcon = require('../components/icons/usdc-icon.png');
const avaxIcon = require('../components/icons/avax-icon.png');
const bnbIcon = require('../components/icons/bnb-icon.png');
const maticIcon = require('../components/icons/matic-icon.png');
const ngnzIcon = require('../components/icons/NGNZ.png'); // ✅ NGNZ icon

export interface WalletOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
}

interface DepositTokenModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectToken: (token: WalletOption) => void;
  title?: string;
}

export default function DepositTokenModal({
  visible,
  onClose,
  onSelectToken,
  title = "Select Token"
}: DepositTokenModalProps) {
  
  // Tokens for deposit
  const cryptoWallets: WalletOption[] = [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: btcIcon },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: ethIcon },
    { id: 'sol', name: 'Solana', symbol: 'SOL', icon: solIcon },
    { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: usdcIcon },
    { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: usdtIcon },
    { id: 'avax', name: 'Avalanche', symbol: 'AVAX', icon: avaxIcon },
    { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', icon: bnbIcon },
    { id: 'matic', name: 'Polygon', symbol: 'MATIC', icon: maticIcon },
    { id: 'ngnz', name: 'NGNZ', symbol: 'NGNZ', icon: ngnzIcon }, // ✅ Added NGNZ
  ];

  const handleSelectToken = (token: WalletOption) => {
    onClose();
    onSelectToken(token);
  };

  const renderWalletOption = ({ item }: { item: WalletOption }) => (
    <TouchableOpacity
      style={styles.walletOptionItem}
      onPress={() => handleSelectToken(item)}
    >
      <View style={styles.walletOptionLeft}>
        <View style={styles.walletIcon}>
          <Image source={item.icon} style={styles.walletIconImage} />
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletName}>{item.name}</Text>
          <Text style={styles.walletSymbol}>{item.symbol}</Text>
        </View>
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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={cryptoWallets}
                renderItem={renderWalletOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.walletList}
                style={styles.scrollableList}
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
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: Colors.surface, 
    borderTopLeftRadius: Layout.borderRadius.xl, 
    borderTopRightRadius: Layout.borderRadius.xl, 
    padding: Layout.spacing.lg, 
    height: '50%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Layout.spacing.lg 
  },
  modalTitle: { 
    fontFamily: Typography.bold, 
    fontSize: 18, 
    color: Colors.text.primary 
  },
  closeButton: { 
    fontSize: 16, 
    color: Colors.text.secondary, 
    padding: Layout.spacing.sm 
  },
  walletList: { 
    paddingBottom: Layout.spacing.lg 
  },
  scrollableList: { 
    flex: 1 
  },
  walletOptionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Layout.spacing.md, 
    paddingHorizontal: Layout.spacing.sm, 
    backgroundColor: '#F8F9FA', 
    marginBottom: Layout.spacing.sm, 
    borderRadius: Layout.borderRadius.md 
  },
  walletOptionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Layout.spacing.md, 
    flex: 1 
  },
  walletIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    overflow: 'hidden' 
  },
  walletIconImage: { 
    width: 40, 
    height: 40, 
    resizeMode: 'cover' 
  },
  walletInfo: { 
    flex: 1 
  },
  walletName: { 
    fontFamily: Typography.medium, 
    fontSize: 14, 
    color: Colors.text.primary 
  },
  walletSymbol: { 
    fontFamily: Typography.regular, 
    fontSize: 12, 
    color: Colors.text.secondary 
  },
});
