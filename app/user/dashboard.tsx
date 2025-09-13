import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomTabNavigator from '../../components/BottomNavigator';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { apiClient } from '../../services/apiClient'; // Add this import
import DashboardHeader from './DashboardHeader';
import DashboardModals from './DashboardModals';
import PortfolioSection from './PortfolioSection';
import TokensSection from './TokensSection';

import TawkChatSheet from '../../components/TawkSupport';
import headphonesIcon from '../../components/icons/chat.png'; // round icon asset with your brand color baked in

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State management
  const [activeTab, setActiveTab] = useState('All tokens');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletOption | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Support modal
  const [supportOpen, setSupportOpen] = useState(false);

  // Dashboard data
  const { refreshDashboard, loading, kyc } = useDashboard();

  // KYC initiation handler
  const handleKYCInitiate = async (level: number, documentType: string) => {
    console.log(`🚀 KYC Level ${level} with ${documentType} - Navigation to KYC flow`);
    router.push('/user/kyc-flow');
  };

  // Quick link navigation handler
  const handleQuickLinkPress = (link: any) => {
    if (link.id === 'deposit') {
      setShowWalletModal(true);
    } else if (link.id === 'transfer') {
      setShowSelectTokenModal(true);
    } else {
      router.push(link.route);
    }
  };

  // Token selection for transfer
  const handleSelectTokenForTransfer = (token: WalletOption) => {
    setSelectedToken(token);
    setShowTransferMethodModal(true);
  };

  // Transfer method selection handler - MODIFIED FOR NGNZ
  const handleTransferMethodSelect = (method: TransferMethod) => {
    if (!selectedToken) return;

    if (method.id === 'zeus') {
      // Username transfer works the same for all tokens including NGNZ
      router.push({
        pathname: '/user/usernametransfer',
        params: {
          tokenId: selectedToken.id,
          tokenName: selectedToken.name,
          tokenSymbol: selectedToken.symbol,
          transferMethod: 'zeus'
        }
      });
    } else if (method.id === 'external') {
      // Special handling for NGNZ external transfer
      if (selectedToken.id === 'ngnz' || selectedToken.symbol === 'NGNZ') {
        router.push({
          pathname: '/user/FiatTransfer',
          params: {
            tokenId: selectedToken.id,
            tokenName: selectedToken.name,
            tokenSymbol: selectedToken.symbol,
            transferMethod: 'external'
          }
        });
      } else {
        // All other tokens go to regular external transfer
        router.push({
          pathname: '/user/externaltransfer',
          params: {
            tokenId: selectedToken.id,
            tokenName: selectedToken.name,
            tokenSymbol: selectedToken.symbol,
            transferMethod: 'external'
          }
        });
      }
    }

    setSelectedToken(null);
  };

  // Close transfer method modal
  const handleCloseTransferMethodModal = () => {
    setShowTransferMethodModal(false);
    setSelectedToken(null);
  };

  // Pull to refresh handler - UPDATED TO CLEAR CACHE
  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing dashboard and clearing cache...');
      
      // Clear API cache first
      apiClient.clearCache();
      
      // Then refresh dashboard data
      await refreshDashboard();
      
      console.log('✅ Dashboard refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  }, [refreshDashboard]);

  // Keep the icon just above the bottom tab; tweak this if your tab height differs
  const ICON_BOTTOM_OFFSET = Math.max(88, 72 + insets.bottom);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <DashboardHeader
          onNotificationPress={() => router.push('/user/notificationpage')}
          onSetupPress={() => router.push('/kyc/kyc-upgrade')}
        />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              title="Pull to refresh"
              titleColor={Colors.text.secondary}
              progressBackgroundColor={Colors.surface}
            />
          }
        >
          {/* Portfolio Section */}
          <PortfolioSection
            balanceVisible={balanceVisible}
            onQuickLinkPress={handleQuickLinkPress}
            onSeeMore={() => router.push('/user/see-more')}
            onToggleBalanceVisibility={() => setBalanceVisible(!balanceVisible)}
            onKYCInitiate={handleKYCInitiate}
            kycLoading={false}
            kycData={kyc}
          />

          {/* Tokens Section */}
          <TokensSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAssetPress={(asset) => router.push(`/wallet-screens/${asset.symbol.toLowerCase()}-wallet`)}
          />
        </ScrollView>
      </SafeAreaView>

      {/* Floating Support Icon (no visual container) */}
      <TouchableOpacity
        onPress={() => setSupportOpen(true)}
        accessibilityLabel="Contact Support"
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={[
          styles.supportTouchZone, // invisible, only for positioning
          { bottom: ICON_BOTTOM_OFFSET },
        ]}
      >
        <Image source={headphonesIcon} style={styles.supportIcon} />
      </TouchableOpacity>

      {/* Modals */}
      <DashboardModals
        showTransferModal={showTransferModal}
        showWalletModal={showWalletModal}
        onCloseTransferModal={() => setShowTransferModal(false)}
        onCloseWalletModal={() => setShowWalletModal(false)}
        onTransferMethodPress={() => router.push('/user/come-soon')}
        onWalletOptionPress={() => router.push('/user/come-soon')}
        onActionButtonPress={() => router.push('/user/come-soon')}
        onWalletTabPress={() => router.push('/user/come-soon')}
      />

      {/* Token Selection Modal */}
      <SelectTokenModal
        visible={showSelectTokenModal}
        onClose={() => setShowSelectTokenModal(false)}
        onSelectToken={handleSelectTokenForTransfer}
        title="Select Token to Transfer"
      />

      {/* Transfer Method Modal */}
      <TransferMethodModal
        visible={showTransferMethodModal}
        onClose={handleCloseTransferMethodModal}
        onSelectMethod={handleTransferMethodSelect}
        title={`Send ${selectedToken?.name || 'Token'}`}
      />

      {/* Support (Tawk.to) Sheet */}
      <TawkChatSheet
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Support"
        // Optional: override via env if you ever change the link without code changes
        // directLink={process.env.EXPO_PUBLIC_TAWK_DIRECT_LINK}
      />

      {/* Bottom Navigation */}
      <BottomTabNavigator activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: Layout.spacing.xl },

  // Only for absolute positioning (no visible container UI)
  supportTouchZone: {
    position: 'absolute',
    right: 18,
    zIndex: 100,
    elevation: 6,
  },

  // Icon is the UI — same size as the old container (56x56)
  supportIcon: {
    width: 60,
    height: 60,
    borderRadius: 28,
    resizeMode: 'contain',
  },
});