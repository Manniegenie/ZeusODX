import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl
} from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// Import the dashboard hook
import { useDashboard } from '../../hooks/useDashboard';

// Import the separated components
import DashboardHeader from './DashboardHeader';
import DashboardModals from './DashboardModals';
import PortfolioSection from './PortfolioSection';
import TokensSection from './TokensSection';

interface QuickLink {
  id: string;
  title: string;
  icon: any;
  route: string;
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

interface TransferMethod {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface WalletOption {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All tokens');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  // Use the dashboard hook
  const { 
    refreshDashboard, 
    loading, 
    error,
    dashboard,
    profile,
    portfolio,
    market,
    wallets
  } = useDashboard();

  // Pull-to-refresh handler using the dashboard hook
  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing dashboard data...');
      await refreshDashboard();
      console.log('✅ Dashboard refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  }, [refreshDashboard]);

  // Handler functions
  const handleQuickLinkPress = (link: QuickLink) => {
    if (link.id === 'transfer') {
      setShowTransferModal(true);
    } else if (link.id === 'deposit') {
      setShowWalletModal(true);
    } else {
      router.push(link.route);
    }
  };

  const handleSeeMore = () => {
    router.push('/user/see-more');
  };

  const handleAssetPress = (asset: Token) => {
    console.log(`🪙 Token pressed: ${asset.name} (${asset.symbol})`);
    
    // Route based on token ID to individual wallet screens
    switch (asset.id) {
      case 'btc':
        router.push('/wallet-screens/btc-wallet');
        break;
      case 'eth':
        router.push('/wallet-screens/eth-wallet');
        break;
      case 'usdt':
        router.push('/wallet-screens/usdt-wallet');
        break;
      case 'usdc':
        router.push('/wallet-screens/usdc-wallet');
        break;
      case 'ngnz':
        router.push('/wallet-screens/ngnz-wallet');
        break;
      case 'sol':
        router.push('/wallet-screens/sol-wallet');
        break;
      case 'bnb':
        router.push('/wallet-screens/bnb-wallet');
        break;
      case 'matic':
        router.push('/wallet-screens/matic-wallet');
        break;
      case 'doge':
        router.push('/wallet-screens/doge-wallet');
        break;
      case 'avax':
        router.push('/wallet-screens/avax-wallet');
        break;
      default:
        console.log(`⚠️ No specific route for ${asset.symbol}, redirecting to coming soon`);
        router.push('/user/come-soon');
    }
  };

  const handleTransferMethodPress = (method: TransferMethod) => {
    setShowTransferModal(false);
    router.push('/user/come-soon');
  };

  const handleWalletOptionPress = (wallet: WalletOption) => {
    console.log(`💰 Deposit wallet pressed: ${wallet.name} (${wallet.symbol})`);
    setShowWalletModal(false);
    
    // Route to specific deposit screens based on wallet ID and network
    switch (wallet.id) {
      case 'ngnz':
        router.push('/deposits/ngnz');
        break;
      case 'btc':
        router.push('/deposits/btc');
        break;
      case 'eth':
        router.push('/deposits/eth');
        break;
      case 'sol':
        router.push('/deposits/sol');
        break;
      case 'usdc_bsc':
        router.push('/deposits/usdc-bsc');
        break;
      case 'usdc_eth':
        router.push('/deposits/usdc-eth');
        break;
      case 'usdt_bsc':
        router.push('/deposits/usdt-bsc');
        break;
      case 'usdt_eth':
        router.push('/deposits/usdt-eth');
        break;
      case 'usdt_trx':
        router.push('/deposits/usdt-trx');
        break;
      case 'avax_bsc':
        router.push('/deposits/avax-bsc');
        break;
      case 'bnb_bsc':
        router.push('/deposits/bnb-bsc');
        break;
      case 'bnb_eth':
        router.push('/deposits/bnb-eth');
        break;
      case 'matic_eth':
        router.push('/deposits/matic-eth');
        break;
      default:
        console.log(`⚠️ No specific deposit route for ${wallet.symbol}, redirecting to coming soon`);
        router.push('/user/come-soon');
    }
  };

  const handleActionButtonPress = (action: string) => {
    router.push('/user/come-soon');
  };

  const handleNotificationPress = () => {
    router.push('/user/come-soon');
  };

  const handleSetupPress = () => {
    router.push('/user/come-soon');
  };

  const handlePromoBannerPress = () => {
    router.push('/user/come-soon');
  };

  const handleWalletTabPress = () => {
    router.push('/user/come-soon');
  };

  // Balance visibility toggle handler
  const handleBalanceVisibilityToggle = () => {
    console.log('🔄 DashboardScreen: Balance visibility toggled, current balanceVisible:', balanceVisible);
    setBalanceVisible(!balanceVisible);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Section */}
        <DashboardHeader
          onNotificationPress={handleNotificationPress}
          onSetupPress={handleSetupPress}
        />

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
            onSeeMore={handleSeeMore}
            onSetupPress={handleSetupPress}
            onToggleBalanceVisibility={handleBalanceVisibilityToggle}
          />

          {/* Tokens Section */}
          <TokensSection
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onAssetPress={handleAssetPress}
          />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <DashboardModals
        showTransferModal={showTransferModal}
        showWalletModal={showWalletModal}
        onCloseTransferModal={() => setShowTransferModal(false)}
        onCloseWalletModal={() => setShowWalletModal(false)}
        onTransferMethodPress={handleTransferMethodPress}
        onWalletOptionPress={handleWalletOptionPress}
        onActionButtonPress={handleActionButtonPress}
        onWalletTabPress={handleWalletTabPress}
      />

      {/* Bottom Tab Navigator */}
      <BottomTabNavigator activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Layout.spacing.xl,
  },
});