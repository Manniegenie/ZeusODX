import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

interface DepositData {
  reference?: string;
  amount?: number;
  transactionId?: string;
  timestamp?: string;
  paymentUrl?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  } | null;
}

interface DepositDetailsProps {
  visible: boolean;
  onClose: () => void;
  depositData: DepositData;
  loading?: boolean;
}

const NGNZDepositDetails: React.FC<DepositDetailsProps> = ({
  visible,
  onClose,
  depositData,
  loading = false,
}) => {
  const handleShare = async () => {
    try {
      const message = `Bank: ${depositData.bankDetails?.bankName || 'N/A'}\nAccount Number: ${depositData.bankDetails?.accountNumber || 'N/A'}\nAccount Name: ${depositData.bankDetails?.accountName || 'N/A'}\nAmount: ₦${formatAmount(depositData.amount)}\nReference: ${depositData.reference || 'N/A'}`;
      await Share.share({
        message,
        title: 'Bank Transfer Details'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatAmount = (amount: number | undefined) => {
    if (!amount && amount !== 0) return '0.00';
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Fetching bank details...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.contentContainer}
            >
              <Text style={styles.title}>Bank Transfer Details</Text>
              
              {/* Amount Section */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount to Send</Text>
                <Text style={styles.amountValue}>₦{formatAmount(depositData.amount)}</Text>
              </View>

              {/* Bank Details */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bank Name</Text>
                  <Text style={styles.detailValue}>{depositData.bankDetails?.bankName || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailValue}>{depositData.bankDetails?.accountNumber || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Name</Text>
                  <Text style={styles.detailValue}>{depositData.bankDetails?.accountName || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{depositData.reference || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{depositData.transactionId || 'N/A'}</Text>
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

              {/* Action Buttons */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Text style={styles.shareButtonText}>Share Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    margin: 0, // Ensure no margin
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%', // Limit maximum height
    width: '100%', // Full width
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Extra padding for iOS
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 24,
    fontFamily: Typography.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 20,
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
  buttonSection: {
    marginTop: 'auto',
    paddingTop: 20,
    gap: 12,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
  },
});

export default NGNZDepositDetails;
