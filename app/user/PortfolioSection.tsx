// app/components/PortfolioSection.tsx

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ImageBackground,
  Animated
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDashboard } from '../../hooks/useDashboard';

// Asset imports
const depositIcon    = require('../../components/icons/deposit-icon.png');
const transferIcon   = require('../../components/icons/transfer-icon.png');
const utilitiesIcon  = require('../../components/icons/Airtime.png'); 
const swapIcon       = require('../../components/icons/swap-icon.png');
const portfolioBg    = require('../../assets/images/portfolio-bgg.jpg');
const eyeIcon        = require('../../components/icons/eye-icon.png');

interface QuickLink {
  id: string;
  title: string;
  icon: any;
  route: string;
}

interface PortfolioSectionProps {
  balanceVisible: boolean;
  onQuickLinkPress: (link: QuickLink) => void;
  onSeeMore: () => void;
  onSetupPress: () => void;
  onToggleBalanceVisibility: () => void;
}

export default function PortfolioSection({ 
  balanceVisible, 
  onQuickLinkPress, 
  onSeeMore,
  onSetupPress,
  onToggleBalanceVisibility,
}: PortfolioSectionProps) {
  const { totalPortfolioBalance, completionPercentage } = useDashboard();
  const safeBalance = totalPortfolioBalance || 0;
  const formattedUsdBalance = `$${safeBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const quickLinks: QuickLink[] = [
    { id: 'deposit',   title: 'Deposit',   icon: depositIcon,   route: '/user/come-soon' },
    { id: 'transfer',  title: 'Transfer',  icon: transferIcon,  route: '/user/come-soon' },
    { id: 'buy-sell',  title: 'Buy/Sell',  icon: swapIcon,      route: '/user/Swap' },
    { id: 'utility',   title: 'Buy Airtime',   icon: utilitiesIcon, route: '/user/Airtime' },
  ];

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(completionPercentage)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionPercentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [completionPercentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 33, 66, 100],
    outputRange: ['0%', '40%', '66%', '100%'],
    extrapolate: 'clamp',
  });
  const textTranslateX = progressAnim.interpolate({
    inputRange: [0, 33, 66, 100],
    outputRange: [0, -50, 5, 0],
    extrapolate: 'clamp',
  });
  const textOpacity = progressAnim.interpolate({
    inputRange: [0, 99, 100],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const showSetup = completionPercentage < 100;

  return (
    <View style={styles.container}>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <ImageBackground
          source={portfolioBg}
          style={styles.balanceBackground}
          imageStyle={styles.balanceBackgroundImage}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? formattedUsdBalance : '****'}
              </Text>
              <TouchableOpacity onPress={onToggleBalanceVisibility}>
                <Image source={eyeIcon} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksContainer}>
        <View style={styles.quickLinksHeader}>
          <Text style={styles.quickLinksTitle}>Quick Links</Text>
          <TouchableOpacity onPress={onSeeMore}>
            <Text style={styles.seeMore}>see more</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickLinksList}>
          {quickLinks.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickLinkItem}
              onPress={() => onQuickLinkPress(item)}
              activeOpacity={0.7}
            >
              <Image source={item.icon} style={styles.quickLinkIconImage} />
              <Text style={styles.quickLinkText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Setup Banner */}
      {showSetup && (
        <TouchableOpacity style={styles.setupBanner} onPress={onSetupPress}>
          <View style={styles.setupContent}>
            <Text style={styles.setupText}>Finalize your setup</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                <Animated.Text
                  style={[
                    styles.progressText,
                    {
                      transform: [{ translateX: textTranslateX }],
                      opacity: textOpacity,
                    },
                  ]}
                >
                  {Math.round(completionPercentage)}%
                </Animated.Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  balanceCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  balanceBackground: {
    height: 151,
    justifyContent: 'center',
    backgroundColor: '#4A3FAD',
  },
  balanceBackgroundImage: {
    borderRadius: Layout.borderRadius.lg,
  },
  balanceContent: {
    padding: Layout.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  balanceLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.surface,
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
    fontSize: 32,
    color: Colors.surface,
    fontWeight: '500',
    textAlign: 'center',
  },
  eyeIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.surface,
    marginLeft: 6,
  },
  quickLinksContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  quickLinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  quickLinksTitle: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
  },
  seeMore: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.primary,
  },
  quickLinksList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xs,
  },
  quickLinkItem: {
    flex: 1,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  quickLinkIconImage: {
    width: 44,
    height: 44,
    borderRadius: 22,       // circular
    resizeMode: 'contain',
  },
  quickLinkText: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  setupBanner: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 0.5,
    borderColor: '#F0A202',
    padding: Layout.spacing.md,
  },
  setupContent: {
    alignItems: 'center',
  },
  setupText: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: '#35297F',
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 14,
    backgroundColor: '#FFFBDB',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F0A202',
    borderRadius: 7,
  },
  progressText: {
    position: 'absolute',
    fontFamily: Typography.medium,
    fontSize: 10,
    color: '#F4F2FF',
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
    lineHeight: 14,
  },
});
