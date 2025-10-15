import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useNGNZDeposit } from '../../hooks/useNGNZDeposit';

// Asset imports
const ngnzIcon = require('../../components/icons/NGNZ.png');
const backIcon = require('../../components/icons/backy.png');

export default function NGNZDepositScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'server' | 'general'>('general');
  const [depositDetails, setDepositDetails] = useState<any>(null);

  const { loading, initializeDeposit } = useNGNZDeposit();

  // Helpers
  const formatWithCommas = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) return value;
    
    // Handle the case where user enters a decimal point
    if (cleanValue.endsWith('.')) {
      return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.';
    }

    const number = parseFloat(cleanValue);
    if (isNaN(number)) return '';

    // Format with commas and handle decimals
    const formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length === 2) {
      return `${formatted}.${parts[1].slice(0, 2)}`;
    }
    return formatted;
  };

  const unformat = (value: string): string => value.replace(/,/g, '');

  const handleAmountChange = (text: string) => {
    // Don't format empty input
    if (!text) {
      setAmount('');
      return;
    }

    const formatted = formatWithCommas(text);
    setAmount(formatted);
    setShowError(false);
  };

  const handleDeposit = async () => {
    const rawAmount = parseFloat(unformat(amount));

    // Validation
    if (!rawAmount || rawAmount < 1000) {
      setErrorMessage('Minimum deposit amount is 1,000 NGNZ');
      setErrorType('validation');
      setShowError(true);
      return;
    }

    try {
      const result = await initializeDeposit(rawAmount);
      if (result.success) {
        // Show deposit details modal
        if (result.data) {
          // Navigate to receipt screen with bank details
          router.push({
            pathname: '/receipt/ngnz-deposit',
            params: {
              reference: result.data.reference,
              amount: rawAmount.toString(),
              transactionId: result.data.transactionId,
              bankName: result.data.bankDetails?.bankName,
              accountNumber: result.data.bankDetails?.accountNumber,
              accountName: result.data.bankDetails?.accountName
            }
          });
        }
      } else {
        setErrorMessage(result.message || 'Failed to initialize deposit');
        setErrorType(result.error === 'NETWORK_ERROR' ? 'network' : 'server');
        setShowError(true);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      setErrorType('general');
      setShowError(true);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit NGNZ</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputLeft}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text.secondary}
                  maxLength={15} // Prevent extremely long numbers
                  onFocus={() => {
                    if (amount === '0' || amount === '0.00') {
                      setAmount('');
                    }
                  }}
                  onBlur={() => {
                    if (!amount) {
                      setAmount('0.00');
                    } else if (!amount.includes('.')) {
                      setAmount(amount + '.00');
                    } else {
                      const parts = amount.split('.');
                      if (parts[1].length === 0) setAmount(amount + '00');
                      else if (parts[1].length === 1) setAmount(amount + '0');
                    }
                  }}
                />
              </View>
              <View style={styles.inputRight}>
                <View style={styles.tokenSelector}>
                  <Image source={ngnzIcon} style={styles.tokenIcon} />
                  <Text style={styles.tokenText}>NGNZ</Text>
                </View>
              </View>
            </View>
            <Text style={styles.minimumText}>
              Minimum amount - 1,000.00 NGNZ
            </Text>
          </View>

          {/* Deposit Button */}
          <View style={styles.depositContainer}>
            <TouchableOpacity
              style={[styles.depositButton, loading && styles.depositButtonDisabled]}
              onPress={handleDeposit}
              disabled={loading || !amount}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.depositButtonText}>
                  Deposit Now
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Error Display */}
        {showError && (
          <ErrorDisplay
            type={errorType}
            message={errorMessage}
            onDismiss={() => setShowError(false)}
          />
        )}

      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  headerTitle: {
    fontFamily: Typography.medium,
    fontSize: 18,
    color: '#35297F',
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 120,
    paddingTop: Layout.spacing.lg
  },
  inputContainer: {
    marginBottom: Layout.spacing.lg
  },
  inputLabel: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs
  },
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
  inputLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0
  },
  inputRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '50%'
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
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  tokenIcon: {
    width: 18,
    height: 18,
    resizeMode: 'cover',
    marginRight: Layout.spacing.sm
  },
  tokenText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600'
  },
  minimumText: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.sm
  },
  depositContainer: {
    marginTop: Layout.spacing.lg
  },
  depositButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center'
  },
  depositButtonDisabled: {
    backgroundColor: '#E5E7EB'
  },
  depositButtonText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '600'
  }
});