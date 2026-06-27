// components/UtilityPurchaseSuccessModal.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Alert,
  // If you're on newer RN, prefer:
  // import Clipboard from '@react-native-clipboard/clipboard'
  Clipboard,
} from 'react-native';
import { Typography } from '../constants/Typography';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { Layout } from '../constants/Layout';
import { useRouter } from 'expo-router';

type Receipt = {
  customer_name?: string;
  customer_address?: string;
  token?: string;
  units?: string | number;
  band?: string;
  amount?: number | string;
  request_id?: string;
};

interface UtilityPurchaseSuccessModalProps {
  utilityType: string;         // e.g. "Electricity"
  amount: string;              // e.g. "₦10,000"
  phoneNumber: string;         // meter/account number
  network: string;             // provider name
  visible?: boolean;
  onContinue?: () => void;
  additionalInfo?: string;
  /** NEW: raw API response data to display */
  receipt?: Receipt | null;
}

export default function UtilityPurchaseSuccessModal({
  utilityType,
  amount,
  phoneNumber,
  network,
  visible = true,
  onContinue,
  additionalInfo,
  receipt
}: UtilityPurchaseSuccessModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const handleContinue = () => {
    if (onContinue) onContinue();
    setTimeout(() => {
      router.push('/user/utility');
    }, 150);
  };

  const copyToken = async () => {
    if (!receipt?.token) return;
    try {
      await Clipboard.setString(receipt.token);
      Alert.alert('Copied!', 'Electricity token copied to clipboard');
    } catch {
      Alert.alert('Copy failed', 'Unable to copy token to clipboard');
    }
  };

  // Format helpers (keep everything single-line, compact, no scroll)
  const formatUnits = (u?: string | number) => {
    if (u == null) return '—';
    const n = Number(u);
    return isNaN(n) ? String(u) : `${n.toFixed(2)} kWh`;
  };
  const displayAmount =
    typeof receipt?.amount === 'number'
      ? `₦${receipt.amount.toLocaleString('en-NG')}`
      : receipt?.amount || amount;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.overlayBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('../components/icons/check-check.png')}
                  style={styles.checkmarkIcon}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>{`${utilityType} Purchase Successful`}</Text>

              {/* Compact, single-screen details block */}
              <View style={styles.detailsCard}>
                <Row label="Customer Name" value={receipt?.customer_name || '—'} />
                <Row label="Address" value={receipt?.customer_address || '—'} />
                <Row
                  label="Token"
                  value={
                    receipt?.token
                      ? receipt.token.replace(/(.{4})/g, '$1 ').trim()
                      : '—'
                  }
                  rightAdornment={
                    receipt?.token ? (
                      <TouchableOpacity style={styles.copyButton} onPress={copyToken} activeOpacity={0.8}>
                        <Image
                          source={require('../components/icons/copy-icon.png')}
                          style={styles.copyIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ) : null
                  }
                />
                <Row label="Units" value={formatUnits(receipt?.units)} />
                <Row label="Band" value={receipt?.band || '—'} />
                <Row label="Amount" value={displayAmount} />
                <Row label="Request ID" value={receipt?.request_id || '—'} />
              </View>

              {/* Small context line (optional) */}
              <Text style={styles.metaLine} numberOfLines={1}>
                {`${network} • ${phoneNumber}`}
              </Text>
              {!!additionalInfo && (
                <Text style={styles.metaLine} numberOfLines={1}>
                  {additionalInfo}
                </Text>
              )}

              <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Row({
  label,
  value,
  rightAdornment,
}: {
  label: string;
  value: string;
  rightAdornment?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
        {rightAdornment}
      </View>
    </View>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1 },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Layout?.spacing?.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: Layout?.borderRadius?.xl || 16,
    paddingHorizontal: Layout?.spacing?.xl || 24,
    paddingVertical: Layout?.spacing?.xl || 24,
    alignItems: 'center',
    width: '100%',

    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: { marginBottom: Layout?.spacing?.md || 16, alignItems: 'center', justifyContent: 'center' },
  checkmarkIcon: { width: 72, height: 72 },
  title: {
    fontFamily: Typography.bold || 'System',
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Layout?.spacing?.md || 16,
    fontWeight: '700',
  },

  detailsCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Layout?.spacing?.md || 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  rowLabel: {
    flexShrink: 0,
    width: 120,
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
  },
  rowValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  rowValue: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 1,
  },

  copyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyIcon: { width: 16, height: 16 },

  metaLine: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    marginBottom: Layout?.spacing?.sm || 10,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: Layout?.spacing?.md || 14,
    paddingHorizontal: Layout?.spacing?.xl || 24,
    borderRadius: Layout?.borderRadius?.lg || 10,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    fontFamily: Typography.medium || 'System',
  },
});
