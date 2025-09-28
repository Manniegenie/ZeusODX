import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// Asset imports
const btcIcon = require('../../components/icons/btc-icon.png');
const ethIcon = require('../../components/icons/eth-icon.png');
const solIcon = require('../../components/icons/sol-icon.png');
const usdtIcon = require('../../components/icons/usdt-icon.png');
const usdcIcon = require('../../components/icons/usdc-icon.png');
const ngnzIcon = require('../../components/icons/NGNZ.png');
const trxIcon = require('../../components/icons/Tron.png');
const bnbIcon = require('../../components/icons/bnb-icon.png');
const maticIcon = require('../../components/icons/matic-icon.png');

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: any;
  balance?: number;
}

interface SelectedUser {
  id: string;
  username: string;
  fullName: string;
}

export default function TransferScreen() {
  const router = useRouter();
  const { userId, username, fullName } = useLocalSearchParams();
  
  const [amount, setAmount] = useState('0');
  const [selectedToken] = useState<TokenOption>({
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: btcIcon,
    balance: 0
  });
  
  // Use the selected user data from navigation params
  const selectedUser: SelectedUser = {
    id: userId as string || '1',
    username: username as string || 'user',
    fullName: fullName as string || 'Unknown User'
  };

  // Token mapping function like in swap screen
  const getTokenIcon = (id: string) => ({
    btc: btcIcon,
    eth: ethIcon,
    sol: solIcon,
    usdt: usdtIcon,
    usdc: usdcIcon,
    ngnz: ngnzIcon,
    trx: trxIcon,
    bnb: bnbIcon,
    matic: maticIcon
  }[id] || btcIcon);

  const handleGoBack = () => {
    router.back();
  };

  const handlePercentage = (percentage: number) => {
    // Mock calculation - in real app would use actual balance
    const mockBalance = 1000;
    const calculatedAmount = (mockBalance * percentage / 100).toString();
    setAmount(calculatedAmount);
  };

  const handleReview = () => {
    // Navigate to review screen or show modal
    console.log('Review transfer:', { amount, token: selectedToken, user: selectedUser });
  };

  const formatUsdValue = (amt: string): string => {
    const numAmount = parseFloat(amt) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  // Helper functions from swap screen for consistency
  const formatWithCommas = (value: string): string => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    if (isNaN(Number(numericValue))) return value;
    const [integer, decimal] = numericValue.split('.');
    const formattedInt = Number(integer).toLocaleString('en-US');
    return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatWithCommas(text));
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
              <Text style={styles.backButtonText} allowFontScaling={false}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} allowFontScaling={false}>Transfer</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Main Input Field */}
          <View style={styles.inputSection}>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput 
                  style={styles.amountInput}
                  value={amount}
                  onFocus={() => { if (amount === '0') setAmount(''); }}
                  onBlur={() => { if (!amount) setAmount('0'); }}
                  onChangeText={handleAmountChange}
                  placeholder="0" 
                  keyboardType="decimal-pad" 
                  placeholderTextColor={Colors.text.secondary}
                />
                <Text style={styles.usdValue} allowFontScaling={false}>{formatUsdValue(amount)}</Text>
              </View>
              <View style={styles.tokenSelector}>
                <View style={styles.tokenContainer}>
                  <Image source={getTokenIcon(selectedToken.id)} style={styles.tokenIcon} />
                  <Text style={styles.tokenText} allowFontScaling={false}>{selectedToken.symbol}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Percentage Buttons */}
          <View style={styles.percentageSection}>
            {[25, 50, 75, 100].map((percentage) => (
              <TouchableOpacity
                key={percentage}
                style={styles.percentageButton}
                onPress={() => handlePercentage(percentage)}
                activeOpacity={0.7}
              >
                <Text style={styles.percentageText} allowFontScaling={false}>{percentage}%</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected User Display */}
          <View style={styles.userSection}>
            <View style={styles.userItem}>
              <View style={styles.avatarContainer}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitials} allowFontScaling={false}>
                    {selectedUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.textContainer}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{selectedUser.fullName}</Text>
                  <Text style={styles.userUsername}>@{selectedUser.username}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Review Button */}
          <View style={styles.reviewSection}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleReview}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText} allowFontScaling={false}>Transfer</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
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

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.lg,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Main Input - Using Layout constants for consistency
  inputSection: {
    paddingHorizontal: Layout.spacing.xl,
    marginTop: Layout.spacing.lg,
  },
  inputCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: Layout.borderRadius.lg, // Same as swap screen
    padding: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
  },
  inputLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  amountInput: {
    fontFamily: Typography.medium,
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: '600',
    padding: 0,
    margin: 0,
    flexShrink: 1,
  },
  usdValue: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  tokenSelector: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '50%',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: Layout.borderRadius.md, // Same as swap screen token selector
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  tokenIcon: {
    width: 18,
    height: 18,
    resizeMode: 'cover',
    marginRight: Layout.spacing.sm,
  },
  tokenText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
  },

  // Percentage Buttons
  percentageSection: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.xl,
    marginTop: Layout.spacing.xl,
    gap: Layout.spacing.sm,
  },
  percentageButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md, // Consistent with swap screen
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  percentageText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  // User Section
  userSection: {
    paddingHorizontal: Layout.spacing.xl,
    marginTop: Layout.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Layout.spacing.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 17,
    height: 17,
    borderRadius: 30.59,
    backgroundColor: '#8075FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    color: '#FFFFFF',
    fontFamily: 'Bricolage Grotesque',
    fontSize: 8,
    fontWeight: '600',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    width: 152,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: Colors.text.primary,
    fontFamily: 'Bricolage Grotesque',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 2,
  },
  userUsername: {
    color: Colors.text.secondary,
    fontFamily: 'Bricolage Grotesque',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
  },

  // Review Button
  reviewSection: {
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.xl,
  },
  reviewButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.lg, // Same as swap screen action button
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '600',
  },
});