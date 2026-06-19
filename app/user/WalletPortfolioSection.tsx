import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useDashboard } from '../../hooks/useDashboard';

const eyeIcon = require('../../components/icons/eye-icon.png');

type QuickLink = {
  id: 'deposit' | 'transfer' | 'buy-sell';
  title: string;
  iconName: string;
  route?: string;
};

interface WalletPortfolioSectionProps {
  balanceVisible: boolean;
  onToggleBalanceVisibility: () => void;
  onQuickLinkPress?: (link: any) => void;
  onSeeMore?: () => void;
  onSetupPress?: () => void;
}

const quickLinks: QuickLink[] = [
  { id: 'deposit',  title: 'Deposit',  iconName: 'download-outline' },
  { id: 'transfer', title: 'Withdraw', iconName: 'send-outline' },
  { id: 'buy-sell', title: 'Swap',     iconName: 'swap-horizontal-outline', route: '/user/Swap' },
];

export default function WalletPortfolioSection({
  balanceVisible,
  onToggleBalanceVisibility,
  onQuickLinkPress,
}: WalletPortfolioSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { totalPortfolioBalance, ngnzExchangeRate } = useDashboard();
  const safeBalance = totalPortfolioBalance || 0;
  const rate = ngnzExchangeRate ?? 1600;
  const balanceNGN = safeBalance * rate;

  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'NGN'>('USD');

  const formattedBalance =
    displayCurrency === 'USD'
      ? `$${safeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `₦${balanceNGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      {/* Balance — no card background, bare on screen */}
      <View style={styles.balanceSection}>
        <View style={styles.currencySwitch}>
          <TouchableOpacity
            style={[styles.currencySegment, displayCurrency === 'USD' && styles.currencySegmentActiveLeft]}
            onPress={() => setDisplayCurrency('USD')}
            activeOpacity={0.7}
          >
            <Text style={[styles.currencySegmentText, displayCurrency === 'USD' && styles.currencySegmentTextActive]}>USD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencySegment, displayCurrency === 'NGN' && styles.currencySegmentActiveRight]}
            onPress={() => setDisplayCurrency('NGN')}
            activeOpacity={0.7}
          >
            <Text style={[styles.currencySegmentText, displayCurrency === 'NGN' && styles.currencySegmentTextActive]}>NGN</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>{balanceVisible ? formattedBalance : '****'}</Text>
          <TouchableOpacity onPress={onToggleBalanceVisibility}>
            <Image source={eyeIcon} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksContainer}>
        <View style={styles.quickLinksList}>
          {quickLinks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickLinkItem}
              onPress={() => onQuickLinkPress?.(item)}
              activeOpacity={0.7}
            >
              <View style={styles.quickLinkIconContainer}>
                <Ionicons name={item.iconName as any} size={moderateScale(24, 0.1)} color="#FFFFFF" />
              </View>
              <Text style={styles.quickLinkText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  balanceSection: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  currencySwitch: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 20,
    padding: 3,
    marginBottom: Layout.spacing.xl,
  },
  currencySegment: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    minWidth: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySegmentActiveLeft: {
    backgroundColor: colors.primary,
    borderRadius: 17,
  },
  currencySegmentActiveRight: {
    backgroundColor: colors.primary,
    borderRadius: 17,
  },
  currencySegmentText: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(11, 0.1),
    color: colors.textSecondary,
  },
  currencySegmentTextActive: {
    color: '#FFFFFF',
  },
  balanceLabel: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(14, 0.1),
    color: colors.textSecondary,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontFamily: Typography.medium,
    fontSize: moderateScale(32, 0.15),
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  eyeIcon: {
    width: 12,
    height: 12,
    tintColor: colors.text,
    marginLeft: 6,
  },
  quickLinksContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  quickLinksList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickLinkItem: {
    flex: 1,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  quickLinkIconContainer: {
    width: moderateScale(52, 0.1),
    height: moderateScale(52, 0.1),
    borderRadius: moderateScale(10, 0.1),
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkText: {
    fontFamily: Typography.regular,
    fontSize: moderateScale(12, 0.1),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
