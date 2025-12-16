// app/deposits/btc.tsx (BTC Deposit Screen)
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Dimensions,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AddressCopied from '../../components/AddressCopied';
import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useDeposit } from '../../hooks/useDeposit';
import { shareDepositPdf } from '../../utils/shareDepositPdf';

// Icons - Updated to match gift card screens
import backIcon from '../../components/icons/backy.png';

// Type definitions
interface QRCodeData {
  dataUrl: string;
  format: string;
  type: string;
}

interface DepositData {
  token: string;
  network: string;
  address: string;
  walletReferenceId?: string | null;
  walletKey: string;
  qrCode?: QRCodeData | null;
}

// Icon imports
const copyIcon = require('../../components/icons/copy-icon.png');

const { width: screenWidth } = Dimensions.get('window');

// Responsive horizontal padding
const getHorizontalPadding = () => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  return 28;
};

const horizontalPadding = getHorizontalPadding();

export default function BtcDepositScreen() {
  const router = useRouter();
  const {
    getBitcoinAddress,
    getCachedAddress,
    isAddressLoading,
    getAddressError,
    supportedLoading,
    refreshSupportedTokens
  } = useDeposit();

  const [depositData, setDepositData] = useState<DepositData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'notFound' | 'general'>('general');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  // Get cached BTC address on mount
  useEffect(() => {
    const fetchBTCAddress = async () => {
      const cachedAddress = getCachedAddress('BTC', 'BTC');
      if (cachedAddress) {
        const addressData = cachedAddress.data || cachedAddress;
        setDepositData(addressData);
      } else {
        await handleGetBitcoinAddress();
      }
    };

    fetchBTCAddress();
  }, [getCachedAddress]);

  const handleGetBitcoinAddress = async () => {
    try {
      const result = await getBitcoinAddress();
      if (result.success) {
        setDepositData(result.data);
        setShowError(false);
      } else {
        showErrorMessage(result.error || 'Failed to get BTC deposit address');
      }
    } catch {
      showErrorMessage('Network error occurred');
    }
  };

  const showErrorMessage = (message: string) => {
    let type: 'network' | 'server' | 'notFound' | 'general' = 'general';
    if (message.includes('needs to be set up') || message.includes('contact support')) type = 'notFound';
    else if (message.includes('not found') || message.includes('not set up')) type = 'notFound';
    else if (message.includes('Network') || message.includes('connection')) type = 'network';
    else if (message.includes('Server') || message.includes('500')) type = 'server';

    setErrorType(type);
    setErrorMessage(message);
    setShowError(true);
  };

  const hideError = () => setShowError(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([handleGetBitcoinAddress(), refreshSupportedTokens()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSupportedTokens]);

  const handleBack = () => router.back();

  const isLoading = isAddressLoading('BTC', 'BTC') || supportedLoading;
  const addressError = getAddressError('BTC', 'BTC');

  const isWalletSetupNeeded = addressError && addressError.includes('needs to be set up');
  const displayAddress = depositData?.address || (isWalletSetupNeeded ? 'Wallet not set up' : 'Loading...');
  const qrCodeData = depositData?.qrCode?.dataUrl;
  const minDeposit = '0.00005 BTC';
  const network = depositData?.network || 'Bitcoin';

  const copyToClipboard = async () => {
    if (!depositData?.address) {
      if (isWalletSetupNeeded) showErrorMessage('Please set up your BTC wallet first before copying the address');
      else showErrorMessage('BTC wallet address is not yet available');
      return;
    }
    try {
      await Clipboard.setString(depositData.address);
      setShowCopied(true); // show green "Address Copied"
    } catch {
      showErrorMessage('Failed to copy address to clipboard');
    }
  };

  const truncateAddress = (address: string): string => {
    if (!address || address === 'Loading...') return address;
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {/* Error Display */}
        {showError && (
          <ErrorDisplay
            type={errorType}
            message={errorMessage}
            onDismiss={hideError}
            autoHide={false}
          />
        )}

        {/* Address Copied banner */}
        {showCopied && <AddressCopied onDismiss={() => setShowCopied(false)} />}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              title="Pull to refresh"
              titleColor={Colors.text.secondary}
              progressBackgroundColor={Colors.surface}
            />
          }
        >
          {/* Header - Updated to match gift card screens */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack} 
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              <View style={styles.headerGroup}>
                <Text style={styles.headerTitle}>Deposit BTC</Text>
              </View>

              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>Scan the QR code to get Deposit address</Text>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading BTC address...</Text>
                </View>
              ) : isWalletSetupNeeded ? (
                <View style={styles.setupNeededContainer}>
                  <Text style={styles.setupNeededIcon}>🏦</Text>
                  <Text style={styles.setupNeededTitle}>Wallet Setup Required</Text>
                  <Text style={styles.setupNeededText}>
                    Your BTC wallet needs to be activated before you can receive deposits.
                  </Text>
                  <TouchableOpacity
                    style={styles.contactSupportButton}
                    onPress={() => {
                      Alert.alert(
                        'Contact Support',
                        'Please contact our support team to set up your BTC wallet.',
                        [{ text: 'OK', style: 'default' }]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.contactSupportText}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              ) : qrCodeData ? (
                <Image source={{ uri: qrCodeData }} style={styles.qrCodeImage} resizeMode="contain" />
              ) : (
                <View style={styles.qrCode}>
                  <View style={styles.qrPlaceholder}>
                    <View style={styles.qrPattern}>
                      <View style={[styles.qrSquare, styles.topLeft]} />
                      <View style={[styles.qrSquare, styles.topRight]} />
                      <View style={[styles.qrSquare, styles.bottomLeft]} />
                      <View style={styles.qrCenter} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Wallet Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionLabel}>Wallet Address</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{truncateAddress(displayAddress)}</Text>
              <TouchableOpacity
                style={[styles.copyButton, (!depositData?.address || isWalletSetupNeeded) && styles.copyButtonDisabled]}
                onPress={copyToClipboard}
                activeOpacity={0.7}
                disabled={!depositData?.address || isWalletSetupNeeded}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Minimum Deposit</Text>
              <Text style={styles.detailValue}>{minDeposit}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network</Text>
              <Text style={styles.detailValue}>{network}</Text>
            </View>

            {depositData?.walletReferenceId && (
              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <Text style={styles.detailLabel}>Wallet ID</Text>
                <Text style={styles.detailValue}>{depositData.walletReferenceId}</Text>
              </View>
            )}
          </View>

          {/* Share Button */}
          <View style={styles.shareSection}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                (!depositData?.address || isWalletSetupNeeded) && styles.shareButtonDisabled,
              ]}
              onPress={async () => {
                if (!depositData?.address) {
                  if (isWalletSetupNeeded) {
                    showErrorMessage('Please set up your BTC wallet first before sharing the address');
                  } else {
                    showErrorMessage('BTC wallet address is not yet available');
                  }
                  return;
                }

                try {
                  await shareDepositPdf({
                    tokenSymbol: 'BTC',
                    tokenName: 'Bitcoin',
                    networkDisplay: network,
                    address: depositData.address,
                    minDeposit,
                    walletReferenceId: depositData?.walletReferenceId,
                    qrCodeDataUrl: qrCodeData,
                  });
                } catch (error) {
                  Alert.alert('Share failed', 'Could not generate deposit PDF. Please try again.');
                }
              }}
              activeOpacity={0.8}
              disabled={!depositData?.address || isWalletSetupNeeded}
            >
              <Text style={styles.shareButtonText}>Share PDF</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="wallet" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Header - Updated to match gift card screens
  headerSection: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerGroup: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerRight: { 
    width: 40 
  },
  headerTitle: { 
    color: Colors.text.primary, 
    fontFamily: Typography.medium, 
    fontSize: 18, 
    textAlign: 'center',
    fontWeight: '600',
  },

  // Subtitle
  subtitleSection: { paddingHorizontal: horizontalPadding, paddingVertical: 8, alignItems: 'center' },
  subtitle: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, textAlign: 'center' },

  // QR Code section
  qrSection: { paddingHorizontal: horizontalPadding, paddingVertical: 20, alignItems: 'center' },
  qrContainer: {
    width: Math.min(180, screenWidth * 0.45),
    height: Math.min(180, screenWidth * 0.45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 12, marginTop: 10, textAlign: 'center' },
  setupNeededContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 16,
  },
  setupNeededIcon: { fontSize: 28, marginBottom: 8 },
  setupNeededTitle: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.primary, textAlign: 'center', marginBottom: 8 },
  setupNeededText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactSupportButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  contactSupportText: { color: Colors.surface, fontFamily: Typography.medium, fontSize: 14 },
  qrCodeImage: { width: '100%', height: '100%', borderRadius: 12 },
  qrCode: { width: '100%', height: '100%' },
  qrPlaceholder: { width: '100%', height: '100%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  qrPattern: { width: '90%', height: '90%', position: 'relative' },
  qrSquare: { width: 30, height: 30, backgroundColor: '#FFF', position: 'absolute' },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0 },
  bottomLeft: { bottom: 0, left: 0 },
  qrCenter: { width: 20, height: 20, backgroundColor: '#FFF', position: 'absolute', top: '50%', left: '50%', marginTop: -10, marginLeft: -10 },

  // Address section
  addressSection: { paddingHorizontal: horizontalPadding, paddingVertical: 15 },
  sectionLabel: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, marginBottom: 12 },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
  },
  addressText: { flex: 1, color: Colors.text.primary, fontFamily: 'monospace', fontSize: 14, lineHeight: 20, marginRight: 12 },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  copyButtonDisabled: { opacity: 0.5 },
  copyIcon: { width: 32, height: 32, resizeMode: 'cover' },

  // Details section
  detailsSection: { paddingHorizontal: horizontalPadding, paddingVertical: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 },
  detailValue: { color: Colors.text.primary, fontFamily: Typography.medium, fontSize: 14 },

  // Share section
  shareSection: { paddingHorizontal: horizontalPadding, paddingVertical: 15, paddingBottom: 20 },
  shareButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  shareButtonDisabled: { backgroundColor: '#9CA3AF' },
  shareButtonText: { color: Colors.surface, fontFamily: Typography.medium, fontSize: 16 },
});