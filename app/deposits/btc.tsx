import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Clipboard,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useDeposit } from '../../hooks/useDeposit';

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
  if (screenWidth < 350) {
    return 20; // Small phones
  } else if (screenWidth < 400) {
    return 24; // Medium phones
  } else {
    return 28; // Large phones
  }
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

  // Get cached BTC address on mount
  useEffect(() => {
    const fetchBTCAddress = async () => {
      console.log('🔄 BTC Screen: Checking for cached address...');
      const cachedAddress = getCachedAddress('BTC', 'BTC');
      
      if (cachedAddress) {
        console.log('💾 BTC Screen: Found cached address:', cachedAddress);
        // Extract the data from the cached response
        const addressData = cachedAddress.data || cachedAddress;
        console.log('📦 BTC Screen: Extracted address data:', addressData);
        setDepositData(addressData);
      } else {
        console.log('🆕 BTC Screen: No cache found, fetching fresh address...');
        await handleGetBitcoinAddress();
      }
    };

    fetchBTCAddress();
  }, [getCachedAddress]);

  const handleGetBitcoinAddress = async () => {
    try {
      console.log('🚀 BTC Screen: Starting to fetch Bitcoin address...');
      const result = await getBitcoinAddress();
      console.log('📦 BTC Screen: API result:', result);
      
      if (result.success) {
        console.log('✅ BTC Screen: Successfully got BTC data:', result.data);
        // Make sure we're setting the correct data structure
        const addressData = result.data;
        console.log('🎯 BTC Screen: Setting deposit data:', addressData);
        setDepositData(addressData);
        setShowError(false); // Hide any existing errors
      } else {
        console.error('❌ BTC Screen: Failed to get BTC address:', result.error);
        showErrorMessage(result.error || 'Failed to get BTC deposit address');
      }
    } catch (error) {
      console.error('💥 BTC Screen: Error getting BTC address:', error);
      showErrorMessage('Network error occurred');
    }
  };

  const showErrorMessage = (message: string) => {
    // Determine error type based on message content
    let type: 'network' | 'server' | 'notFound' | 'general' = 'general';
    
    if (message.includes('needs to be set up') || message.includes('contact support')) {
      type = 'notFound';
    } else if (message.includes('not found') || message.includes('not set up')) {
      type = 'notFound';
    } else if (message.includes('Network') || message.includes('connection')) {
      type = 'network';
    } else if (message.includes('Server') || message.includes('500')) {
      type = 'server';
    }
    
    setErrorType(type);
    setErrorMessage(message);
    setShowError(true);
  };

  const hideError = () => {
    setShowError(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        handleGetBitcoinAddress(),
        refreshSupportedTokens()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSupportedTokens]);

  const handleBack = () => {
    router.back();
  };

  const handleShareImage = () => {
    // TODO: Implement share functionality
    console.log('Share image functionality');
  };

  // Get current loading state and data
  const isLoading = isAddressLoading('BTC', 'BTC') || supportedLoading;
  const addressError = getAddressError('BTC', 'BTC');
  
  // Debug logging
  console.log('🔍 BTC Screen Debug:', {
    isLoading,
    addressError,
    depositData: depositData ? 'Present' : 'Null',
    address: depositData?.address,
    qrCode: depositData?.qrCode ? 'Present' : 'Null',
    qrCodeDataUrl: depositData?.qrCode?.dataUrl ? 'Present' : 'Null',
    depositDataStructure: depositData ? Object.keys(depositData) : 'No Data'
  });
  
  // Check if this is a wallet setup issue
  const isWalletSetupNeeded = addressError && addressError.includes('needs to be set up');
  
  // Use deposit data or fallback
  const displayAddress = depositData?.address || (isWalletSetupNeeded ? 'Wallet not set up' : 'Loading...');
  const qrCodeData = depositData?.qrCode?.dataUrl;
  const minDeposit = '0.0001 BTC';
  const network = depositData?.network || 'Bitcoin';

  const copyToClipboard = async () => {
    if (!depositData?.address) {
      if (isWalletSetupNeeded) {
        showErrorMessage('Please set up your BTC wallet first before copying the address');
      } else {
        showErrorMessage('BTC wallet address is not yet available');
      }
      return;
    }
    
    try {
      await Clipboard.setString(depositData.address);
      Alert.alert('Copied!', 'BTC wallet address copied to clipboard');
    } catch (error) {
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <View style={styles.backArrow}>
                <View style={styles.arrowLine} />
                <View style={styles.arrowHead} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerGroup}>
              <Text style={styles.headerTitle}>Deposit BTC</Text>
            </View>
            
            {/* Empty view for centering */}
            <View style={styles.headerSpacer} />
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
                <Image 
                  source={{ uri: qrCodeData }} 
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrCode}>
                  {/* Fallback QR Code placeholder */}
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
              <Text style={styles.addressText}>
                {truncateAddress(displayAddress)}
              </Text>
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
              style={[styles.shareButton, (!depositData?.address || isWalletSetupNeeded) && styles.shareButtonDisabled]} 
              onPress={handleShareImage}
              activeOpacity={0.8}
              disabled={!depositData?.address || isWalletSetupNeeded}
            >
              <Text style={styles.shareButtonText}>Share as image</Text>
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
    paddingBottom: 100, // Bottom padding for nav bar clearance
  },

  // Header styles
  headerSection: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 15,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowLine: {
    width: 16,
    height: 2,
    backgroundColor: Colors.text.primary,
    position: 'absolute',
  },
  arrowHead: {
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderLeftColor: Colors.text.primary,
    borderTopColor: Colors.text.primary,
    backgroundColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    left: 0,
  },
  headerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
  },

  // Subtitle
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

  // QR Code section
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
  setupNeededIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  setupNeededTitle: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  setupNeededText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactSupportButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactSupportText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 14,
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  qrCode: {
    width: '100%',
    height: '100%',
  },
  qrPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  qrPattern: {
    width: '90%',
    height: '90%',
    position: 'relative',
  },
  qrSquare: {
    width: 30,
    height: 30,
    backgroundColor: '#FFF',
    position: 'absolute',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  qrCenter: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
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

  // Address section
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

  // Details section
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

  // Share section
  shareSection: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 15,
    paddingBottom: 20, // Extra bottom padding for nav bar clearance
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  shareButtonText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 16,
  },
});