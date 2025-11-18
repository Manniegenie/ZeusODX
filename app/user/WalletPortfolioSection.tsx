// app/components/WalletPortfolioSection.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardModals from './DashboardModals';

// Assets
const depositIcon    = require('../../components/icons/deposit-icon.png');
const transferIcon   = require('../../components/icons/transfer-icon.png');
const swapIcon       = require('../../components/icons/swap-icon.png');
const portfolioBg    = require('../../assets/images/portfolio-bgg.jpg');
const eyeIcon        = require('../../components/icons/eye-icon.png');

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
  const { totalPortfolioBalance } = useDashboard();
  const safeBalance = totalPortfolioBalance || 0;
  const formattedUsdBalance = `$${safeBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <ImageBackground
          source={portfolioBg}
          style={styles.balanceBackground}
          imageStyle={styles.balanceBackgroundImage}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? formattedUsdBalance : '****'}
              </Text>
              <TouchableOpacity onPress={onToggleBalanceVisibility}>
                <Image source={eyeIcon} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
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

  // Balance card
  balanceCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  balanceBackground: { height: 151, justifyContent: 'center', backgroundColor: '#4A3FAD' },
  balanceBackgroundImage: { borderRadius: Layout.borderRadius.lg },
  balanceContent: {
    padding: Layout.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  balanceLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.surface,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceAmount: {
    fontFamily: Typography.medium,
    fontSize: 32,
    color: Colors.surface,
    fontWeight: '500',
    textAlign: 'center',
  },
  eyeIcon: { width: 12, height: 12, tintColor: Colors.surface, marginLeft: 6 },

  // Quick links
  quickLinksContainer: { paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg },
  quickLinksHeader: { marginBottom: Layout.spacing.md },
  quickLinksTitle: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.primary },
  quickLinksList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xs,
  },
  quickLinkItem: { flex: 1, alignItems: 'center', gap: Layout.spacing.xs },
  quickLinkIconImage: { width: 44, height: 44, borderRadius: 22, resizeMode: 'contain' },
  quickLinkText: { fontFamily: Typography.regular, fontSize: 10, color: Colors.text.secondary, textAlign: 'center' },
});