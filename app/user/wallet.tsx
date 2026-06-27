import { useRouter } from 'expo-router';
import React, { useState , useMemo} from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import DashboardHeader from './DashboardHeader';
import DashboardModals from './DashboardModals';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import WalletPortfolioSection from './WalletPortfolioSection';
import WalletTokensSection from './WalletTokensSection';

interface QuickLink {
  id: string;
  title: string;
  icon: any;
  route: string;
}


interface WalletScreenProps {
  onNotificationPress: () => void;
  onTokenPress: (token: any) => void;
}

export default function WalletScreen({ 
  onNotificationPress,
  onTokenPress
}: WalletScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('All tokens');
  
  // Modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);
  const [showTransferMethodModal, setShowTransferMethodModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletOption | null>(null);

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

  const handleQuickLinkPress = (link: QuickLink) => {
    if (link.id === 'transfer') {
      setShowSelectTokenModal(true);
    } else if (link.id === 'deposit') {
      setShowWalletModal(true);
    } else {
      router.push(link.route);
    }
  };

  const handleSelectTokenForTransfer = (token: WalletOption) => {
    setSelectedToken(token);
    setShowTransferMethodModal(true);
  };

  const handleTransferMethodSelect = (method: TransferMethod) => {
    if (!selectedToken) return;
    if (method.id === 'zeus') {
      router.push({
        pathname: '/user/usernametransfer',
        params: { tokenId: selectedToken.id, tokenName: selectedToken.name, tokenSymbol: selectedToken.symbol, transferMethod: 'zeus' }
      });
    } else if (method.id === 'external') {
      if (selectedToken.id === 'ngnz' || selectedToken.symbol === 'NGNZ') {
        router.push({
          pathname: '/user/FiatTransfer',
          params: { tokenId: selectedToken.id, tokenName: selectedToken.name, tokenSymbol: selectedToken.symbol, transferMethod: 'external' }
        });
      } else {
        router.push({
          pathname: '/user/externaltransfer',
          params: { tokenId: selectedToken.id, tokenName: selectedToken.name, tokenSymbol: selectedToken.symbol, transferMethod: 'external' }
        });
      }
    }
    setSelectedToken(null);
  };

  const handleCloseTransferMethodModal = () => {
    setShowTransferMethodModal(false);
    setSelectedToken(null);
  };

  const handleWalletOptionPress = (wallet: WalletOption) => {
    console.log(`💰 Deposit wallet pressed: ${wallet.name} (${wallet.symbol})`);
    setShowWalletModal(false);
    
    // Route to specific deposit screens based on wallet ID and network
    switch (wallet.id) {
      case 'ngnz':
        // NGNZ deposit disabled
        return;
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
      case 'ton':
        router.push('/deposits/ton');
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
      <DashboardHeader
        showGreeting={false}
        showActivityIcon={false}
        showNotificationIcon={false}
      />
      
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

      {/* Deposit wallet selection modal */}
      <DashboardModals
        showTransferModal={false}
        showWalletModal={showWalletModal}
        onCloseTransferModal={() => {}}
        onCloseWalletModal={() => setShowWalletModal(false)}
      />

      {/* Step 1: pick which token to withdraw */}
      <SelectTokenModal
        visible={showSelectTokenModal}
        onClose={() => setShowSelectTokenModal(false)}
        onSelectToken={handleSelectTokenForTransfer}
        title="Select Token to Withdraw"
      />

      {/* Step 2: pick transfer method (username or external) */}
      <TransferMethodModal
        visible={showTransferMethodModal}
        onClose={handleCloseTransferMethodModal}
        onSelectMethod={handleTransferMethodSelect}
        title={`Send ${selectedToken?.name || 'Token'}`}
      />

      {/* Add BottomTabNavigator */}
      <BottomTabNavigator activeTab="wallet" />
    </View>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
});