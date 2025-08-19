// app/user/DashboardScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardHeader from './DashboardHeader';
import DashboardModals from './DashboardModals';
import PortfolioSection from './PortfolioSection';
import TokensSection from './TokensSection';

export default function DashboardScreen() {
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState('All tokens');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletOption | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);

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

  // Transfer method selection handler
  const handleTransferMethodSelect = (method: TransferMethod) => {
    if (!selectedToken) return;

    if (method.id === 'zeus') {
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

    setSelectedToken(null);
  };

  // Close transfer method modal
  const handleCloseTransferMethodModal = () => {
    setShowTransferMethodModal(false);
    setSelectedToken(null);
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    try {
      await refreshDashboard();
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  }, [refreshDashboard]);

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

      {/* Bottom Navigation */}
      <BottomTabNavigator activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },
  scrollViewContent: { 
    paddingBottom: Layout.spacing.xl 
  },
});