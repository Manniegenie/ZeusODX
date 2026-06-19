import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import BottomTabNavigator from '../../components/BottomNavigator';
import backIcon from '../../components/icons/backy.png';
import Loading from '../../components/Loading';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Typography } from '../../constants/Typography';

// Brand icons
import itunesIcon    from '../../components/icons/iTunes.png';
import lensIcon      from '../../components/icons/lens-icon.png';
import footlockerIcon from '../../components/icons/footlocker.png';
import macyIcon      from '../../components/icons/macy.png';
import nikeIcon      from '../../components/icons/nike.png';
import nordstromIcon from '../../components/icons/nordstrom.png';
import razorGoldIcon from '../../components/icons/razor-gold.png';
import sephoraIcon   from '../../components/icons/sephora.png';
import steamIcon     from '../../components/icons/steam.png';
import xboxIcon      from '../../components/icons/xbox.png';

// Country flags
import flagUS from '../../components/icons/united-states.png';
import flagCA from '../../components/icons/canada.png';
import flagGB from '../../components/icons/united-kingdom.png';
import flagAU from '../../components/icons/australia.png';
import flagCH from '../../components/icons/switzerland.png';
import flagEU from '../../assets/images/world.png';

/* ─────────────── Types ─────────────── */
type GiftCardEntry = {
  id: string;
  name: string;
  countryLabel: string;
  countryCode: string;
  countryName: string;
  iconSrc: any;
  flagSrc: any;
};

type BrandSection = {
  brandId: string;
  brandTitle: string;
  cards: GiftCardEntry[];
};

