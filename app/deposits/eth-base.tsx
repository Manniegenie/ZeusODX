// app/deposits/ETH-base.tsx
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

// Icons - Updated to match BTC-BSC screen
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

const copyIcon = require('../../components/icons/copy-icon.png');
const { width: screenWidth } = Dimensions.get('window');

const getHorizontalPadding = (): number => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  else return 28;
};

const horizontalPadding = getHorizontalPadding();

export default function EthBaseDepositScreen() {
  const router = useRouter();
  const {
    getDepositAddress,
    getCachedAddress,
    isAddressLoading,
    getAddressError,
    supportedLoading,
    refreshSupportedTokens
  } = useDeposit();

  const [depositData, setDepositData] = useState<DepositData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'notFound' | 'general'>('general');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showCopied, setShowCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchBaseAddress = async (): Promise<void> => {
      const cachedAddress = getCachedAddress('ETH', 'BASE');
      if (cachedAddress) {
        const addressData = cachedAddress.data || cachedAddress;
        setDepositData(addressData);
      } else {
        await handleGetBaseAddress();
      }
    };
    fetchBaseAddress();
  }, [getCachedAddress]);

  const handleGetBaseAddress = async (): Promise<void> => {
    try {
      // Call getDepositAddress directly with ETH token and BASE network
      const result = await getDepositAddress('ETH', 'BASE');
      if (result.success) {
        setDepositData(result.data);
        setShowError(false);
      } else {
        showErrorMessage(result.error || 'Failed to get Base ETH deposit address');
      }
    } catch (error) {
      showErrorMessage('Network error occurred');
    }
  };

  const showErrorMessage = (message: string): void => {
    let type: 'network' | 'server' | 'notFound' | 'general' = 'general';
    if (message.includes('needs to be set up') || message.includes('contact support')) type = 'notFound';
    else if (message.includes('not found') || message.includes('not set up')) type = 'notFound';
    else if (message.includes('Network') || message.includes('connection')) type = 'network';
    else if (message.includes('Server') || message.includes('500')) type = 'server';
    
    setErrorType(type);
    setErrorMessage(message);
    setShowError(true);
  };

  const hideError = (): void => setShowError(false);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([handleGetBaseAddress(), refreshSupportedTokens()]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSupportedTokens]);

  const truncateAddress = (address: string): string => {
    if (!address || address === 'Loading...') return address;
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const copyToClipboard = async (): Promise<void> => {
    if (!depositData?.address) {
      showErrorMessage('Base ETH wallet address is not yet available');
      return;
    }
    try {
      await Clipboard.setString(depositData.address);
      setShowCopied(true);
    } catch (error) {
      showErrorMessage('Failed to copy address to clipboard');
    }
  };

  const isLoading = isAddressLoading('ETH', 'BASE') || supportedLoading;
  const addressError = getAddressError('ETH', 'BASE');
  const isWalletSetupNeeded = addressError && addressError.includes('needs to be set up');
  const displayAddress = depositData?.address || (isWalletSetupNeeded ? 'Wallet not set up' : 'Loading...');
  const qrCodeData = depositData?.qrCode?.dataUrl;
  const minDeposit = '-';
  const network = 'Base';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {showError && (
          <ErrorDisplay type={errorType} message={errorMessage} onDismiss={hideError} autoHide={false} />
        )}

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
            />
          }
        >
          {/* Header - Updated to match BTC-BSC screen */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              <View style={styles.headerGroup}>
                <Text style={styles.headerTitle}>Deposit ETH</Text>
                <Text style={styles.headerSubtitle}>Base</Text>
              </View>

              <View style={styles.headerRight} />
            </View>
          </View>

          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>Scan the QR code to get Base network deposit address</Text>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading Base address...</Text>
                </View>
              ) : qrCodeData ? (
                <Image source={{ uri: qrCodeData }} style={styles.qrCodeImage} resizeMode="contain" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.noQrText}>QR Code Unavailable</Text>
                  <Text style={styles.placeholderText}>Address available below</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.sectionLabel}>Wallet Address</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{truncateAddress(displayAddress)}</Text>
              <TouchableOpacity
                style={[styles.copyButton, !depositData?.address && styles.copyButtonDisabled]}
                onPress={copyToClipboard}
                disabled={!depositData?.address}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>

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

          <View style={styles.shareSection}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                !depositData?.address && styles.shareButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!depositData?.address}
              onPress={async () => {
                if (!depositData?.address) {
                  showErrorMessage('ETH wallet address is not yet available');
                  return;
                }

                try {
                  await shareDepositPdf({
                    tokenSymbol: 'ETH',
                    tokenName: 'Ethereum',
                    networkDisplay: network,
                    address: depositData.address,
                    minDeposit,
                    walletReferenceId: depositData?.walletReferenceId,
                    qrCodeDataUrl: depositData?.qrCode?.dataUrl,
                  });
                } catch (error) {
                  Alert.alert('Share failed', 'Could not generate deposit PDF. Please try again.');
                }
              }}
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
  scrollContent: {
    paddingBottom: 100,
  },

  // Header - Updated to match BTC-BSC screen
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
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

  subtitleSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  qrSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 20,
    alignItems: 'center',
  },
  qrContainer: {
    width: Math.min(180, screenWidth * 0.45),
    height: Math.min(180, screenWidth * 0.45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noQrText: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  addressSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
  },
  sectionLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 12,
  },
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
  addressText: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    marginRight: 12,
  },
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
  copyButtonDisabled: {
    opacity: 0.5,
  },
  copyIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  detailsSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
  },
  warningSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
  },
  warningContainer: {
    backgroundColor: '#FEF3CD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningTitle: {
    color: '#92400E',
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    color: '#92400E',
    fontFamily: Typography.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  shareSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
    paddingBottom: 20,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#A5A6F6',
  },
  shareButtonText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 16,
  },
});