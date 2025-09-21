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
import { useDashboard } from '../hooks/useDashboard';

// Crypto Asset Icons
const btcIcon = require('../components/icons/btc-icon.png');
const ethIcon = require('../components/icons/eth-icon.png');
const solIcon = require('../components/icons/sol-icon.png');
const usdtIcon = require('../components/icons/usdt-icon.png');
const usdcIcon = require('../components/icons/usdc-icon.png');
const avaxIcon = require('../components/icons/avax-icon.png');
const bnbIcon = require('../components/icons/bnb-icon.png');
const maticIcon = require('../components/icons/matic-icon.png');
const ngnzIcon = require('../components/icons/NGNZ.png');
const checkIcon = require('../components/icons/Check-icon.png');

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  price?: number;
  balance?: number;
}

interface ChooseTokenModalProps {
  visible: boolean;
  onClose: () => void;
  onTokenSelect: (token: TokenOption) => void;
  selectedTokenId?: string;
  title?: string;
  showBalances?: boolean;
  validTokens?: string[];
}

export default function ChooseTokenModal({
  visible,
  onClose,
  onTokenSelect,
  selectedTokenId,
  title = "Choose token",
  showBalances = false,
  validTokens
}: ChooseTokenModalProps) {

  // Get data from useDashboard hook
  const {
    btcPrice,
    ethPrice,
    solPrice,
    usdtPrice,
    usdcPrice,
    avaxPrice,
    bnbPrice,
    maticPrice,
    ngnzExchangeRate,
    // Balances
    btcBalance,
    ethBalance,
    solBalance,
    usdtBalance,
    usdcBalance,
    avaxBalance,
    bnbBalance,
    maticBalance,
    ngnzBalance,
  } = useDashboard();

  // Token options based on your existing data
  const allTokenOptions: TokenOption[] = [
    {
      id: 'ngnz',
      name: 'Nigeria Naira',
      symbol: 'NGNZ',
      icon: ngnzIcon,
      price: ngnzExchangeRate?.rate || 1,
      balance: ngnzBalance?.balance || 0,
    },
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: btcIcon,
      price: btcPrice,
      balance: btcBalance?.balance || 0,
    },
    {
      id: 'usdt',
      name: 'Tether USD',
      symbol: 'USDT',
      icon: usdtIcon,
      price: usdtPrice,
      balance: usdtBalance?.balance || 0,
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: ethIcon,
      price: ethPrice,
      balance: ethBalance?.balance || 0,
    },
    {
      id: 'sol',
      name: 'Solana',
      symbol: 'SOL',
      icon: solIcon,
      price: solPrice,
      balance: solBalance?.balance || 0,
    },
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: usdcIcon,
      price: usdcPrice,
      balance: usdcBalance?.balance || 0,
    },
    {
      id: 'bnb',
      name: 'BNB',
      symbol: 'BNB',
      icon: bnbIcon,
      price: bnbPrice,
      balance: bnbBalance?.balance || 0,
    },
    {
      id: 'avax',
      name: 'Avalanche',
      symbol: 'AVAX',
      icon: avaxIcon,
      price: avaxPrice,
      balance: avaxBalance?.balance || 0,
    },
    {
      id: 'matic',
      name: 'Polygon',
      symbol: 'MATIC',
      icon: maticIcon,
      price: maticPrice,
      balance: maticBalance?.balance || 0,
    },
  ];

  // Filter tokens based on price availability and valid token list
  const tokenOptions = allTokenOptions.filter(token => {
    // Always show NGNZ regardless of price
    if (token.symbol === 'NGNZ') {
      return true;
    }
    // For other tokens, require valid price
    return token.price && token.price > 0;
  }).filter(token => {
    // Filter by validTokens if provided
    if (validTokens && validTokens.length > 0) {
      return validTokens.includes(token.symbol);
    }
    // Show all tokens if no validTokens filter is provided
    return true;
  });

  const formatBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const renderTokenOption = ({ item }: { item: TokenOption }) => {
    const isSelected = selectedTokenId === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.tokenItem,
          isSelected && styles.selectedTokenItem
        ]}
        onPress={() => onTokenSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tokenLeft}>
          <View style={[
            styles.tokenIconContainer,
            isSelected && styles.selectedTokenIconContainer
          ]}>
            <Image source={item.icon} style={styles.tokenIcon} />
          </View>
          <View style={styles.tokenInfo}>
            <Text style={[
              styles.tokenName,
              isSelected && styles.selectedTokenName
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.tokenSymbol,
              isSelected && styles.selectedTokenSymbol
            ]}>
              {item.symbol}
            </Text>
            {showBalances && (
              <Text style={styles.tokenBalance}>
                Balance: {formatBalance(item.balance || 0)} {item.symbol}
              </Text>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.checkIconContainer}>
            <View style={styles.checkIcon}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
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
              {/* Drag Handle */}
              <View style={styles.dragHandle} />
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Token List */}
              <FlatList
                data={tokenOptions}
                renderItem={renderTokenOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.tokenList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    width: '100%',
    height: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 25,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Layout.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  tokenList: {
    paddingBottom: Layout.spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Layout.spacing.xs,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'transparent',
    marginVertical: Layout.spacing.xs,
  },
  selectedTokenItem: {
    backgroundColor: '#F0F7FF',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
    overflow: 'hidden',
  },
  selectedTokenIconContainer: {
    backgroundColor: 'transparent',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontFamily: Typography.semibold,
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  selectedTokenName: {
    color: '#6366F1',
  },
  tokenSymbol: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  selectedTokenSymbol: {
    color: '#6366F1',
  },
  tokenBalance: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  checkIconContainer: {
    marginLeft: Layout.spacing.sm,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});