/* ─────────────── Data (static, outside component) ─────────────── */
const BRAND_SECTIONS: BrandSection[] = [
  {
    brandId: 'itunes',
    brandTitle: 'iTunes / Apple',
    cards: [
      { id: 'itunes-us', name: 'Apple/iTunes', countryLabel: 'United States', countryCode: 'US',         countryName: 'United States',   iconSrc: itunesIcon,     flagSrc: flagUS },
      { id: 'itunes-ca', name: 'Apple/iTunes', countryLabel: 'Canada',         countryCode: 'CANADA',     countryName: 'Canada',          iconSrc: itunesIcon,     flagSrc: flagCA },
      { id: 'itunes-uk', name: 'Apple/iTunes', countryLabel: 'United Kingdom', countryCode: 'GB',         countryName: 'United Kingdom',  iconSrc: itunesIcon,     flagSrc: flagGB },
      { id: 'itunes-au', name: 'Apple/iTunes', countryLabel: 'Australia',      countryCode: 'AUSTRALIA',  countryName: 'Australia',       iconSrc: itunesIcon,     flagSrc: flagAU },
      { id: 'itunes-eu', name: 'Apple/iTunes', countryLabel: 'Europe',         countryCode: 'EUROPE',     countryName: 'Europe',          iconSrc: itunesIcon,     flagSrc: flagEU },
    ],
  },
  {
    brandId: 'steam',
    brandTitle: 'Steam',
    cards: [
      { id: 'steam-us', name: 'Steam Card', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: steamIcon, flagSrc: flagUS },
      { id: 'steam-ca', name: 'Steam Card', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: steamIcon, flagSrc: flagCA },
      { id: 'steam-uk', name: 'Steam Card', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: steamIcon, flagSrc: flagGB },
      { id: 'steam-eu', name: 'Steam Card', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: steamIcon, flagSrc: flagEU },
    ],
  },
  {
    brandId: 'nordstrom',
    brandTitle: 'Nordstrom',
    cards: [
      { id: 'nordstrom-us', name: 'Nordstrom', countryLabel: 'United States', countryCode: 'US', countryName: 'United States', iconSrc: nordstromIcon, flagSrc: flagUS },
    ],
  },
  {
    brandId: 'macy',
    brandTitle: "Macy's",
    cards: [
      { id: 'macy-us', name: 'Macy', countryLabel: 'United States', countryCode: 'US', countryName: 'United States', iconSrc: macyIcon, flagSrc: flagUS },
    ],
  },
  {
    brandId: 'nike',
    brandTitle: 'Nike',
    cards: [
      { id: 'nike-us', name: 'Nike Gift Card', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: nikeIcon, flagSrc: flagUS },
      { id: 'nike-ca', name: 'Nike Gift Card', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: nikeIcon, flagSrc: flagCA },
      { id: 'nike-uk', name: 'Nike Gift Card', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: nikeIcon, flagSrc: flagGB },
      { id: 'nike-eu', name: 'Nike Gift Card', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: nikeIcon, flagSrc: flagEU },
    ],
  },
  {
    brandId: 'razor-gold',
    brandTitle: 'Razer Gold',
    cards: [
      { id: 'razor-gold-us', name: 'Razor Gold Gift Card', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: razorGoldIcon, flagSrc: flagUS },
      { id: 'razor-gold-ca', name: 'Razor Gold Gift Card', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: razorGoldIcon, flagSrc: flagCA },
      { id: 'razor-gold-uk', name: 'Razor Gold Gift Card', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: razorGoldIcon, flagSrc: flagGB },
      { id: 'razor-gold-eu', name: 'Razor Gold Gift Card', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: razorGoldIcon, flagSrc: flagEU },
    ],
  },
  {
    brandId: 'sephora',
    brandTitle: 'Sephora',
    cards: [
      { id: 'sephora-us', name: 'Sephora', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: sephoraIcon, flagSrc: flagUS },
      { id: 'sephora-ca', name: 'Sephora', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: sephoraIcon, flagSrc: flagCA },
      { id: 'sephora-uk', name: 'Sephora', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: sephoraIcon, flagSrc: flagGB },
      { id: 'sephora-eu', name: 'Sephora', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: sephoraIcon, flagSrc: flagEU },
    ],
  },
  {
    brandId: 'footlocker',
    brandTitle: 'Foot Locker',
    cards: [
      { id: 'footlocker-us', name: 'Footlocker', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: footlockerIcon, flagSrc: flagUS },
      { id: 'footlocker-ca', name: 'Footlocker', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: footlockerIcon, flagSrc: flagCA },
      { id: 'footlocker-uk', name: 'Footlocker', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: footlockerIcon, flagSrc: flagGB },
      { id: 'footlocker-eu', name: 'Footlocker', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: footlockerIcon, flagSrc: flagEU },
    ],
  },
  {
    brandId: 'xbox',
    brandTitle: 'Xbox',
    cards: [
      { id: 'xbox-us', name: 'Xbox Card', countryLabel: 'United States', countryCode: 'US',        countryName: 'United States',  iconSrc: xboxIcon, flagSrc: flagUS },
      { id: 'xbox-ca', name: 'Xbox Card', countryLabel: 'Canada',        countryCode: 'CANADA',    countryName: 'Canada',         iconSrc: xboxIcon, flagSrc: flagCA },
      { id: 'xbox-uk', name: 'Xbox Card', countryLabel: 'United Kingdom',countryCode: 'GB',        countryName: 'United Kingdom', iconSrc: xboxIcon, flagSrc: flagGB },
      { id: 'xbox-eu', name: 'Xbox Card', countryLabel: 'Europe',        countryCode: 'EUROPE',    countryName: 'Europe',         iconSrc: xboxIcon, flagSrc: flagEU },
    ],
  },
];

const ALL_CARDS: GiftCardEntry[] = BRAND_SECTIONS.flatMap(s => s.cards);

