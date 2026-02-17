// app/components/WalletPortfolioSection.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useDashboard } from '../../hooks/useDashboard';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';
import DashboardModals from './DashboardModals';

// Assets
const depositIcon = require('../../assets/images/depositicon.png');
const transferIcon = require('../../assets/images/Transfericon.png');
const swapIcon = require('../../assets/images/Buy:Sell.png');
const eyeIcon = require('../../components/icons/eye-icon.png');

type QuickLink = {
  id: 'deposit' | 'transfer' | 'buy-sell';
  title: string;
  icon: any;
  route?: string;
};

interface WalletPortfolioSectionProps {
  balanceVisible: boolean;
  onToggleBalanceVisibility: () => void;
}

export default function WalletPortfolioSection({
  balanceVisible,
  onToggleBalanceVisibility,
}: WalletPortfolioSectionProps) {
  const router = useRouter();

  // Dashboard-derived data
  const { totalPortfolioBalance, ngnzExchangeRate } = useDashboard();
  const safeBalance = totalPortfolioBalance || 0;
  const rate = ngnzExchangeRate ?? 1600;
  const balanceNGN = safeBalance * rate;

  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();

  const setCurrency = (currency: 'USD' | 'NGN') => {
    if (currency === displayCurrency) return;
    setDisplayCurrency(currency);
  };

  const formattedBalance =
    displayCurrency === 'USD'
      ? `$${safeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `₦${balanceNGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Modal state management - matching main dashboard exactly
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletOption | null>(null);

  // Quick actions
  const quickLinks: QuickLink[] = [
    { id: 'deposit',   title: 'Deposit',   icon: depositIcon },
    { id: 'transfer',  title: 'Transfer',  icon: transferIcon },
    { id: 'buy-sell',  title: 'Buy/Sell',  icon: swapIcon, route: '/user/Swap' },
  ];

  // Quick link handler - exactly matching main dashboard pattern
  const handleQuickLinkPress = (link: QuickLink) => {
    if (link.id === 'deposit') {
      setShowWalletModal(true);
    } else if (link.id === 'transfer') {
      setShowSelectTokenModal(true);
    } else {
      if (link.route) router.push(link.route);
    }
  };

  // Transfer flow
  const handleSelectTokenForTransfer = (token: WalletOption) => {
    setSelectedToken(token);
    setShowTransferMethodModal(true);
  };

  const handleTransferMethodSelect = (method: TransferMethod) => {
    if (!selectedToken) return;

    if (method.id === 'zeus') {
      router.push({
        pathname: '/user/usernametransfer',
        params: {
          tokenId: selectedToken.id,
          tokenName: selectedToken.name,
          tokenSymbol: selectedToken.symbol,
          transferMethod: 'zeus',
        },
      });
    } else if (method.id === 'external') {
      const isNGNZ =
        selectedToken.id?.toLowerCase() === 'ngnz' ||
        selectedToken.symbol?.toUpperCase() === 'NGNZ';

      router.push({
        pathname: isNGNZ ? '/user/FiatTransfer' : '/user/externaltransfer',
        params: {
          tokenId: selectedToken.id,
          tokenName: selectedToken.name,
          tokenSymbol: selectedToken.symbol,
          transferMethod: 'external',
        },
      });
    }

    setSelectedToken(null);
    setShowTransferMethodModal(false);
  };

  // Close helpers
  const closeSelectTokenModal = () => {
    setShowSelectTokenModal(false);
    setSelectedToken(null);
  };
  const closeTransferMethodModal = () => {
    setShowTransferMethodModal(false);
    setSelectedToken(null);
  };

  return (
    <View style={styles.container}>
      {/* Balance - bare to background */}
      <View style={styles.balanceContent}>
            <View style={styles.currencySwitch}>
              <TouchableOpacity
                style={[
                  styles.currencySegment,
                  displayCurrency === 'USD' && styles.currencySegmentActive,
                  displayCurrency === 'USD' && styles.currencySegmentActiveLeft,
                ]}
                onPress={() => setCurrency('USD')}
                activeOpacity={0.7}
              >
                <Text style={[styles.currencySegmentText, displayCurrency === 'USD' && styles.currencySegmentTextActive]}>
                  USD
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencySegment,
                  displayCurrency === 'NGN' && styles.currencySegmentActive,
                  displayCurrency === 'NGN' && styles.currencySegmentActiveRight,
                ]}
                onPress={() => setCurrency('NGN')}
                activeOpacity={0.7}
              >
                <Text style={[styles.currencySegmentText, displayCurrency === 'NGN' && styles.currencySegmentTextActive]}>
                  NGN
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? formattedBalance : '****'}
              </Text>
              <TouchableOpacity onPress={onToggleBalanceVisibility}>
                <Image source={eyeIcon} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickLinksContainer}>
        <View style={styles.quickLinksHeader}>
          <Text style={styles.quickLinksTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickLinksList}>
          {quickLinks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickLinkItem}
              onPress={() => handleQuickLinkPress(item)}
              activeOpacity={0.7}
            >
              <Image source={item.icon} style={styles.quickLinkIconImage} />
              <Text style={styles.quickLinkText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dashboard Modals - using same component as main dashboard */}
      <DashboardModals
        showTransferModal={false} // Not used in wallet section
        showWalletModal={showWalletModal}
        onCloseTransferModal={() => {}} // Not used in wallet section
        onCloseWalletModal={() => setShowWalletModal(false)}
        onTransferMethodPress={() => router.push('/user/come-soon')}
        onWalletOptionPress={() => router.push('/user/come-soon')}
        onActionButtonPress={() => router.push('/user/come-soon')}
        onWalletTabPress={() => router.push('/user/come-soon')}
      />

      {/* Transfer-specific modals */}
      <SelectTokenModal
        visible={showSelectTokenModal}
        onClose={closeSelectTokenModal}
        onSelectToken={handleSelectTokenForTransfer}
        title="Select Token to Transfer"
      />
      <TransferMethodModal
        visible={showTransferMethodModal}
        onClose={closeTransferMethodModal}
        onSelectMethod={handleTransferMethodSelect}
        title={`Send ${selectedToken?.name || 'Token'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Layout.spacing.lg },

  balanceContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  currencySwitch: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: 20,
    padding: 3,
    marginTop: -Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  currencySegment: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    minWidth: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySegmentActive: {
    backgroundColor: Colors.primary,
  },
  currencySegmentActiveLeft: {
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  currencySegmentActiveRight: {
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  currencySegmentText: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(11, 0.1),
    color: Colors.text.secondary,
  },
  currencySegmentTextActive: {
    color: Colors.surface,
  },
  balanceLabel: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(14, 0.1),
    color: '#000000',
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceAmount: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(32, 0.15),
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
  },
  eyeIcon: { width: 12, height: 12, tintColor: '#000000', marginLeft: 6 },

  // Quick links
  quickLinksContainer: { paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg },
  quickLinksHeader: { marginBottom: Layout.spacing.md },
  quickLinksTitle: { fontFamily: Typography.medium, fontSize: moderateScale(16, 0.1), color: Colors.text.primary },
  quickLinksList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xs,
  },
  quickLinkItem: { flex: 1, alignItems: 'center', gap: Layout.spacing.xs },
  quickLinkIconImage: { width: moderateScale(44, 0.1), height: moderateScale(44, 0.1), borderRadius: moderateScale(22, 0.1), resizeMode: 'contain' },
  quickLinkText: { fontFamily: Typography.regular, fontSize: moderateScale(12, 0.1), color: Colors.text.secondary, textAlign: 'center' },
});