// components/giftcards/GiftCardConfirmationModal.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ImageSourcePropType,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, s } from 'react-native-size-matters';
import { Typography } from '../constants/Typography';
// ✅ Correct path to root hooks folder
import { useGiftcardRate } from '../hooks/useGiftcardRate';

/* ── Brand icons (match GiftCard screen; keep ../components prefix) */
import amexIcon from '../components/icons/amex.png';
import amazonIcon from '../components/icons/azn.png';
import ebayIcon from '../components/icons/ebay.png';
import footlockerIcon from '../components/icons/footlocker.png';
import googlePlayIcon from '../components/icons/google-play.png';
import itunesIcon from '../components/icons/iTunes.png';
import macyIcon from '../components/icons/macy.png';
import nikeIcon from '../components/icons/nike.png';
import nordstromIcon from '../components/icons/nordstrom.png';
import razorGoldIcon from '../components/icons/razor-gold.png';
import sephoraIcon from '../components/icons/sephora.png';
import steamIcon from '../components/icons/steam.png';
import vanillaIcon from '../components/icons/vanilla.png';
import visaIcon from '../components/icons/visa.png';
import xboxIcon from '../components/icons/xbox.png';

/* ── Country flags */
import auFlag from '../components/icons/australia.png';
import caFlag from '../components/icons/canada.png';
import frFlag from '../components/icons/france.png';
import deFlag from '../components/icons/germany.png';
import chFlag from '../components/icons/switzerland.png'; // Switzerland
import trFlag from '../components/icons/turkey.png';
import aeFlag from '../components/icons/united-arab-emirates.png';
import gbFlag from '../components/icons/united-kingdom.png';
import usFlag from '../components/icons/united-states.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = 560;

/* Types (kept inline for clarity) */
interface GiftCardBrand {
  id?: string;
  name?: string;
  iconSrc?: ImageSourcePropType;
  color?: string;
}
interface Country {
  id?: string;
  name?: string;
  flagSrc?: ImageSourcePropType;
  code?: string;
}
interface GiftCardTransactionData {
  brand?: GiftCardBrand | null;
  country?: Country | null;
  amount?: string;                 // USD amount as string
  transactionValue?: string;       // (legacy)
  rate?: string;                   // (legacy)
  timeOfUpload?: string;
  averageConfirmationTime?: string;
  cardType?: string;
  cardFormat?: 'PHYSICAL' | 'E_CODE' | string | null;
}
interface GiftCardConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionData?: GiftCardTransactionData;
  loading?: boolean;
}

/* ── Icons map (keys are lowercased & normalized to allow flexible matching) */
const BRAND_ICON_MAP: Record<string, ImageSourcePropType> = {
  amazon: amazonIcon,
  itunes: itunesIcon,
  steam: steamIcon,
  nordstrom: nordstromIcon,
  macy: macyIcon,
  nike: nikeIcon,
  'google-play': googlePlayIcon,
  visa: visaIcon,
  vanilla: vanillaIcon,
  'razor-gold': razorGoldIcon,
  amex: amexIcon,
  sephora: sephoraIcon,
  footlocker: footlockerIcon,
  xbox: xboxIcon,
  ebay: ebayIcon,
  apple: itunesIcon,
  'google_play': googlePlayIcon,
  'american_express': amexIcon,
};

/* ── Flags (keys lowercased / normalized) */
const FLAG_MAP: Record<string, ImageSourcePropType> = {
  gb: gbFlag, 'united-kingdom': gbFlag, uk: gbFlag,
  us: usFlag, 'united-states': usFlag, usa: usFlag,
  ca: caFlag, canada: caFlag, 'canada': caFlag,
  de: deFlag, germany: deFlag,
  fr: frFlag, france: frFlag,
  au: auFlag, australia: auFlag,
  ae: aeFlag, 'united-arab-emirates': aeFlag, uae: aeFlag,
  tr: trFlag, turkey: trFlag, 'türkiye': trFlag, 'turkiye': trFlag,
  ch: chFlag, switzerland: chFlag,
};

