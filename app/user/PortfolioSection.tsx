import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  Image, 
  ImageBackground, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { useDashboard } from '../../hooks/useDashboard';
import { useBanners } from '../../hooks/usebanners'; // Import the new hook

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - (Layout.spacing.lg * 2);

// Asset imports
const depositIcon    = require('../../components/icons/deposit-icon.png');
const transferIcon   = require('../../components/icons/transfer-icon.png');
const utilitiesIcon  = require('../../components/icons/utility.png'); 
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
  onToggleBalanceVisibility: () => void;
  onKYCInitiate?: (kycLevel: number, documentType: string) => void;
  kycLoading?: boolean;
  kycData?: any;
}

export default function PortfolioSection({ 
  balanceVisible, 
  onQuickLinkPress, 
  onSeeMore,
  onToggleBalanceVisibility,
  onKYCInitiate,
  kycLoading = false,
  kycData,
}: PortfolioSectionProps) {
  const router = useRouter();
  const { totalPortfolioBalance, completionPercentage } = useDashboard();
  const { banners } = useBanners(); // Fetch dynamic banners
  
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const safeBalance = totalPortfolioBalance || 0;
  const formattedUsdBalance = `$${safeBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const showSetup = completionPercentage < 100;

  // --- Combine KYC and Promo Banners into one array ---
  const slides = [];
  if (showSetup) {
    slides.push({ id: 'kyc-banner', type: 'kyc' });
  }
  banners?.forEach((banner: any) => {
    slides.push({ ...banner, type: 'promo' });
  });

  // --- Auto-slide Logic (3 seconds) ---
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  const quickLinks: QuickLink[] = [
    { id: 'deposit',   title: 'Deposit',   icon: depositIcon,   route: '/user/come-soon' },
    { id: 'transfer',  title: 'Transfer',  icon: transferIcon,  route: '/user/come-soon' },
    { id: 'buy-sell',  title: 'Buy/Sell',  icon: swapIcon,      route: '/user/Swap' },
    { id: 'utility',   title: 'Utility',   icon: utilitiesIcon, route: '/user/utility' },
  ];

  // Progress bar animation logic (Existing)
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

  const handleSetupPress = (): void => {
    router.push('/kyc/kyc-upgrade');
  };

  const renderSlide = ({ item }: { item: any }) => {
    // RENDER 1: Existing KYC Banner
    if (item.type === 'kyc') {
      return (
        <TouchableOpacity 
          style={[styles.setupBanner, kycLoading && styles.setupBannerLoading, { width: BANNER_WIDTH }]} 
          onPress={handleSetupPress}
          disabled={kycLoading}
          activeOpacity={0.7}
        >
          <View style={styles.setupContent}>
            <Text style={styles.setupText}>
              {kycLoading ? '🔄 Processing...' : 'Complete your kyc'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                <Animated.Text
                  style={[styles.progressText, { transform: [{ translateX: textTranslateX }], opacity: textOpacity }]}
                >
                  {Math.round(completionPercentage)}%
                </Animated.Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // RENDER 2: Dynamic Promo Banner
    return (
      <TouchableOpacity 
        style={[styles.promoBanner, { width: BANNER_WIDTH }]} 
        onPress={() => item.link && router.push(item.link as any)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.promoImage} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <ImageBackground source={portfolioBg} style={styles.balanceBackground} imageStyle={styles.balanceBackgroundImage}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{balanceVisible ? formattedUsdBalance : '****'}</Text>
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
            <TouchableOpacity key={item.id} style={styles.quickLinkItem} onPress={() => onQuickLinkPress(item)} activeOpacity={0.7}>
              <Image source={item.icon} style={styles.quickLinkIconImage} />
              <Text style={styles.quickLinkText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sliding Banner Section */}
      {slides.length > 0 && (
        <View style={styles.sliderWrapper}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(ev) => {
              setActiveIndex(Math.round(ev.nativeEvent.contentOffset.x / BANNER_WIDTH));
            }}
            keyExtractor={(item) => item._id || item.id}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Layout.spacing.lg },
  balanceCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg, borderRadius: Layout.borderRadius.lg, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#DDDDDD' },
  balanceBackground: { height: moderateScale(151, 0.1), justifyContent: 'center', backgroundColor: '#4A3FAD' },
  balanceBackgroundImage: { borderRadius: Layout.borderRadius.lg },
  balanceContent: { padding: Layout.spacing.lg, justifyContent: 'center', alignItems: 'center', height: '100%' },
  balanceLabel: { fontFamily: Typography.regular, fontSize: moderateScale(14, 0.1), color: Colors.surface, marginBottom: Layout.spacing.sm, textAlign: 'center' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceAmount: { fontFamily: Typography.medium, fontSize: moderateScale(32, 0.15), color: Colors.surface, fontWeight: '500', textAlign: 'center' },
  eyeIcon: { width: 12, height: 12, tintColor: Colors.surface, marginLeft: 6 },
  quickLinksContainer: { paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg },
  quickLinksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.md },
  quickLinksTitle: { fontFamily: Typography.medium, fontSize: moderateScale(16, 0.1), color: Colors.text.primary },
  seeMore: { fontFamily: Typography.regular, fontSize: moderateScale(12, 0.1), color: Colors.primary },
  quickLinksList: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.spacing.xs },
  quickLinkItem: { flex: 1, alignItems: 'center', gap: Layout.spacing.xs },
  quickLinkIconImage: { width: moderateScale(44, 0.1), height: moderateScale(44, 0.1), borderRadius: moderateScale(22, 0.1), resizeMode: 'contain' },
  quickLinkText: { fontFamily: Typography.regular, fontSize: moderateScale(12, 0.1), color: Colors.text.secondary, textAlign: 'center' },
  
  // Slider Styles
  sliderWrapper: { height: moderateScale(70, 0.1), marginBottom: Layout.spacing.lg },
  setupBanner: { marginHorizontal: Layout.spacing.lg, height: '100%', backgroundColor: '#F8F9FA', borderRadius: Layout.borderRadius.md, borderWidth: 0.5, borderColor: '#F0A202', padding: Layout.spacing.md, justifyContent: 'center' },
  promoBanner: { marginHorizontal: Layout.spacing.lg, height: '100%', borderRadius: Layout.borderRadius.md, overflow: 'hidden' },
  promoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  setupBannerLoading: { opacity: 0.7, backgroundColor: '#E8E8E8' },
  setupContent: { alignItems: 'center' },
  setupText: { fontFamily: Typography.regular, fontSize: moderateScale(12, 0.1), color: '#35297F', textAlign: 'center', marginBottom: Layout.spacing.xs },
  progressBarContainer: { width: '100%', alignItems: 'center' },
  progressBar: { width: '100%', height: moderateScale(14, 0.1), backgroundColor: '#FFFBDB', borderRadius: moderateScale(7, 0.1), overflow: 'hidden' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F0A202', borderRadius: moderateScale(7, 0.1) },
  progressText: { position: 'absolute', fontFamily: Typography.medium, fontSize: moderateScale(10, 0.1), color: '#F4F2FF', fontWeight: '600', width: '100%', textAlign: 'center', lineHeight: moderateScale(14, 0.1) },
});