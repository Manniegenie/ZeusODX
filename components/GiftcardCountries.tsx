// components/giftcards/AvailableCountry.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { Typography } from '../constants/Typography';
import { useGiftcardCountries } from '../hooks/usegiftcardCountry';

/* ========= Custom flag PNGs ========= */
/* kept your original relative paths so bundler resolves same as before */
import flagUS from '../components/icons/united-states.png';
import flagGB from '../components/icons/united-kingdom.png';
import flagCA from '../components/icons/canada.png';
import flagDE from '../components/icons/germany.png';
import flagFR from '../components/icons/france.png';
import flagAU from '../components/icons/australia.png';
import flagAE from '../components/icons/united-arab-emirates.png';
import flagTR from '../components/icons/turkey.png';
import flagCH from '../components/icons/switzerland.png';
import flagEU from '../assets/images/world.png';

/* ========= Types ========= */
export type CountryItem = {
  id: string;
  name: string;
  flag: ImageSourcePropType;
  rate?: number;
  rateDisplay?: string;
};

/* ========= Flag registry (keeps many keys for compatibility) ========= */
const FLAGS: Record<string, ImageSourcePropType> = {
  US: flagUS,
  GB: flagGB,
  CA: flagCA,
  DE: flagDE,
  FR: flagFR,
  AU: flagAU,
  AE: flagAE,
  TR: flagTR,
  CH: flagCH,
  EU: flagEU,
  // alternative keys your backend or fallback might use
  CANADA: flagCA,
  AUSTRALIA: flagAU,
  SWITZERLAND: flagCH,
  EUROPE: flagEU,
  UNITED_STATES: flagUS,
  UNITEDSTATES: flagUS,
};

/* ========= Normalize API country codes ========= */
const normalizeCountryCode = (code = ''): string => {
  const normalized = String(code || '').toUpperCase().trim();
  const mapping: Record<string, string> = {
    CANADA: 'CA',
    AUSTRALIA: 'AU',
    SWITZERLAND: 'CH',
    EUROPE: 'EU',
    'EUROPEAN UNION': 'EU',
    'UNITED STATES': 'US',
    'UNITED_STATES': 'US',
    UNITEDSTATES: 'US',
    US: 'US',
  };
  if (mapping[normalized]) return mapping[normalized];
  if (normalized.length === 2) return normalized;
  return normalized;
};

/* ========= Local Bottom Sheet ========= */
const SHEET_MAX_HEIGHT = 660;

const Sheet = ({
  visible,
  onClose,
  children,
  maxHeight = SHEET_MAX_HEIGHT,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_MAX_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  transform: [{ translateY }],
                  maxHeight,
                  paddingBottom: Math.max(12, insets.bottom + 12),
                },
              ]}
            >
              <View style={styles.handleBar} />
              {children}
              <View style={{ height: insets.bottom }} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/* ========= Exported Country Sheet with Hook Integration ========= */
