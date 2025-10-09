// app/deposits/ngnz.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Clipboard,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import AddressCopied from '../../components/AddressCopied';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';

// Icons
import backIcon from '../../components/icons/backy.png';
const copyIcon = require('../../components/icons/copy-icon.png');

const { width: screenWidth } = Dimensions.get('window');

const getHorizontalPadding = (): number => {
  if (screenWidth < 350) return 20;
  else if (screenWidth < 400) return 24;
  else return 28;
};

const horizontalPadding = getHorizontalPadding();

// Account details - Replace with actual data from your API
const ACCOUNT_DETAILS = {
  accountNumber: '7650423962',
  bankName: 'Zenith Bank PLC',
  accountName: 'ZO/Okoli Emmanuel',
  transactionFee: '₦100',
  maxDailyDeposit: '₦5,000,000',
  depositLimit: '₦1,000 - ₦3,000,000',
};

export default function NGNZDepositScreen() {
  const router = useRouter();
  const [showCopied, setShowCopied] = useState<boolean>(false);

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await Clipboard.setString(text);
      setShowCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {showCopied && <AddressCopied onDismiss={() => setShowCopied(false)} />}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
                <Text style={styles.headerTitle}>Deposit NGNZ</Text>
                <Text style={styles.headerSubtitle}>Nigerian Naira</Text>
              </View>

              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>Make a transfer to your account details below</Text>
          </View>

          {/* Account Details */}
          <View style={styles.detailsSection}>
            {/* Account Number */}
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.accountNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(ACCOUNT_DETAILS.accountNumber)}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>

            {/* Bank Name */}
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.bankName}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(ACCOUNT_DETAILS.bankName)}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>

            {/* Account Name */}
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Account Name</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.accountName}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(ACCOUNT_DETAILS.accountName)}
              >
                <Image source={copyIcon} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>

            {/* Transaction Fee */}
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Transaction Fee</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.transactionFee}</Text>
              </View>
            </View>

            {/* Maximum Daily Deposit */}
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Maximum Daily Deposit</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.maxDailyDeposit}</Text>
              </View>
            </View>

            {/* Deposit Limit */}
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Deposit Limit</Text>
                <Text style={styles.detailValue}>{ACCOUNT_DETAILS.depositLimit}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <View style={styles.shareSection}>
            <TouchableOpacity style={styles.shareButton}>
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
    paddingBottom: 100,
  },

  // Header
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

  // Subtitle Section
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

  // Details Section
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
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
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
    marginLeft: 12,
  },
  copyIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },

  // Share Section
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
  shareButtonText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 16,
  },
});