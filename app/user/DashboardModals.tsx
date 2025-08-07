import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// Icons
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const solIcon = require('../../components/icons/sol-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');
const avaxIcon = require('../../components/icons/avax-icon.png');
const bnbIcon = require('../../components/icons/bnb-icon.png');
const maticIcon = require('../../components/icons/matic-icon.png');
const internalWalletIcon = require('../../components/icons/internal-wallet.png');
const externalWalletIcon = require('../../components/icons/external-wallet.png');

interface WalletOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
}

interface TransferMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface DashboardModalsProps {
  showTransferModal: boolean;
  showWalletModal: boolean;
  onCloseTransferModal: () => void;
  onCloseWalletModal: () => void;
}

export default function DashboardModals({
  showTransferModal,
  showWalletModal,
  onCloseTransferModal,
  onCloseWalletModal,
}: DashboardModalsProps) {
  const router = useRouter();

  // Transfer options
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
  ];

  // Navigate to selected token wallet screen
  const handleSelectToken = (token: WalletOption) => {
    onCloseWalletModal();
    router.push({
      pathname: `/wallet-screens/${token.id}-wallet`,
      params: { openNetworkModal: 'true' },
    });
  };

  // Handle transfer method press
  const handleTransferPress = (method: TransferMethod) => {
    onCloseTransferModal();
    if (method.id === 'zeus') {
      router.push('/user/usernametransfer');
    } else if (method.id === 'external') {
      // Open wallet selection modal for external transfers
      setTimeout(() => {
        onCloseWalletModal();
      }, 100);
    }
  };

  const renderTransferMethod = ({ item }: { item: TransferMethod }) => (
    <TouchableOpacity
      style={styles.transferMethodItem}
      onPress={() => handleTransferPress(item)}
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
    <>
      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="slide"
        onRequestClose={onCloseTransferModal}
      >
        <TouchableWithoutFeedback onPress={onCloseTransferModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.transferModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Transfer Method</Text>
                  <TouchableOpacity onPress={onCloseTransferModal}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={transferMethods}
                  renderItem={renderTransferMethod}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Deposit Token Selection Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="slide"
        onRequestClose={onCloseWalletModal}
      >
        <TouchableWithoutFeedback onPress={onCloseWalletModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Token</Text>
                  <TouchableOpacity onPress={onCloseWalletModal}>
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
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Layout.borderRadius.xl, borderTopRightRadius: Layout.borderRadius.xl, padding: Layout.spacing.lg, height: '50%' },
  transferModalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Layout.borderRadius.xl, borderTopRightRadius: Layout.borderRadius.xl, padding: Layout.spacing.lg, height: '40%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.lg },
  modalTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.text.primary },
  closeButton: { fontSize: 16, color: Colors.text.secondary, padding: Layout.spacing.sm },
  transferMethodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Layout.spacing.md, paddingHorizontal: Layout.spacing.sm, backgroundColor: '#F8F9FA', marginBottom: Layout.spacing.sm, borderRadius: Layout.borderRadius.md },
  transferMethodIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  transferMethodIconImage: { width: 40, height: 40, resizeMode: 'cover' },
  transferMethodContent: { flex: 1, marginLeft: Layout.spacing.md },
  transferMethodTitle: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.primary, marginBottom: 2 },
  transferMethodDescription: { fontFamily: Typography.regular, fontSize: 12, color: Colors.text.secondary },
  walletList: { paddingBottom: Layout.spacing.lg },
  scrollableList: { flex: 1 },
  walletOptionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Layout.spacing.md, paddingHorizontal: Layout.spacing.sm, backgroundColor: '#F8F9FA', marginBottom: Layout.spacing.sm, borderRadius: Layout.borderRadius.md },
  walletOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.md, flex: 1 },
  walletIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  walletIconImage: { width: 40, height: 40, resizeMode: 'cover' },
  walletInfo: { flex: 1 },
  walletName: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.primary },
  walletSymbol: { fontFamily: Typography.regular, fontSize: 12, color: Colors.text.secondary },
});
