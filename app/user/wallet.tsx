import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import DashboardHeader from './DashboardHeader';
import WalletPortfolioSection from './WalletPortfolioSection';
import WalletTokensSection from './WalletTokensSection';
import DashboardModals from './DashboardModals'; // Import the modals component
import BottomTabNavigator from '../../components/BottomNavigator';

interface QuickLink {
  id: string;
  title: string;
  icon: any;
  route: string;
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

interface WalletScreenProps {
  onNotificationPress: () => void;
  onTokenPress: (token: any) => void;
}

export default function WalletScreen({ 
  onNotificationPress,
  onTokenPress
}: WalletScreenProps) {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('All tokens');
  
  // Add modal state management like in DashboardScreen
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const handleSeeMore = () => {
    router.push('/user/see-more');
  };

  const handleSetupPress = () => {
    router.push('/user/come-soon');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Add the same quick link press handler as DashboardScreen
  const handleQuickLinkPress = (link: QuickLink) => {
    if (link.id === 'transfer') {
      setShowTransferModal(true);
    } else if (link.id === 'deposit') {
      setShowWalletModal(true);
    } else {
      router.push(link.route);
    }
  };

  // Add the same modal handlers as DashboardScreen
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

  const handleWalletTabPress = () => {
    router.push('/user/come-soon');
  };

  return (
    <View style={styles.container}>
      {/* Use existing DashboardHeader */}
      <DashboardHeader onNotificationPress={onNotificationPress} />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Use modified PortfolioSection with proper quick link handling */}
        <WalletPortfolioSection
          balanceVisible={balanceVisible}
          onQuickLinkPress={handleQuickLinkPress} // Use the proper handler
          onSeeMore={handleSeeMore}
          onSetupPress={handleSetupPress}
          onToggleBalanceVisibility={toggleBalanceVisibility}
        />

        {/* Use modified TokensSection that shows balances instead of prices */}
        <WalletTokensSection
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAssetPress={onTokenPress}
        />
      </ScrollView>

      {/* Add DashboardModals component like in DashboardScreen */}
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

      {/* Add BottomTabNavigator */}
      <BottomTabNavigator activeTab="wallet" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
});