/* ─────────────── Screen ─────────────── */
const GiftCardScreen = ({ onGiftCardSelect }: { onGiftCardSelect?: (card: GiftCardEntry) => void }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(false);
    }, [])
  );

  // null = show sections; array = flat search results
  const filteredCards = useMemo<GiftCardEntry[] | null>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_CARDS.filter(card => {
      const section = BRAND_SECTIONS.find(s => s.cards.some(c => c.id === card.id));
      return (
        card.countryLabel.toLowerCase().includes(q) ||
        card.countryName.toLowerCase().includes(q) ||
        card.name.toLowerCase().includes(q) ||
        (section?.brandTitle.toLowerCase().includes(q) ?? false)
      );
    });
  }, [searchQuery]);

  const handleGiftCardPress = (giftCard: GiftCardEntry) => {
    onGiftCardSelect?.(giftCard);
    setIsLoading(true);
    router.push({
      pathname: '/Giftcard/Giftcardtrade',
      params: {
        brand: giftCard.name,
        id: giftCard.id,
        countryCode: giftCard.countryCode,
        countryName: giftCard.countryName,
      },
    });
  };

  /* ── Card tile ── */
  const renderCard = (item: GiftCardEntry) => (
    <TouchableOpacity
      key={item.id}
      style={styles.cardItem}
      onPress={() => handleGiftCardPress(item)}
      activeOpacity={0.82}
    >
      {/* Card image + flag badge */}
      <View style={styles.cardWrapper}>
        <View style={styles.cardImageBox}>
          <Image source={item.iconSrc} style={styles.cardImage} />
          {/* Glossy gradient-like tint strip at bottom of card */}
          <View style={styles.cardShimmer} />
        </View>
        {/* Circular flag badge — overflows bottom-right corner */}
        <View style={styles.flagRing}>
          <Image source={item.flagSrc} style={styles.flagImg} />
        </View>
      </View>

      {/* Country label */}
      <Text style={styles.cardCountry} numberOfLines={1}>
        {item.countryLabel}
      </Text>
    </TouchableOpacity>
  );

  /* ── Brand section ── */
  const renderSection = (section: BrandSection) => (
    <View key={section.brandId} style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{section.brandTitle}</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.grid}>
        {section.cards.map(renderCard)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor={colors.background} barStyle={colors.statusBar} />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Redeem Gift Card</Text>
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Image source={lensIcon} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search brand or country…"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cards */}
          <View style={styles.content}>
            {filteredCards ? (
              /* ── Search results ── */
              <View>
                <Text style={styles.resultHint}>
                  {filteredCards.length} result{filteredCards.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.grid}>
                  {filteredCards.map(renderCard)}
                </View>
              </View>
            ) : (
              /* ── Brand sections ── */
              BRAND_SECTIONS.map(renderSection)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="giftcard" />
      {isLoading && <Loading />}
    </View>
  );
};

/* ─────────────── Styles ─────────────── */
const S = moderateScale;

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe:      { flex: 1 },
  scroll:    { flex: 1 },

  /* Header */
  headerSection: {
    paddingHorizontal: S(16, 0.1),
    paddingTop: S(12, 0.1),
    paddingBottom: S(4, 0.1),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: S(40, 0.1),
    height: S(40, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: S(20, 0.1),
  },
  backIcon: { width: S(24, 0.1), height: S(24, 0.1), resizeMode: 'contain', tintColor: colors.text },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: S(18, 0.1),
    fontWeight: '700',
    marginHorizontal: S(8, 0.1),
    letterSpacing: 0.2,
  },
  headerRight: { width: S(40, 0.1) },

  /* Search */
  searchWrap: {
    paddingHorizontal: S(16, 0.1),
    paddingVertical: S(10, 0.1),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: S(12, 0.1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: S(14, 0.1),
    paddingVertical: S(13, 0.1),
    shadowColor: '#35297F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: { width: S(16, 0.1), height: S(16, 0.1), resizeMode: 'contain', marginRight: S(10, 0.1), opacity: 0.5 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: Typography.regular || 'System',
    fontSize: S(14, 0.1),
  },
  searchClear: { color: '#9CA3AF', fontSize: S(13, 0.1), fontWeight: '600', paddingLeft: 6 },

  /* Content */
  content: {
    paddingHorizontal: S(16, 0.1),
    paddingBottom: S(36, 0.1),
  },
  resultHint: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: S(12, 0.1),
    marginBottom: S(14, 0.1),
  },

  /* Section */
  section: { marginBottom: S(30, 0.1) },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: S(8, 0.1),
    paddingHorizontal: S(12, 0.1),
    paddingVertical: S(6, 0.1),
    marginBottom: S(16, 0.1),
    alignSelf: 'flex-start',
  },
  sectionAccent: { display: 'none' as any },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: S(13, 0.1),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionLine: { display: 'none' as any },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: S(24, 0.1),
  },

  /* Card item */
  cardItem: {
    width: '47%',
    paddingBottom: S(4, 0.1),
  },

  /* Card image area */
  cardWrapper: {
    position: 'relative',
  },
  cardImageBox: {
    width: '100%',
    aspectRatio: 155 / 142,
    borderRadius: S(12, 0.1),
    overflow: 'hidden',
    backgroundColor: '#EDE9FF',
    shadowColor: '#35297F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  /* subtle bottom shimmer to add depth */
  cardShimmer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(53,41,127,0.08)',
  },

  /* Flag badge */
  flagRing: {
    position: 'absolute',
    bottom: -S(8, 0.1),
    right: -S(4, 0.1),
    width: S(28, 0.1),
    height: S(28, 0.1),
    borderRadius: S(14, 0.1),
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  flagImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* Country label */
  cardCountry: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: S(11, 0.1),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: S(13, 0.1),
    letterSpacing: 0.15,
  },
});

export default GiftCardScreen;
