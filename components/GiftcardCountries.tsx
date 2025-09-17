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
import { Colors } from '../../constants/Colors';
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
  // alternative keys your backend or fallback might use
  CANADA: flagCA,
  AUSTRALIA: flagAU,
  SWITZERLAND: flagCH,
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
  onSelect,
  onClose,
}: {
  visible: boolean;
  brand: string;
  selectedCountryId?: string;
  onSelect: (country: CountryItem) => void;
  onClose: () => void;
}) {
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
      ],
      STEAM: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
      ],
      APPLE: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
      ],
      VANILLA: [
        { id: 'US', name: 'United States', flag: FLAGS.US },
        { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
      ],
    };
    return brandCountries[normalizedBrand] || [
      { id: 'US', name: 'United States', flag: FLAGS.US },
      { id: 'CANADA', name: 'Canada', flag: FLAGS.CA },
      { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
      { id: 'SWITZERLAND', name: 'Switzerland', flag: FLAGS.CH },
    ];
  }, [normalizedBrand]);

  const countries = useMemo((): CountryItem[] => {
    if (!apiCountries || apiCountries.length === 0) {
      return fallbackCountries;
    }
    return apiCountries.map(country => {
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
  }, [apiCountries, fallbackCountries]);

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
    { id: 'AUSTRALIA', name: 'Australia', flag: FLAGS.AU },
    { id: 'SWITZERLAND', name: 'Switzerland', flag: FLAGS.CH },
  ];
}

/* ========= Styles ========= */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 4 },
  handleBar: { width: 42, height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  sheetTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    fontFamily: Typography.medium || 'System',
  },
  closeTxt: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  pill: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSelected: { borderColor: '#35297F', backgroundColor: '#F6F4FF' },
  pillLeft: { marginRight: 10, justifyContent: 'center', alignItems: 'center', width: 24 },
  pillContent: { flex: 1, paddingRight: 12 }, // takes available space
  pillRight: { minWidth: 80, alignItems: 'flex-end', justifyContent: 'center' }, // right-aligned rate
  flagSmall: { width: 20, height: 20, borderRadius: 10, resizeMode: 'cover' },
  pillLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontFamily: Typography.regular || 'System',
  },
  pillLabelSelected: { color: '#35297F', fontWeight: '700' },
  pillRate: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginTop: 0,
  },
  pillRateSelected: { color: '#35297F', fontWeight: '700' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { color: '#6B7280', fontSize: 14, fontFamily: Typography.regular || 'System', marginTop: 12 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: Typography.regular || 'System',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#35297F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: Typography.medium || 'System', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#6B7280', fontSize: 14, fontFamily: Typography.regular || 'System', textAlign: 'center' },
});

export default AvailableCountrySheet;
