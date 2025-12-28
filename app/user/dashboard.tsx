import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import BottomTabNavigator from '../../components/BottomNavigator';
import SelectTokenModal, { WalletOption } from '../../components/SelectToken';
import TransferMethodModal, { TransferMethod } from '../../components/TransferMethodModal';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import NotificationService from '../../services/notificationService';
import DashboardHeader from './DashboardHeader';
import DashboardModals from './DashboardModals';
import PortfolioSection from './PortfolioSection';
import TokensSection from './TokensSection';

import TawkChatSheet from '../../components/TawkSupport';
import headphonesIcon from '../../components/icons/chat.png';

const NOTIFICATION_PROMPT_KEY = 'notification_prompt_shown';

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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Support modal
  const [supportOpen, setSupportOpen] = useState(false);

  // Dashboard data
  const { refreshDashboard, loading, kyc } = useDashboard();

  // Check notification status on mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!Device.isDevice) return;

    try {
      // Check if we've already asked
      const hasAsked = await AsyncStorage.getItem(NOTIFICATION_PROMPT_KEY);
      if (hasAsked) return;

      // Check if permission already granted
      const isEnabled = await NotificationService.isEnabled();
      if (isEnabled) {
        // Permission granted, try to register token silently
        console.log('📱 [DASHBOARD] Permission already granted, registering token...');
        
        try {
          const result = await NotificationService.initializePushNotifications();
          
          if (result.success) {
            console.log('✅ [DASHBOARD] Token registered successfully');
          } else if (result.error?.includes('FIS_AUTH_ERROR')) {
            console.error('❌ [DASHBOARD] Firebase auth error - app needs rebuild');
            console.error('   → This error means the app was built before Firebase was configured');
            console.error('   → Run: eas build --profile development --platform android --clear-cache');
          } else {
            console.warn('⚠️ [DASHBOARD] Token registration failed:', result.error);
          }
        } catch (tokenError) {
          if (tokenError.message?.includes('FIS_AUTH_ERROR')) {
            console.error('❌ [DASHBOARD] FIS_AUTH_ERROR detected');
            console.error('   → Your Firebase config is correct, but the app needs to be rebuilt');
            console.error('   → The currently installed app predates the Firebase configuration');
          } else {
            console.error('❌ [DASHBOARD] Token registration error:', tokenError.message);
          }
        }
        
        await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
        return;
      }

      // Show prompt after a short delay (better UX)
      setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 2000);
    } catch (error) {
      console.error('❌ [DASHBOARD] Error checking notification status:', error.message);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      console.log('📱 [DASHBOARD] User opted in for notifications');

      // Setup Android channels first (critical)
      if (Platform.OS === 'android') {
        console.log('📱 [DASHBOARD] Setting up Android channels...');
        const channelResult = await NotificationService.setupAndroidNotificationChannel();
        if (!channelResult.success) {
          console.warn('⚠️ [DASHBOARD] Channel setup had issues:', channelResult.error);
        }
      }

      // Request permission
      const result = await NotificationService.requestPermission();
      
      if (result.success) {
        console.log('✅ [DASHBOARD] Notification permission granted');
        
        // Register token with backend
        const registerResult = await NotificationService.initializePushNotifications();
        
        if (registerResult.success) {
          console.log('✅ [DASHBOARD] Notification token registered with backend');
        } else {
          console.error('❌ [DASHBOARD] Token registration failed:', registerResult.error);
        }
      } else {
        console.log('⚠️ [DASHBOARD] Notification permission denied');
      }

      // Don't show again
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
      setShowNotificationPrompt(false);
    } catch (error) {
      console.error('❌ [DASHBOARD] Notification setup error:', error);
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
      setShowNotificationPrompt(false);
    }
  };

  const handleDismissNotificationPrompt = async () => {
    await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);
  };

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

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing dashboard...');
      await refreshDashboard();
      console.log('✅ Dashboard refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  }, [refreshDashboard]);

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

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptIconContainer}>
              <Text style={styles.promptIcon}>🔔</Text>
            </View>
            
            <Text style={styles.promptTitle}>Stay Updated</Text>
            <Text style={styles.promptMessage}>
              Get instant notifications about your transactions, deposits, and withdrawals.
            </Text>
            
            <TouchableOpacity 
              style={styles.enableButton} 
              onPress={handleEnableNotifications}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dismissButton} 
              onPress={handleDismissNotificationPrompt}
              activeOpacity={0.6}
            >
              <Text style={styles.dismissButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Support Icon */}
      <TouchableOpacity
        onPress={() => setSupportOpen(true)}
        accessibilityLabel="Contact Support"
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={[
          styles.supportTouchZone,
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

  supportTouchZone: {
    position: 'absolute',
    right: 18,
    zIndex: 100,
    elevation: 6,
  },

  supportIcon: {
    width: 60,
    height: 60,
    borderRadius: 28,
    resizeMode: 'contain',
  },

  // Notification Prompt Styles
  promptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },

  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },

  promptIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  promptIcon: {
    fontSize: 32,
  },

  promptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary || '#35297F',
    marginBottom: 12,
    textAlign: 'center',
  },

  promptMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
    lineHeight: 24,
    textAlign: 'center',
  },

  enableButton: {
    backgroundColor: Colors.primary || '#35297F',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary || '#35297F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  dismissButtonText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '500',
  },
});