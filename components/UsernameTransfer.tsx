import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useDashboard } from '../hooks/useDashboard';

// Asset imports
const btcIcon = require('../components/icons/btc-icon.png');
const ethIcon = require('../components/icons/eth-icon.png');
const solIcon = require('../components/icons/sol-icon.png');
const usdtIcon = require('../components/icons/usdt-icon.png');
const usdcIcon = require('../components/icons/usdc-icon.png');
const ngnzIcon = require('../components/icons/NGNZ.png');
const avaxIcon = require('../components/icons/avax-icon.png');
const bnbIcon = require('../components/icons/bnb-icon.png');
const maticIcon = require('../components/icons/matic-icon.png');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.6;

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  balance?: number;
}

interface SelectedUser {
  id: string;
  username: string;
  fullName: string;
}

interface TransferBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedUser: SelectedUser | null;
  defaultToken?: { id: string; name: string; symbol: string };
}

const TransferBottomSheet: React.FC<TransferBottomSheetProps> = ({
  visible,
  onClose,
  selectedUser,
  defaultToken,
}) => {
  const {
    btcBalance, ethBalance, solBalance,
    usdtBalance, usdcBalance, ngnzBalance,
  } = useDashboard();

  // Create tokenMap with useMemo to update when balances change
  const tokenMap = useMemo((): { [key: string]: TokenOption } => ({
    btc: { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: btcIcon, balance: btcBalance?.balance || 0 },
    eth: { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: ethIcon, balance: ethBalance?.balance || 0 },
    sol: { id: 'sol', name: 'Solana', symbol: 'SOL', icon: solIcon, balance: solBalance?.balance || 0 },
    usdt: { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: usdtIcon, balance: usdtBalance?.balance || 0 },
    usdc: { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: usdcIcon, balance: usdcBalance?.balance || 0 },
    ngnz: { id: 'ngnz', name: 'Nigerian Naira', symbol: 'NGNZ', icon: ngnzIcon, balance: ngnzBalance || 0 },
    avax: { id: 'avax', name: 'Avalanche', symbol: 'AVAX', icon: avaxIcon, balance: 0 },
    bnb: { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', icon: bnbIcon, balance: 0 },
    matic: { id: 'matic', name: 'Polygon', symbol: 'MATIC', icon: maticIcon, balance: 0 },
  }), [btcBalance, ethBalance, solBalance, usdtBalance, usdcBalance, ngnzBalance]);

  // Update selectedToken to use current balance data
  const selectedToken = useMemo(() => {
    const tokenId = defaultToken?.id || 'btc';
    return tokenMap[tokenId] || tokenMap['btc'];
  }, [defaultToken, tokenMap]);

  const [amount, setAmount] = useState('0');

  const translateY = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  const resetForm = () => setAmount('0');

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Pan to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > BOTTOM_SHEET_MIN_HEIGHT / 4) handleClose();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePercentage = (percentage: number) => {
    const balance = selectedToken?.balance || 0;
    setAmount(((balance * percentage) / 100).toString());
  };

  const handleReview = () => {
    console.log('Review transfer:', { amount, token: selectedToken, user: selectedUser });
    handleClose();
  };

  const formatUsdValue = (amt: string): string => {
    const numAmount = parseFloat(amt) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  const formatWithCommas = (value: string): string => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    if (isNaN(Number(numericValue))) return value;
    const [integer, decimal] = numericValue.split('.');
    const formattedInt = Number(integer).toLocaleString('en-US');
    return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
  };

  const handleAmountChange = (text: string) => setAmount(formatWithCommas(text));

  // Helper function to safely format balance
  const formatBalance = (balance: number | undefined, decimals: number = 4): string => {
    if (balance === undefined || balance === null || isNaN(balance)) {
      return '0.00';
    }
    return Number(balance).toFixed(decimals);
  };

  // Helper function to get safe balance value
  const getSafeBalance = (balance: number | undefined): number => {
    return balance && !isNaN(balance) ? balance : 0;
  };

  if (!selectedUser) return null;

  return (
    <Modal visible={visible} transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={styles.headerSection}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Transfer</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Amount & Token */}
            <View style={styles.inputSection}>
              <View style={styles.inputCard}>
                <View style={styles.inputLeft}>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onFocus={() => { if (amount === '0') setAmount(''); }}
                    onBlur={() => { if (!amount) setAmount('0'); }}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.text.secondary}
                  />
                  <Text style={styles.usdValue}>{formatUsdValue(amount)}</Text>
                </View>
                <View style={styles.tokenSelector}>
                  <View style={styles.tokenContainer}>
                    <Image source={selectedToken.icon} style={styles.tokenIcon} />
                    <Text style={styles.tokenText}>{selectedToken.symbol}</Text>
                  </View>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceText}>
                      {`${formatBalance(selectedToken.balance)} ${selectedToken.symbol}`}
                    </Text>
                    <TouchableOpacity onPress={() => setAmount(getSafeBalance(selectedToken.balance).toString())}>
                      <Text style={styles.maxText}>Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Percentages */}
            <View style={styles.percentageSection}>
              {[25, 50, 75, 100].map((percentage) => (
                <TouchableOpacity key={percentage} style={styles.percentageButton} onPress={() => handlePercentage(percentage)} activeOpacity={0.7}>
                  <Text style={styles.percentageText}>{percentage}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected User */}
            <View style={styles.userSection}>
              <View style={styles.userItem}>
                <View style={styles.avatarContainer}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userInitials}>
                      {selectedUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{selectedUser.fullName}</Text>
                    <Text style={styles.userUsername}>@{selectedUser.username}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Transfer button */}
            <View style={styles.reviewSection}>
              <TouchableOpacity style={styles.reviewButton} onPress={handleReview} activeOpacity={0.8}>
                <Text style={styles.reviewButtonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bottomSheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: BOTTOM_SHEET_MIN_HEIGHT, maxHeight: BOTTOM_SHEET_MAX_HEIGHT, paddingTop: 8 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  scrollView: { flex: 1 },
  headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Layout.spacing.md, paddingTop: Layout.spacing.sm, paddingBottom: Layout.spacing.lg },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: Layout.borderRadius.lg },
  closeButtonText: { fontSize: 16, color: Colors.text.primary, fontWeight: '500' },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  inputSection: { paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.md },
  inputCard: { backgroundColor: '#F8F9FA', borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 80 },
  inputLeft: { flex: 1, justifyContent: 'center', minWidth: 0 },
  amountInput: { fontFamily: Typography.medium, fontSize: 24, color: Colors.text.primary, fontWeight: '600', padding: 0, margin: 0, flexShrink: 1 },
  usdValue: { fontFamily: Typography.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },
  tokenSelector: { alignItems: 'flex-end', justifyContent: 'center', maxWidth: '50%' },
  tokenContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.sm, paddingVertical: Layout.spacing.xs },
  tokenIcon: { width: 18, height: 18, resizeMode: 'cover', marginRight: Layout.spacing.sm },
  tokenText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.text.primary, fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  balanceText: { fontFamily: Typography.regular, fontSize: 10, color: Colors.text.secondary },
  maxText: { fontFamily: Typography.medium, fontSize: 10, color: Colors.primary, fontWeight: '600' },
  percentageSection: { flexDirection: 'row', paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.xl, gap: Layout.spacing.sm },
  percentageButton: { flex: 1, backgroundColor: Colors.surface, borderRadius: Layout.borderRadius.md, paddingVertical: Layout.spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  percentageText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  userSection: { paddingHorizontal: Layout.spacing.xl, marginTop: Layout.spacing.xxl, alignItems: 'center', justifyContent: 'center', width: '100%' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.sm, justifyContent: 'center', alignSelf: 'center', gap: Layout.spacing.sm },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 17, height: 17, borderRadius: 30.59, backgroundColor: '#8075FF', alignItems: 'center', justifyContent: 'center' },
  userInitials: { color: '#FFFFFF', fontFamily: 'Bricolage Grotesque', fontSize: 8, fontWeight: '600' },
  textContainer: { alignItems: 'center', justifyContent: 'center' },
  userInfo: { width: 152, height: 34, alignItems: 'center', justifyContent: 'center' },
  userName: { color: Colors.text.primary, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, letterSpacing: 0, textAlign: 'center', marginBottom: 2 },
  userUsername: { color: Colors.text.secondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16, letterSpacing: 0, textAlign: 'center' },
  reviewSection: { paddingHorizontal: Layout.spacing.xl, paddingTop: Layout.spacing.xxl, paddingBottom: Layout.spacing.xl },
  reviewButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, alignItems: 'center' },
  reviewButtonText: { fontFamily: Typography.medium, fontSize: 16, color: Colors.surface, fontWeight: '600' },
});

export default TransferBottomSheet;