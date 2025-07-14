import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Image,
  Alert,
  Clipboard
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';

// Crypto Asset Icons
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const solIcon = require('../../components/icons/sol-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');
const avaxIcon = require('../../components/icons/avax-icon.png');
const bnbIcon = require('../../components/icons/bnb-icon.png');
const maticIcon = require('../../components/icons/matic-icon.png');
const ngnzIcon = require('../../components/icons/NGNZ.png');
const copyIcon = require('../../components/icons/copy-icon.png');
const internalWalletIcon = require('../../components/icons/internal-wallet.png');
const externalWalletIcon = require('../../components/icons/external-wallet.png');

interface TransferMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface WalletOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  address: string;
  network?: string;
  balance?: number;
}

interface DashboardModalsProps {
  showTransferModal: boolean;
  showWalletModal: boolean;
  onCloseTransferModal: () => void;
  onCloseWalletModal: () => void;
  onTransferMethodPress: (method: TransferMethod) => void;
  onWalletOptionPress: (wallet: WalletOption) => void;
  onActionButtonPress: (action: string) => void;
}

type WalletTab = 'fiat' | 'crypto';

export default function DashboardModals({
  showTransferModal,
  showWalletModal,
  onCloseTransferModal,
  onCloseWalletModal,
  onTransferMethodPress,
  onWalletOptionPress,
  onActionButtonPress,
}: DashboardModalsProps) {
  
  const [activeTab, setActiveTab] = useState<WalletTab>('crypto');
  
  // Get wallet data from useDashboard hook
  const {
    // Wallet addresses
    btcWalletAddress,
    ethWalletAddress,
    solWalletAddress,
    usdcBscWalletAddress,
    usdcEthWalletAddress,
    usdtBscWalletAddress,
    usdtEthWalletAddress,
    usdtTrxWalletAddress,
    ngnbWalletAddress,
    // Additional wallet objects for networks
    avaxBscWallet,
    bnbBscWallet,
    bnbEthWallet,
    maticEthWallet,
    // Balances
    btcBalance,
    ethBalance,
    solBalance,
    usdcBalance,
    usdtBalance,
    avaxBalance,
    bnbBalance,
    maticBalance,
    ngnbBalance,
  } = useDashboard();

  const transferMethods: TransferMethod[] = [
    {
      id: 'zeus',
      title: 'Send to ZeusODX Username',
      description: 'Fast and easy, transfer to another ZeusODX user',
      icon: internalWalletIcon
    },
    {
      id: 'external',
      title: 'Transfer to an external Wallet',
      description: 'Send to an outside wallet address',
      icon: externalWalletIcon
    }
  ];

  // Fiat wallets
  const fiatWallets: WalletOption[] = [
    {
      id: 'ngnz',
      name: 'Nigeria Naira',
      symbol: 'NGNZ',
      icon: ngnzIcon,
      address: '', // Fiat doesn't need address
      balance: ngnbBalance?.balance || 0,
    }
  ];

  // Crypto wallets
  const cryptoWallets: WalletOption[] = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: btcIcon,
      address: btcWalletAddress,
      network: 'Bitcoin',
      balance: btcBalance?.balance || 0,
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: ethIcon,
      address: ethWalletAddress,
      network: 'Ethereum',
      balance: ethBalance?.balance || 0,
    },
    {
      id: 'sol',
      name: 'Solana',
      symbol: 'SOL',
      icon: solIcon,
      address: solWalletAddress,
      network: 'Solana',
      balance: solBalance?.balance || 0,
    },
    {
      id: 'usdc_bsc',
      name: 'USD Coin',
      symbol: 'USDC (BSC)',
      icon: usdcIcon,
      address: usdcBscWalletAddress,
      network: 'BSC',
      balance: usdcBalance?.balance || 0,
    },
    {
      id: 'usdc_eth',
      name: 'USD Coin',
      symbol: 'USDC (ETH)',
      icon: usdcIcon,
      address: usdcEthWalletAddress,
      network: 'Ethereum',
      balance: usdcBalance?.balance || 0,
    },
    {
      id: 'usdt_bsc',
      name: 'USD Tether',
      symbol: 'USDT (BSC)',
      icon: usdtIcon,
      address: usdtBscWalletAddress,
      network: 'BSC',
      balance: usdtBalance?.balance || 0,
    },
    {
      id: 'usdt_eth',
      name: 'USD Tether',
      symbol: 'USDT (ETH)',
      icon: usdtIcon,
      address: usdtEthWalletAddress,
      network: 'Ethereum',
      balance: usdtBalance?.balance || 0,
    },
    {
      id: 'usdt_trx',
      name: 'USD Tether',
      symbol: 'USDT (TRX)',
      icon: usdtIcon,
      address: usdtTrxWalletAddress,
      network: 'Tron',
      balance: usdtBalance?.balance || 0,
    },
    {
      id: 'avax_bsc',
      name: 'Avalanche',
      symbol: 'AVAX (BSC)',
      icon: avaxIcon,
      address: avaxBscWallet?.address || '',
      network: 'BSC',
      balance: avaxBalance?.balance || 0,
    },
    {
      id: 'bnb_bsc',
      name: 'Binance Coin',
      symbol: 'BNB (BSC)',
      icon: bnbIcon,
      address: bnbBscWallet?.address || '',
      network: 'BSC',
      balance: bnbBalance?.balance || 0,
    },
    {
      id: 'bnb_eth',
      name: 'Binance Coin',
      symbol: 'BNB (ETH)',
      icon: bnbIcon,
      address: bnbEthWallet?.address || '',
      network: 'Ethereum',
      balance: bnbBalance?.balance || 0,
    },
    {
      id: 'matic_eth',
      name: 'Polygon',
      symbol: 'MATIC (ETH)',
      icon: maticIcon,
      address: maticEthWallet?.address || '',
      network: 'Ethereum',
      balance: maticBalance?.balance || 0,
    }
  ].filter(wallet => wallet.address && wallet.address !== '');

  const copyToClipboard = async (address: string, symbol: string): Promise<void> => {
    if (address === 'xxxx...xxxx' || address.startsWith('PLACEHOLDER')) {
      Alert.alert('Not Available', `${symbol} wallet address is not yet available`);
      return;
    }
    
    try {
      await Clipboard.setString(address);
      Alert.alert('Copied!', `${symbol} wallet address copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address to clipboard');
    }
  };

  const formatBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const truncateAddress = (address: string): string => {
    if (address === 'xxxx...xxxx' || address.startsWith('PLACEHOLDER')) {
      return 'xxxx...xxxx';
    }
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const renderTransferMethod = ({ item }: { item: TransferMethod }) => (
    <TouchableOpacity 
      style={styles.transferMethodItem}
      onPress={() => onTransferMethodPress(item)}
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
      onPress={() => {
        if (item.id === 'ngnz') {
          // Fiat wallet - no special action needed
          onWalletOptionPress(item);
          return;
        }
        if (item.address === 'xxxx...xxxx' || item.address.startsWith('PLACEHOLDER')) {
          Alert.alert('Not Available', `${item.symbol} wallet is not yet available`);
          return;
        }
        onWalletOptionPress(item);
      }}
    >
      <View style={styles.walletOptionLeft}>
        <View style={styles.walletIcon}>
          <Image source={item.icon} style={styles.walletIconImage} />
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletName}>{item.name}</Text>
          <Text style={styles.walletSymbol}>{item.symbol}</Text>
          {item.network && (
            <Text style={styles.walletNetwork}>{item.network} Network</Text>
          )}
          <Text style={styles.walletBalance}>
            Balance: {formatBalance(item.balance || 0)} {item.symbol.split(' ')[0]}
          </Text>
          {item.id !== 'ngnz' && (
            <Text style={styles.walletAddress}>{truncateAddress(item.address)}</Text>
          )}
        </View>
      </View>
      <View style={styles.walletActions}>
        {item.id !== 'ngnz' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (item.address === 'xxxx...xxxx' || item.address.startsWith('PLACEHOLDER')) {
                Alert.alert('Not Available', `${item.symbol} wallet is not yet available`);
                return;
              }
              copyToClipboard(item.address, item.symbol);
            }}
          >
            <Image source={copyIcon} style={styles.actionIcon} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const getCurrentWallets = (): WalletOption[] => {
    return activeTab === 'fiat' ? fiatWallets : cryptoWallets;
  };

  return (
    <>
      {/* Transfer Method Modal */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="slide"
        onRequestClose={onCloseTransferModal}
      >
        <TouchableWithoutFeedback onPress={onCloseTransferModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
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

      {/* Wallet Selection Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="slide"
        onRequestClose={onCloseWalletModal}
      >
        <TouchableWithoutFeedback onPress={onCloseWalletModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Wallet</Text>
                  <TouchableOpacity onPress={onCloseWalletModal}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Wallet Tabs */}
                <View style={styles.walletTabs}>
                  <TouchableOpacity 
                    onPress={() => setActiveTab('fiat')}
                    style={styles.tabButton}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === 'fiat' ? styles.activeTabText : styles.inactiveTabText
                    ]}>
                      Fiat
                    </Text>
                    {activeTab === 'fiat' && <View style={styles.activeTabIndicator} />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setActiveTab('crypto')}
                    style={styles.tabButton}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === 'crypto' ? styles.activeTabText : styles.inactiveTabText
                    ]}>
                      Crypto
                    </Text>
                    {activeTab === 'crypto' && <View style={styles.activeTabIndicator} />}
                  </TouchableOpacity>
                </View>

                {/* Wallet List */}
                <FlatList
                  data={getCurrentWallets()}
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
    height: '60%',
  },
  transferModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    height: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  modalTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: Colors.text.primary,
  },
  closeButton: {
    fontSize: 16,
    color: Colors.text.secondary,
    padding: Layout.spacing.sm,
  },
  transferMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.sm,
    backgroundColor: '#F8F9FA',
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.md,
  },
  transferMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  transferMethodIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  transferMethodContent: {
    flex: 1,
  },
  transferMethodTitle: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  transferMethodDescription: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  walletTabs: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    marginRight: Layout.spacing.xl,
    paddingBottom: Layout.spacing.sm,
    position: 'relative',
  },
  tabText: {
    fontFamily: Typography.medium,
    fontSize: 14,
  },
  activeTabText: {
    color: Colors.primary,
  },
  inactiveTabText: {
    color: Colors.text.secondary,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
  walletList: {
    paddingBottom: Layout.spacing.lg,
  },
  scrollableList: {
    flex: 1,
  },
  walletOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.sm,
    backgroundColor: '#F8F9FA',
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  walletOptionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  walletIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  walletSymbol: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  walletNetwork: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 4,
  },
  walletBalance: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  walletAddress: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
  },
  walletActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actionIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
});