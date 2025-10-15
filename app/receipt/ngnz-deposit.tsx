import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

// Icons
import backIcon from '../../components/icons/backy.png';

interface DepositParams {
  amount?: string;
  reference?: string;
  transactionId?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export default function NGNZDepositReceipt() {
  const router = useRouter();
  const params = useLocalSearchParams<DepositParams>();

  const handleGoBack = () => router.back();

  const formatAmount = (amount: string | undefined) => {
    if (!amount) return '0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleShare = async () => {
    try {
      const message = `Bank: ${params.bankName || 'N/A'}
Account Number: ${params.accountNumber || 'N/A'}
Account Name: ${params.accountName || 'N/A'}
Amount: ₦${formatAmount(params.amount)}
Reference: ${params.reference || 'N/A'}`;

      await Share.share({
        message,
        title: 'Bank Transfer Details'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Bank Transfer Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount to Send</Text>
            <Text style={styles.amountValue}>₦{formatAmount(params.amount)}</Text>
          </View>

          {/* Bank Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>{params.bankName || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>{params.accountNumber || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Name</Text>
              <Text style={styles.detailValue}>{params.accountName || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{params.reference || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{params.transactionId || 'N/A'}</Text>
            </View>
          </View>

          {/* Important Notice */}
          <View style={styles.noticeSection}>
            <Text style={styles.noticeTitle}>Important:</Text>
            <Text style={styles.noticeText}>
              • Use the exact amount including decimals{'\n'}
              • Include the reference in your transfer{'\n'}
              • Funds will be credited after confirmation
            </Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Share Details</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
    flex: 1,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: Colors.surface,
    paddingVertical: 20,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: Typography.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  noticeSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: '#92400E',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    fontFamily: Typography.regular,
    color: '#92400E',
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  shareButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
});
