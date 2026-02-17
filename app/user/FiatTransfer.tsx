import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../components/Loading';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useNGNZ } from '../../hooks/useNGNZ';
import { getMaxWithdrawable } from '../../services/withdrawalMaxService';

// Asset imports
const ngnzIcon = require('../../components/icons/NGNZ.png');
import backIcon from '../../components/icons/backy.png';

interface TransferScreenProps {
  onBack?: () => void;
  onTransfer?: () => void;
}

export default function TransferScreen({ onBack, onTransfer }: TransferScreenProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [maxLoading, setMaxLoading] = useState(false);

  // === Hooks for NGNZ balance & USD rate ===
  const { getNGNZBalance, getNGNZRate } = useNGNZ();
  const ngnzBalance = Number(getNGNZBalance?.() ?? 0);
  const ngnzExchangeRate = Number(getNGNZRate?.() ?? 0);

  // Business rules
  const FEE_NGNZ = 100;        
  const minimumAmount = 1000;   

  // Helpers
  const formatWithCommas = (value: string): string => {
    if (value === null || value === undefined) return '';
    const numericValue = String(value).replace(/,/g, '');
    if (numericValue === '') return '';
    if (isNaN(Number(numericValue))) return value;
    const [integer, decimal] = numericValue.split('.');
    const formattedInt = Number(integer).toLocaleString('en-US');
    return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
  };
  
  const unformat = (value: string): string => String(value || '').replace(/,/g, '');
  
  const safeParseAmount = (val: string): number => {
    const n = parseFloat(unformat(val));
    return Number.isFinite(n) ? n : 0;
  };

  const spendable = useMemo(() => ngnzBalance, [ngnzBalance]);

  const formatUsdValue = (amt: string): string => {
    const val = safeParseAmount(amt);
    if (!val || isNaN(val) || val <= 0) return '$0.00';
    if (!ngnzExchangeRate || isNaN(ngnzExchangeRate) || ngnzExchangeRate <= 0) return '$0.00';
    const usdValue = val / ngnzExchangeRate;
    return '$' + usdValue.toFixed(2);
  };

  const getMaxBalanceLabel = (): string => 
    `${ngnzBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGNZ`;

  // Max: use server-side max withdrawable (source of truth) so we never exceed actual balance
  const handleMax = async () => {
    setMaxLoading(true);
    try {
      const result = await getMaxWithdrawable('NGNZ');
      if (result.success && result.maxAmount != null) {
        const floored = Math.floor((result.maxAmount * 100) + 0.000001) / 100;
        setAmount(formatWithCommas(Math.max(0, floored).toFixed(2)));
      } else if (result.error) {
        Alert.alert('Unable to load max', result.error);
      }
    } finally {
      setMaxLoading(false);
    }
  };

  const handleContinue = () => {
    const rawAmount = safeParseAmount(amount);

    if (rawAmount < minimumAmount) {
      Alert.alert('Minimum Amount', `Minimum transfer amount is ${minimumAmount.toLocaleString()} NGNZ`);
      return;
    }
    if (rawAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    // Use epsilon comparison here too just in case
    if (rawAmount > (spendable + 0.001)) {
      Alert.alert('Insufficient Balance', `You don't have enough NGNZ. Available: ${getMaxBalanceLabel()}`);
      return;
    }

    router.push({
      pathname: '/user/BankAccountsScreen',
      params: {
        transferAmount: rawAmount.toString(),
        transferFee: FEE_NGNZ.toString(),
        mode: 'select'
      }
    });
  };

  const getAmountAfterFee = (): string => {
    const rawAmount = safeParseAmount(amount);
    const netAmount = rawAmount - FEE_NGNZ;
    return netAmount > 0 ? formatWithCommas(netAmount.toFixed(2)) : '0';
  };

  const rawAmountNum = safeParseAmount(amount);
  const feeForDisplay = rawAmountNum > 0 ? FEE_NGNZ : 0;

  const handleBlur = () => {
    if (!amount) {
      setAmount('0');
      return;
    }
    const raw = safeParseAmount(amount);
    // Ensure we don't accidentally set a value higher than spendable on blur
    const clamped = Math.min(raw, spendable);
    
    // If clamped has more than 2 decimals, trim it to avoid "maxing" issues on re-focus
    const flooredClamped = Math.floor((clamped * 100) + 0.000001) / 100;
    
    setAmount(formatWithCommas(flooredClamped.toString()));
  };

  // === FIX 2: Validation Logic ===
  const isTransferDisabled =
    rawAmountNum <= 0 ||
    rawAmountNum < minimumAmount ||
    // Allow a 0.001 epsilon for floating point comparison safety
    rawAmountNum > (spendable + 0.001);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>

            <View style={styles.headerGroup}>
              <Text style={styles.headerTitle}>Transfer to bank account</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled" 
        >
          <View style={styles.guideBox}>
            <Ionicons name="bulb-outline" size={18} color={Colors.hintIcon} style={styles.guideIcon} />
            <Text style={styles.guideText}>Send NGNZ to your Nigerian bank account; a small fee applies.</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onFocus={() => { if (amount === '0') setAmount(''); }}
                  onBlur={handleBlur}
                  onChangeText={(text) => setAmount(formatWithCommas(text))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text.secondary}
                />
                <Text style={styles.usdValue}>{formatUsdValue(amount)}</Text>
              </View>
              <View style={styles.inputRight}>
                <View style={styles.tokenSelector}>
                  <Image source={ngnzIcon} style={styles.tokenIcon} />
                  <Text style={styles.tokenText}>NGNZ</Text>
                </View>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText} numberOfLines={1}>{getMaxBalanceLabel()}</Text>
                  <TouchableOpacity onPress={handleMax} disabled={maxLoading}>
                    <Text style={[styles.maxText, maxLoading && styles.maxTextDisabled]}>Max</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.minimumText}>
              Minimum amount - {minimumAmount.toLocaleString()} NGNZ
            </Text>
          </View>

          <View style={styles.feeContainer}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Transaction fee:</Text>
              <Text style={styles.feeValue}>{feeForDisplay.toFixed(2)} NGNZ</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>You will get:</Text>
              <Text style={styles.feeValue}>{getAmountAfterFee()} NGNZ</Text>
            </View>
          </View>

          <View style={styles.transferContainer}>
            <TouchableOpacity
              style={[styles.transferButton, isTransferDisabled && styles.transferButtonDisabled]}
              onPress={handleContinue}
              disabled={isTransferDisabled}
            >
              <Text style={[styles.transferButtonText, isTransferDisabled && styles.transferButtonTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {isLoading && (
        <Loading />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 120, paddingTop: Layout.spacing.lg },
  guideBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.hintBg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.hintIcon,
    borderRadius: 8,
    padding: 10,
    marginBottom: Layout.spacing.lg,
  },
  guideIcon: { marginRight: 8 },
  guideText: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.hint,
    lineHeight: 16,
  },
  inputContainer: { marginBottom: Layout.spacing.lg },
  inputLabel: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.primary, marginBottom: Layout.spacing.xs },
  inputCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    width: '100%',
  },
  inputLeft: { flex: 1, justifyContent: 'center', minWidth: 0 },
  inputRight: { alignItems: 'flex-end', justifyContent: 'center', maxWidth: '50%' },
  amountInput: {
    fontFamily: Typography.medium,
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: '600',
    padding: 0,
    margin: 0,
    flexShrink: 1,
  },
  usdValue: { fontFamily: Typography.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  tokenIcon: { width: 18, height: 18, resizeMode: 'cover', marginRight: Layout.spacing.sm },
  tokenText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.text.primary, fontWeight: '600' },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.xs },
  balanceText: { fontFamily: Typography.regular, fontSize: 10, color: Colors.text.secondary },
  maxText: { fontFamily: Typography.medium, fontSize: 10, color: Colors.primary, fontWeight: '600' },
  maxTextDisabled: { opacity: 0.5 },
  minimumText: { fontFamily: Typography.regular, fontSize: 12, color: Colors.text.secondary, marginTop: Layout.spacing.sm },
  feeContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Layout.spacing.lg,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Layout.spacing.xs },
  feeLabel: { fontFamily: Typography.regular, fontSize: 14, color: Colors.text.secondary },
  feeValue: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.primary, fontWeight: '600' },
  transferContainer: { marginTop: Layout.spacing.lg },
  transferButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, alignItems: 'center' },
  transferButtonDisabled: { backgroundColor: '#E5E7EB' },
  transferButtonText: { fontFamily: Typography.medium, fontSize: 16, color: Colors.surface, fontWeight: '600' },
  transferButtonTextDisabled: { color: Colors.text.secondary },
});