export function AvailableCountrySheet({
  visible,
  brand,
  selectedCountryId,
  filterCountryId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  brand: string;
  selectedCountryId?: string;
  filterCountryId?: string;
  onSelect: (country: CountryItem) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // keep your original brand -> canonical mapping approach
  const normalizedBrand = useMemo(() => {
    if (!brand) return '';
    const brandMap: Record<string, string> = {
      'Amazon': 'AMAZON',
      'Steam': 'STEAM',
      'Apple': 'APPLE',
      'iTunes': 'APPLE',
      'Google Play': 'GOOGLE_PLAY',
      'Nordstrom': 'NORDSTROM',
      'Macy': 'MACY',
      'Macy\'s': 'MACY',
      'Nike': 'NIKE',
      'Visa': 'VISA',
      'Vanilla': 'VANILLA',
      'Razor Gold': 'RAZOR_GOLD',
      'American Express': 'AMERICAN_EXPRESS',
      'Amex': 'AMERICAN_EXPRESS',
      'Sephora': 'SEPHORA',
      'Footlocker': 'FOOTLOCKER',
      'Xbox': 'XBOX',
      'eBay': 'EBAY'
    };
    return brandMap[brand] || brand.toUpperCase().replace(/\s+/g, '_');
  }, [brand]);

  // Use your original hook import path
  const {
    countries: apiCountries,
    loading,
    error,
    fetchCountries,
    hasCountries,
  } = useGiftcardCountries({
    cardType: normalizedBrand,
    autoFetch: false,
  });

  const fallbackCountries = useMemo((): CountryItem[] => {
    const brandCountries: Record<string, CountryItem[]> = {
      AMAZON: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
        { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
        { id: 'SWITZERLAND', name: 'Switzerland', flag: FLAGS.CH },
        { id: 'EUROPE', name: 'Europe', flag: FLAGS.EU },
      ],
      STEAM: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
        { id: 'GB', name: 'United Kingdom', flag: FLAGS.GB },
        { id: 'EUROPE', name: 'Europe', flag: FLAGS.EU },
      ],
      APPLE: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
        { id: 'GB', name: 'United Kingdom', flag: FLAGS.GB },
        { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
        { id: 'EUROPE', name: 'Europe', flag: FLAGS.EU },
      ],
      VANILLA: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
      ],
    };
    return brandCountries[normalizedBrand] || [
      { id: 'US', name: 'United States', flag: FLAGS.US },
      { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
      { id: 'GB', name: 'United Kingdom', flag: FLAGS.GB },
      { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
      { id: 'SWITZERLAND', name: 'Switzerland', flag: FLAGS.CH },
      { id: 'EUROPE', name: 'Europe', flag: FLAGS.EU },
    ];
  }, [normalizedBrand]);

  const countries = useMemo((): CountryItem[] => {
    let list: CountryItem[];
    if (!apiCountries || apiCountries.length === 0) {
      list = fallbackCountries;
    } else {
      list = apiCountries.map(country => {
        const flagKey = normalizeCountryCode(country.code);
        const flag = FLAGS[flagKey] || FLAGS[country.code] || FLAGS.US;
        return {
          id: country.code,
          name: country.name,
          flag,
          rate: country.rate,
          rateDisplay: country.rateDisplay,
        };
      });
    }
    if (filterCountryId) {
      const filtered = list.filter(
        c => c.id.toUpperCase() === filterCountryId.toUpperCase()
      );
      return filtered.length > 0 ? filtered : list;
    }
    return list;
  }, [apiCountries, fallbackCountries, filterCountryId]);

  useEffect(() => {
    if (visible && normalizedBrand && !loading && !hasCountries) {
      fetchCountries();
    }
  }, [visible, normalizedBrand, loading, hasCountries, fetchCountries]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#35297F" />
          <Text style={styles.loadingText}>Loading countries...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load countries</Text>
          <Text style={styles.errorSubtext}>{String(error)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchCountries()} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!hasCountries && (!apiCountries || apiCountries.length === 0)) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No countries available for {brand}</Text>
        </View>
      );
    }
    return (
      <ScrollView
        style={{ maxHeight: SHEET_MAX_HEIGHT - 96 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {countries.map((c) => {
          const selected = selectedCountryId === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => onSelect(c)}
              activeOpacity={0.9}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <View style={styles.pillLeft}>
                <Image source={c.flag} style={styles.flagSmall} />
              </View>

              {/* Left: Country name; Right: Rate */}
              <View style={styles.pillContent}>
                <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]} numberOfLines={1}>
                  {c.name}
                </Text>
              </View>

              <View style={styles.pillRight}>
                <Text style={[styles.pillRate, selected && styles.pillRateSelected]}>
                  {c.rateDisplay ?? (typeof c.rate === 'number' ? `${c.rate}/USD` : '—')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Text style={styles.sheetTitle}>Available Countries</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16 }}>{renderContent()}</View>
    </Sheet>
  );
}

/* ========= Legacy fallback ========= */
export function getAvailableCountriesForBrand(brand: string): CountryItem[] {
  return [
    { id: 'US', name: 'United States', flag: FLAGS.US },
    { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
    { id: 'GB', name: 'United Kingdom', flag: FLAGS.GB },
    { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
    { id: 'SWITZERLAND', name: 'Switzerland', flag: FLAGS.CH },
    { id: 'EUROPE', name: 'Europe', flag: FLAGS.EU },
  ];
}

/* ========= Styles ========= */
const makeStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 4 },
  handleBar: { width: 42, height: 3, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  sheetTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    fontFamily: Typography.medium || 'System',
  },
  closeTxt: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  pill: {
    backgroundColor: colors.separator,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSelected: { borderColor: colors.primary, backgroundColor: colors.iconBg },
  pillLeft: { marginRight: 10, justifyContent: 'center', alignItems: 'center', width: 24 },
  pillContent: { flex: 1, paddingRight: 12 },
  pillRight: { minWidth: 80, alignItems: 'flex-end', justifyContent: 'center' },
  flagSmall: { width: 20, height: 20, borderRadius: 10, resizeMode: 'cover' },
  pillLabel: {
    fontSize: 15,
    color: colors.text,
    fontFamily: Typography.regular || 'System',
  },
  pillLabelSelected: { color: colors.iconFg, fontWeight: '700' },
  pillRate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    marginTop: 0,
  },
  pillRateSelected: { color: colors.iconFg, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { color: colors.textSecondary, fontSize: 14, fontFamily: Typography.regular || 'System', marginTop: 12 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  errorText: {
    color: colors.destructive,
    fontSize: 16,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: Typography.regular || 'System',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontFamily: Typography.medium || 'System', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textSecondary, fontSize: 14, fontFamily: Typography.regular || 'System', textAlign: 'center' },
});

export default AvailableCountrySheet;