/* Normalize helpers */
const BRAND_SYNONYMS: Record<string, string> = {
  ITUNES: 'APPLE',
  'GOOGLE PLAY': 'GOOGLE_PLAY',
  'GOOGLE-PLAY': 'GOOGLE_PLAY',
  'RAZOR GOLD': 'RAZOR_GOLD',
  'RAZOR-GOLD': 'RAZOR_GOLD',
  AMEX: 'AMERICAN_EXPRESS',
  "MACY'S": 'MACY',
  VANILLA: 'VISA', // treat vanilla as visa family (client can pass format later)
};
function normalizeGiftcardType(input?: string | null) {
  const raw = (input || '').toString().trim();
  if (!raw) return '';
  const up = raw.toUpperCase();
  if (BRAND_SYNONYMS[up]) return BRAND_SYNONYMS[up];
  // replace apostrophes and non-alphanum with underscore
  return up.replace(/['’]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function normalizeCountryToAllowed(input?: string | null) {
  const raw = (input || '').toString().trim();
  if (!raw) return '';
  const up = raw.toUpperCase();
  if (['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(up)) return 'US';
  if (['CANADA', 'CA'].includes(up)) return 'CANADA';
  if (['AUSTRALIA', 'AU'].includes(up)) return 'AUSTRALIA';
  if (['SWITZERLAND', 'CH'].includes(up)) return 'SWITZERLAND';
  return up;
}

/* Utility normalization for icon/flag lookup */
function keyify(s?: string | null) {
  if (!s) return '';
  return s.toString().trim().toLowerCase().replace(/\s+/g, '-');
}

const GiftCardConfirmationModal: React.FC<GiftCardConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  transactionData = {},
  loading = false,
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const {
    brand = null,
    country = null,
    amount = '0',
    transactionValue = '0.00',
    rate: fallbackRate = '—',
    timeOfUpload = '',
    averageConfirmationTime = '10-15mins',
    cardType = '',
    cardFormat = null,
  } = transactionData;

  // Normalize props
  const normalizedGiftcard = useMemo(
    () => normalizeGiftcardType(brand?.id || brand?.name || cardType),
    [brand?.id, brand?.name, cardType]
  );
  const normalizedCountry = useMemo(
    () => normalizeCountryToAllowed(country?.code || country?.id || country?.name),
    [country?.code, country?.id, country?.name]
  );
  const amountNum = useMemo(() => {
    const n = parseFloat(String(amount));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // Hook - default values will be overridden below via sync effect
  const {
    loading: calcLoading,
    error: rateError,
    result,
    exchangeRate,
    exchangeRateDisplay, // "1,480/USD"
    amountToReceive,
    payoutDisplay,       // "₦148,000.00"
    calculate,
    setGiftcard,
    setCountry,
    setInputAmount,
    setCardFormat,
  } = useGiftcardRate({
    defaultGiftcard: normalizedGiftcard || 'AMAZON',
    defaultCountry: normalizedCountry || 'US',
    defaultCardFormat: cardFormat ?? null,
    amount: amountNum,
  });

  // Sync hook state with props whenever they change
  useEffect(() => {
    setGiftcard(normalizedGiftcard || 'AMAZON');
    setCountry(normalizedCountry || 'US');
    setInputAmount(amountNum);
    setCardFormat(cardFormat ?? null);
  }, [normalizedGiftcard, normalizedCountry, amountNum, cardFormat, setGiftcard, setCountry, setInputAmount, setCardFormat]);

  // Trigger calculate when modal opens or inputs change
  useEffect(() => {
    if (!visible) return;
    if (amountNum <= 0) return;

    const gcForCalc = normalizedGiftcard || 'AMAZON';
    const countryForCalc = normalizedCountry || 'US';

    // call calculate; calculate handles errors and sets result
    calculate({
      amount: amountNum,
      giftcard: gcForCalc,
      country: countryForCalc,
      cardFormat: cardFormat ?? undefined,
    }).catch(() => {
      /* errors handled inside calculate */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, normalizedGiftcard, normalizedCountry, amountNum, cardFormat]);

  const getBrandIcon = (brandId?: string, fallbackName?: string): ImageSourcePropType => {
    if (brand?.iconSrc) return brand.iconSrc;
    // prefer brand id or name, fallback to cardType
    const key = keyify(brandId || fallbackName || cardType || normalizedGiftcard);
    // special-case VISA vs VANILLA
    if (key.includes('vanilla')) return vanillaIcon;
    if (key.includes('visa')) return visaIcon;
    return BRAND_ICON_MAP[key] || amazonIcon;
  };
  const getCountryFlag = (countryId?: string, fallbackName?: string): ImageSourcePropType => {
    if (country?.flagSrc) return country.flagSrc;
    const key = keyify(countryId || fallbackName || normalizedCountry);
    return FLAG_MAP[key] || usFlag;
  };

  const formatUSD = (amt: string | number): string => {
    const num = parseFloat(String(amt)) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatTime = (t: string): string => (!t ? '' : t);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: MODAL_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  // Displays
  const rateDisplay = calcLoading
    ? 'Calculating…'
    : (exchangeRate != null && exchangeRateDisplay) ? exchangeRateDisplay : (fallbackRate || '—');

  const receiveDisplay = calcLoading
    ? 'Calculating…'
    : (result?.success && payoutDisplay) ? payoutDisplay : '—';

  // disable pay button if backend not ready or calc error
  const disablePayButton = loading || calcLoading || !!rateError || !result?.success;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleBar} />

                {/* Amount (USD input) */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>{formatUSD(amountNum)}</Text>
                </View>

                {/* Details */}
                <View style={styles.detailsSection}>
                  {/* Card Type / Brand */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Card type</Text>
                    <View style={styles.valueContainer}>
                      <Image
                        source={getBrandIcon(brand?.id, brand?.name || cardType)}
                        style={styles.brandIcon}
                      />
                      <Text style={styles.detailValue}>{brand?.name || cardType || normalizedGiftcard || 'Amazon'}</Text>
                    </View>
                  </View>

                  {/* Card Country (country left, rate right) */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Card country</Text>
                    <View style={styles.valueContainer}>
                      <Image
                        source={getCountryFlag(country?.id, country?.name)}
                        style={styles.countryFlag}
                      />
                      <Text style={styles.detailValue}>{country?.name || normalizedCountry || 'United States'}</Text>
                    </View>
                  </View>

                  {/* Rate shown on its own right-hand row */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>{rateDisplay}</Text>
                  </View>

                  {/* You Receive (right) */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>You receive</Text>
                    <Text style={styles.detailValue}>{receiveDisplay}</Text>
                  </View>

                  {/* Any rate error from validation/API */}
                  {!!rateError && (
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 8 }]}>
                      <Text style={[styles.detailLabel, { color: '#DC2626' }]}>Note</Text>
                      <Text style={[styles.detailValue, { color: '#DC2626', textAlign: 'right' }]}>
                        {rateError}
                      </Text>
                    </View>
                  )}

                  {/* Time of Upload */}
                  {!!timeOfUpload && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time of upload</Text>
                      <Text style={styles.detailValue}>{formatTime(timeOfUpload)}</Text>
                    </View>
                  )}
                </View>

                {/* Average Confirmation Time */}
                <View style={styles.confirmationTimeSection}>
                  <Text style={styles.confirmationTimeText}>
                    Average Confirmation Time: {averageConfirmationTime}
                  </Text>
                </View>

                {/* Pay / Confirm */}
                <View style={styles.buttonSection}>
                  <TouchableOpacity
                    style={[styles.payButton, disablePayButton && styles.payButtonDisabled]}
                    onPress={onConfirm}
                    disabled={disablePayButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payButtonText}>
                      {loading ? 'Processing...' : calcLoading ? 'Calculating…' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Bottom safe area */}
              <View
                style={[
                  styles.safeAreaExtension,
                  { height: insets.bottom },
                ]}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrapper: { alignSelf: 'center', width: '100%' },
  modalContainer: {
    width: '100%',
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: ms(24),
    paddingTop: 12,
  },
  safeAreaExtension: { backgroundColor: '#FFFFFF', alignSelf: 'center', width: '100%' },
  handleBar: {
    width: s(40),
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  amountSection: { alignItems: 'center', marginBottom: 24 },
  amountTitle: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsSection: { marginBottom: 24 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    textTransform: 'capitalize',
  },
  detailValue: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: ms(8), flex: 1, justifyContent: 'flex-end' },
  brandIcon: { width: s(20), height: 20, resizeMode: 'contain', borderRadius: s(4) },
  countryFlag: { width: s(24), height: 16, resizeMode: 'cover', borderRadius: s(2), marginRight: ms(8) },
  confirmationTimeSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: s(8),
    paddingVertical: 12,
    paddingHorizontal: ms(16),
    marginBottom: 24,
    alignItems: 'center',
  },
  confirmationTimeText: {
    color: '#6B7280',
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSection: { marginTop: 'auto', paddingBottom: 24 },
  payButton: {
    backgroundColor: '#35297F',
    borderRadius: s(12),
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonDisabled: { backgroundColor: '#9CA3AF' },
  payButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
});

export default GiftCardConfirmationModal;
