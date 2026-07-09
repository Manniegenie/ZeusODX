// app/giftcards/giftcard-trade.tsx
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import Loading from '../../components/Loading';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Typography } from '../../constants/Typography';
import { useGiftCard } from '../../hooks/usegiftcard';
import { useGiftcardCountries } from '../../hooks/usegiftcardCountry';
import { giftcardCountriesService } from '../../services/giftcardcountryService';
import { giftcardRateService } from '../../services/giftcardRateService';

// Icons - Updated to match main screen
import chevronRightIcon from '../../components/icons/arrow.png';
import backIcon from '../../components/icons/backy.png';
import cloudUploadIcon from '../../components/icons/cloud-upload.png';

// Country bottom sheet
import { AvailableCountrySheet } from '../../components/GiftcardCountries';

// Confirmation modal
import GiftCardConfirmationModal from '../../components/GiftcardConfirm';

const { width: screenWidth } = Dimensions.get('window');

/* ---------------- Types ---------------- */
type ErrorDisplayData = {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
};
type FileInfo = { name: string; size: number; mimeType: string; uri: string };
type ChoiceItem = { id: string; label: string; left?: React.ReactNode };

// Authoritative rate quote — the trade screen is the single source of truth.
// The confirmation modal receives this object and must not recalculate.
type RateQuote = {
  loading: boolean;
  success: boolean;
  rateDisplay: string;      // e.g. "1,430/USD"
  payoutDisplay: string;    // e.g. "₦143,000"
  amountToReceive: number;
  rawResponse: any;
  errorMessage: string;
};
const EMPTY_QUOTE: RateQuote = {
  loading: false,
  success: false,
  rateDisplay: '',
  payoutDisplay: '',
  amountToReceive: 0,
  rawResponse: null,
  errorMessage: '',
};

/* --------------- Consts --------------- */
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif'];

const RECEIPT = [
  { id: 'PHYSICAL', label: 'Physical Card', emoji: '💳' },
  { id: 'ECODE', label: 'E-code', emoji: '🏷️' }, // UI id stays "ECODE"
];

const CATEGORIES = [
  { id: 'VERTICAL', label: 'Vertical' },
  { id: 'HORIZONTAL', label: 'Horizontal' },
  { id: 'ODD', label: 'Odd numbers' },
];

// Category ids (VERTICAL/HORIZONTAL/ODD) are the backend contract and never change.
// Only the user-facing wording differs for Apple vs non-Apple cards.
// "Odd Number / Custom Amount" is a market term — it does NOT mean mathematically odd.
const CATEGORY_LABELS: Record<string, { apple: string; generic: string }> = {
  VERTICAL:   { apple: 'Vertical Card',   generic: 'Vertical' },
  HORIZONTAL: { apple: 'Horizontal Card', generic: 'Horizontal' },
  ODD:        { apple: 'Odd Number / Custom Amount', generic: 'Odd numbers' },
};

// Apple "common/normal" denominations are clean increments of 50 starting at 50
// (50, 100, 150, …). Anything else (51, 72, 97, 102, 152, 170, 199, 251, …) is an
// Odd Number / Custom Amount. Phase 1: frontend guidance only — do not auto-classify.
const isAppleCommonAmount = (amount: number): boolean =>
  Number.isFinite(amount) && amount >= 50 && amount % 50 === 0;

// Card range is auto-derived from the entered card value (Phase 2) — no manual picker.
// `submit` keeps the legacy "min-max" strings the backend already accepts
// (25-100 / 100-200 / 200-500 / 500-1000); `label` shows a clearer NON-overlapping
// bucket to the user (backend treats upper bounds as exclusive except the last).
type DerivedRange = { submit: string; label: string; min: number; max: number };

const deriveCardRange = (amount: number): DerivedRange | null => {
  if (!Number.isFinite(amount)) return null;
  if (amount >= 25 && amount < 100)    return { submit: '25-100',   label: '$25–$99',     min: 25,  max: 99 };
  if (amount >= 100 && amount < 200)   return { submit: '100-200',  label: '$100–$199',   min: 100, max: 199 };
  if (amount >= 200 && amount < 500)   return { submit: '200-500',  label: '$200–$499',   min: 200, max: 499 };
  if (amount >= 500 && amount <= 1000) return { submit: '500-1000', label: '$500–$1,000', min: 500, max: 1000 };
  return null;
};

// VANILLA variants
const VANILLA_VARIANTS = [
  { id: '4097', label: 'VANILLA 4097', description: 'BIN: 4097' },
  { id: '4118', label: 'VANILLA 4118', description: 'BIN: 4118' },
];

/* ---------------- Success Modal ---------------- */
interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'Done'
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const successStyles = useMemo(() => makeSuccessModalStyles(colors), [colors]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={successStyles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                successStyles.modalContainer,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={successStyles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={successStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={successStyles.titleSection}>
                <Text style={successStyles.title}>{title}</Text>
                <Text style={successStyles.message}>{message}</Text>
              </View>

              <TouchableOpacity
                style={successStyles.submitButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={successStyles.submitButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/* ---------------- Base Bottom Sheet ---------------- */
const SHEET_MAX_HEIGHT = 520;

const BottomSheet = ({
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
                  paddingBottom: Math.max(10, insets.bottom + 10),
                },
              ]}
            >
              <View style={styles.handleBar} />
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/* -------------- Choice Sheet -------------- */
const ChoiceSheet = ({
  visible,
  title,
  choices,
  selectedId,
  onSelect,
  onClose,
  centerAlign = false,
  showDescription = false,
}: {
  visible: boolean;
  title: string;
  choices: ChoiceItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  centerAlign?: boolean;
  showDescription?: boolean;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isScrollable = choices.length > 6;

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={SHEET_MAX_HEIGHT}>
      <View style={styles.titleRow}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {isScrollable ? (
          <ScrollView style={{ maxHeight: SHEET_MAX_HEIGHT - 120 }} showsVerticalScrollIndicator={false}>
            {choices.map(ch => (
              <ChoicePill
                key={ch.id}
                label={ch.label}
                description={(ch as any).description}
                selected={selectedId === ch.id}
                left={centerAlign ? undefined : ch.left}
                onPress={() => onSelect(ch.id)}
                centerAlign={centerAlign}
                showDescription={showDescription}
              />
            ))}
          </ScrollView>
        ) : (
          <View>
            {choices.map(ch => (
              <ChoicePill
                key={ch.id}
                label={ch.label}
                description={(ch as any).description}
                selected={selectedId === ch.id}
                left={centerAlign ? undefined : ch.left}
                onPress={() => onSelect(ch.id)}
                centerAlign={centerAlign}
                showDescription={showDescription}
              />
            ))}
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const ChoicePill = ({
  label,
  description,
  selected,
  onPress,
  left,
  centerAlign = false,
  showDescription = false,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  left?: React.ReactNode;
  centerAlign?: boolean;
  showDescription?: boolean;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.pill,
        selected && styles.pillSelected,
        centerAlign && { justifyContent: 'center' },
      ]}
    >
      {!centerAlign && left ? <View style={styles.pillLeft}>{left}</View> : null}
      <View style={[{ flex: 1 }, centerAlign && { alignItems: 'center' }]}>
        <Text
          style={[
            styles.pillLabel,
            selected && styles.pillLabelSelected,
            centerAlign && { textAlign: 'center' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {showDescription && description && (
          <Text style={[
            styles.pillDescription,
            selected && styles.pillDescriptionSelected,
            centerAlign && { textAlign: 'center' },
          ]}>
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* ===================== Screen ===================== */
const GiftcardTradeScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ brand?: string; id?: string; countryCode?: string; countryName?: string }>();
  const brand = (params.brand as string) || 'Amazon';
  const preselectedCountryCode = (params.countryCode as string) || '';
  const preselectedCountryName = (params.countryName as string) || '';

  // Check if this is a VANILLA card
  const isVanillaCard = brand.toLowerCase().includes('vanilla');

  // Map brand to backend card type (needed by rate hook)
  const CARD_TYPE_MAP: Record<string, string> = {
    'Amazon': 'AMAZON', 'Apple/iTunes': 'APPLE', 'Steam Card': 'STEAM',
    'Nordstrom': 'NORDSTROM', 'Macy': 'MACY', 'Nike Gift Card': 'NIKE',
    'Google Play': 'GOOGLE_PLAY', 'Visa': 'VISA',
    'Razor Gold Gift Card': 'RAZOR_GOLD', 'American Express': 'AMERICAN_EXPRESS',
    'Sephora': 'SEPHORA', 'Footlocker': 'FOOTLOCKER', 'Xbox Card': 'XBOX',
    'eBay': 'EBAY',
  };
  const mappedCardType = CARD_TYPE_MAP[brand] || brand.toUpperCase().replace(/\s+/g, '_');

  // Reliable Apple detection used to drive Apple-only category wording/guidance.
  const isAppleCard = mappedCardType === 'APPLE';

  // User-facing label for a category id — Apple wording vs generic wording.
  const categoryLabelFor = (id: string): string =>
    CATEGORY_LABELS[id] ? (isAppleCard ? CATEGORY_LABELS[id].apple : CATEGORY_LABELS[id].generic) : id;

  // Gift card hook
  const { loading: submitLoading, error: submitError, submitGiftCard, clearError } = useGiftCard();

  // Countries hook — used to auto-fetch the rate when country is pre-selected from params
  const { countries: brandCountries, loading: rateLoading, fetchCountries: fetchBrandCountries } = useGiftcardCountries({
    cardType: mappedCardType,
    autoFetch: false,
  });

  // form state
  const [country, setCountry] = useState(preselectedCountryName);
  const [countryId, setCountryId] = useState<string | null>(preselectedCountryCode || null);
  const [countryRate, setCountryRate] = useState<number | null>(null);
  const [countryRateDisplay, setCountryRateDisplay] = useState<string>('');
  const [receipt, setReceipt] = useState('');          // 'PHYSICAL' | 'ECODE'
  const [ecode, setEcode] = useState('');
  const [vanillaVariant, setVanillaVariant] = useState(''); // '4097' | '4118' for VANILLA cards
  const [category, setCategory] = useState('');        // 'VERTICAL' | 'HORIZONTAL' | 'ODD'
  const [valueUSD, setValueUSD] = useState('');
  const [uploads, setUploads] = useState<FileInfo[]>([]);
  const [comments, setComments] = useState('');

  const [availableCategories, setAvailableCategories] = useState<string[] | null>(null);

  const [openPicker, setOpenPicker] = useState<null | 'receipt' | 'vanilla' | 'category'>(null);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  const selectedVanillaVariant = useMemo(() => VANILLA_VARIANTS.find(v => v.id === vanillaVariant) || null, [vanillaVariant]);

  // Card range is auto-derived from the entered value (Phase 2). It satisfies
  // submitGiftCard's required `cardRange` without a manual picker. null => amount is
  // outside the supported $25–$1000 window (Confirm stays disabled).
  const derivedRange = useMemo(() => deriveCardRange(Number(valueUSD)), [valueUSD]);

  // Category is Apple's layout signal and now affects the rate quote, so it is required
  // for Apple only. Non-Apple cards don't use category (submit accepts it as optional).
  const categoryRequired = isAppleCard;

  // Single authoritative rate quote (see RateQuote type).
  const [rateQuote, setRateQuote] = useState<RateQuote>(EMPTY_QUOTE);

  // Auto-fetch countries to get rate when country is pre-selected from params
  useEffect(() => {
    if (preselectedCountryCode && mappedCardType) {
      fetchBrandCountries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once countries load, extract rate for the pre-selected country
  useEffect(() => {
    if (!preselectedCountryCode || !brandCountries.length) return;
    const match = brandCountries.find(
      c => String(c.code).toUpperCase() === preselectedCountryCode.toUpperCase()
    );
    if (match) {
      setCountryRate(match.rate ?? null);
      setCountryRateDisplay(match.rateDisplay ?? (match.rate != null ? `${match.rate}/USD` : ''));
    }
  }, [brandCountries, preselectedCountryCode]);

  // Clear e-code when leaving ECODE
  useEffect(() => {
    if (receipt !== 'ECODE') setEcode('');
  }, [receipt]);

  // Clear vanilla variant when not VANILLA card
  useEffect(() => {
    if (!isVanillaCard) setVanillaVariant('');
  }, [isVanillaCard]);

  // Fetch available categories when country + cardType are known
  useEffect(() => {
    if (!countryId || !mappedCardType) return;
    let cancelled = false;
    setAvailableCategories(null); // reset while loading
    setCategory('');              // clear stale category selection
    giftcardCountriesService.getAvailableCategories(mappedCardType, countryId).then(res => {
      if (cancelled) return;
      if (res.success && res.data?.availableCategories?.length) {
        setAvailableCategories(res.data.availableCategories);
      } else {
        // Fallback when the categories endpoint fails/returns nothing. We MUST still
        // offer categories so the user can pick a range — submitGiftCard requires
        // cardRange (derived from category → range) for ALL cards. Non-Apple cards get
        // neutral, non-Apple wording via categoryLabelFor(), so no Apple-specific
        // labels/helper text leak onto them even though the same category ids are used.
        setAvailableCategories(['VERTICAL', 'HORIZONTAL', 'ODD']);
      }
    }).catch(() => {
      if (!cancelled) setAvailableCategories(['VERTICAL', 'HORIZONTAL', 'ODD']);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId]);

  // Single source of truth for the displayed rate. Fetches from the backend quote API
  // (giftcardRateService.calculateRate) — no local rate math. Debounced 500ms.
  // Any change to amount / country / receipt / category invalidates the previous
  // quote immediately, so a stale rate can never linger while a new one is fetched.
  // cardFormat must be included — the API returns a different (higher) base rate without it,
  // which previously caused the trade screen and confirmation modal to disagree.
  useEffect(() => {
    const amount = Number(valueUSD);
    const fmt = receipt === 'ECODE' ? 'E_CODE' : receipt === 'PHYSICAL' ? 'PHYSICAL' : undefined;
    const dr = deriveCardRange(amount); // null when outside $25–$1000

    // Clear any prior quote up front — inputs changed / amount out of range.
    if (!countryId || !fmt || !dr) {
      setRateQuote(EMPTY_QUOTE);
      return;
    }

    let cancelled = false;
    setRateQuote({ ...EMPTY_QUOTE, loading: true });
    const timer = setTimeout(() => {
      giftcardRateService.calculateRate({
        amount,
        giftcard: mappedCardType,
        country: countryId,
        cardFormat: fmt,
        // Forward the selected Apple layout/category so the backend can price it.
        // Empty for non-Apple / not-yet-selected → omitted from the payload.
        category: category || undefined,
      }).then(resp => {
        if (cancelled) return;
        if (resp?.success && resp.data) {
          setRateQuote({
            loading: false,
            success: true,
            rateDisplay: resp.data.rate || '',
            payoutDisplay: resp.data.amountToReceive
              ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(resp.data.amountToReceive)
              : '',
            amountToReceive: resp.data.amountToReceive || 0,
            rawResponse: resp.data,
            errorMessage: '',
          });
        } else {
          setRateQuote({
            ...EMPTY_QUOTE,
            success: false,
            errorMessage: resp?.message || 'No rate is currently available for this amount.',
          });
        }
      }).catch(() => {
        if (!cancelled) {
          setRateQuote({
            ...EMPTY_QUOTE,
            success: false,
            errorMessage: 'No rate is currently available for this amount.',
          });
        }
      });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueUSD, countryId, receipt, category]);

  // Clear hook error when it changes
  useEffect(() => {
    if (submitError) {
      showError({
        type: 'network',
        title: 'Submission Failed',
        message: submitError,
        autoHide: true,
        duration: 4000,
      });
      clearError();
    }
  }, [submitError, clearError]);

  const handleGoBack = () => router.back();

  const showError = (data: ErrorDisplayData) => {
    setErrorDisplayData(data);
    setShowErrorDisplay(true);
  };
  const hideError = () => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  /** Open phone gallery */
  const onPickFile = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return showError({
          type: 'validation',
          title: 'Permission Needed',
          message: 'Please allow gallery access to upload your card image.',
          autoHide: true,
          duration: 3500,
        });
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1, // Get full quality first, we'll compress it
        selectionLimit: 1,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const mimeType = asset.mimeType || 'image/jpeg';

      if (!(ACCEPTED_MIME.includes(mimeType) || mimeType.startsWith('image/'))) {
        return showError({
          type: 'validation',
          title: 'Unsupported Image',
          message: 'Please select a JPEG or PNG image.',
          autoHide: true,
          duration: 3500,
        });
      }

      // Compress and resize image to prevent memory issues
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          { resize: { width: 1200 } }, // Resize to max 1200px width (maintains aspect ratio)
        ],
        {
          compress: 0.8, // 80% quality - good balance between size and quality
          format: ImageManipulator.SaveFormat.JPEG, // Always use JPEG for smaller file size
        }
      );

      // Get file size of compressed image
      let size = 0;
      try {
        const stat = await FileSystem.getInfoAsync(manipulatedImage.uri);
        if (stat.exists && typeof stat.size === 'number') {
          size = stat.size;
        }
      } catch {}

      const newUpload: FileInfo = {
        name: asset.fileName || `card_${Date.now()}.jpg`,
        size,
        mimeType: 'image/jpeg', // Always JPEG after compression
        uri: manipulatedImage.uri,
      };

      setUploads(prev => [...prev, newUpload]);
    } catch (e: any) {
      console.error('Image picker error:', e);
      showError({
        type: 'general',
        title: 'Upload Failed',
        message: e?.message || 'Unable to process image. Please try again.',
        autoHide: true,
        duration: 3000,
      });
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    if (!country) {
      showError({ type: 'validation', title: 'Country Required', message: 'Select the card issuing country.', autoHide: true, duration: 3000 });
      return false;
    }
    if (!receipt) {
      showError({ type: 'validation', title: 'Receipt Required', message: 'Choose "Physical Card" or "E-code".', autoHide: true, duration: 3000 });
      return false;
    }
    if (receipt === 'ECODE' && !ecode.trim()) {
      showError({ type: 'validation', title: 'E-code Required', message: 'Please enter the e-code value.', autoHide: true, duration: 3000 });
      return false;
    }
    if (isVanillaCard && !vanillaVariant) {
      showError({ type: 'validation', title: 'Variant Required', message: 'Please select the variant (4097 or 4118).', autoHide: true, duration: 3000 });
      return false;
    }
    // Category is required for Apple only (it drives the Apple rate). Non-Apple cards
    // don't use category. Card range is auto-derived — never manually selected.
    if (categoryRequired && !category) {
      showError({ type: 'validation', title: 'Category Required', message: 'Select the Apple card type.', autoHide: true, duration: 3000 });
      return false;
    }
    const amount = Number(valueUSD);
    if (!valueUSD || isNaN(amount) || amount <= 0) {
      showError({ type: 'validation', title: 'Card Value Required', message: 'Enter a valid USD amount.', autoHide: true, duration: 3000 });
      return false;
    }
    if (!deriveCardRange(amount)) {
      showError({
        type: 'validation',
        title: 'Value Out of Range',
        message: 'Enter a value between $25 and $1000.',
        autoHide: true,
        duration: 3500,
      });
      return false;
    }
    if (uploads.length === 0) {
      showError({
        type: 'validation',
        title: 'Upload Required',
        message: 'Please upload at least one card image.',
        autoHide: true,
        duration: 3500,
      });
      return false;
    }
    // A valid, finished rate quote must exist before we allow submission.
    if (!rateQuote.success || rateQuote.loading) {
      showError({
        type: 'validation',
        title: 'Rate Unavailable',
        message: rateQuote.loading
          ? 'Please wait for the rate to finish calculating.'
          : 'No rate is currently available for this amount.',
        autoHide: true,
        duration: 3500,
      });
      return false;
    }
    return true;
  };

  const handleConfirmPress = () => {
    if (validate()) setShowConfirmationModal(true);
  };

  const handleConfirmContinue = async () => {
    setShowConfirmationModal(false);

    // Normalize UI receipt -> API format
    const normalizedCardFormat = receipt === 'ECODE' ? 'E_CODE' : receipt === 'PHYSICAL' ? 'PHYSICAL' : null;

    if (!normalizedCardFormat || !countryId || !derivedRange) {
      showError({
        type: 'validation',
        title: 'Invalid Data',
        message: 'Please check your selections and try again.',
        autoHide: true,
        duration: 3000,
      });
      return;
    }

    // Use the SAME canonical card type as the rate flow (top-level mappedCardType).
    // This fixes Apple/iTunes previously submitting as "APPLE/ITUNES" instead of "APPLE".

    // Prepare gift card data matching backend validation
    const giftCardData: any = {
      cardType: mappedCardType,
      cardFormat: normalizedCardFormat,
      // Auto-derived range string (backend-compatible "min-max"), never manually chosen.
      cardRange: derivedRange.submit,
      cardValue: valueUSD,
      currency: 'USD',
      country: countryId,
      category: category || undefined,
      description: comments.trim() || undefined,
      eCode: receipt === 'ECODE' ? ecode : undefined,
      images: uploads.map(upload => ({
        uri: upload.uri,
        type: upload.mimeType,
        name: upload.name,
      })),
    };

    // Add vanilla variant for VANILLA cards
    if (isVanillaCard && vanillaVariant) {
      giftCardData.vanillaType = vanillaVariant;
    }

    // Submit gift card
    const result = await submitGiftCard(giftCardData);
    
    if (result.success) {
      setShowSuccess(true);
      // Reset form
      setCountry('');
      setCountryId(null);
      setCountryRate(null);
      setCountryRateDisplay('');
      setReceipt('');
      setEcode('');
      setVanillaVariant('');
      setValueUSD('');
      setUploads([]);
      setComments('');
    }
  };

  const isValid = Boolean(
    country &&
      receipt &&
      (receipt !== 'ECODE' || ecode.trim()) &&
      (!isVanillaCard || vanillaVariant) &&
      // Category required for Apple only; card range must be auto-derivable (25–1000).
      (!categoryRequired || category) &&
      valueUSD &&
      Number(valueUSD) > 0 &&
      derivedRange &&
      uploads.length > 0 &&
      // Confirm Trade stays disabled until a successful rate quote exists.
      rateQuote.success &&
      !rateQuote.loading
  );

  const receiptChoices: ChoiceItem[] = RECEIPT.map(r => ({ id: r.id, label: r.label }));
  const vanillaChoices: ChoiceItem[] = VANILLA_VARIANTS.map(v => ({ id: v.id, label: v.label, description: v.description } as ChoiceItem));
  const categoryChoices: ChoiceItem[] = CATEGORIES
    .filter(c => !availableCategories || availableCategories.includes(c.id))
    .map(c => ({ id: c.id, label: categoryLabelFor(c.id) }));

  const activeTitle =
    openPicker === 'receipt' ? 'Receipt Availability' :
    openPicker === 'vanilla' ? 'Select Variant' :
    openPicker === 'category' ? (isAppleCard ? 'Apple Card Type' : 'Category') :
    '';

  const activeChoices =
    openPicker === 'receipt' ? receiptChoices :
    openPicker === 'vanilla' ? vanillaChoices :
    openPicker === 'category' ? categoryChoices :
    [];

  const activeSelectedId =
    openPicker === 'receipt' ? receipt :
    openPicker === 'vanilla' ? vanillaVariant :
    openPicker === 'category' ? category :
    undefined;

  // Normalize UI receipt -> API format
  const normalizedCardFormat =
    receipt === 'ECODE' ? 'E_CODE' :
    receipt === 'PHYSICAL' ? 'PHYSICAL' :
    null;

  // Build data for confirmation modal
  const giftcardTransactionData = {
    brand: { id: brand.toLowerCase().replace(/\s+/g, '-'), name: brand },
    country: country && countryId ? { id: countryId, name: country, code: countryId } : null,
    amount: valueUSD || '0',
    transactionValue: valueUSD || '0',
    rate: rateQuote.rateDisplay || '—',
    timeOfUpload: '',
    averageConfirmationTime: '10-15mins',
    cardType: isVanillaCard && selectedVanillaVariant ? selectedVanillaVariant.label : '',
    cardFormat: normalizedCardFormat,
  };

  // Apple-only amount/category guidance (Phase 1 — guidance, not enforcement).
  const amountForGuidance = Number(valueUSD);
  const hasAmountForGuidance = !!valueUSD && Number.isFinite(amountForGuidance) && amountForGuidance > 0;
  // Amount looks custom but user hasn't picked Odd Number / Custom Amount.
  const showSelectOddNote =
    isAppleCard && hasAmountForGuidance && !isAppleCommonAmount(amountForGuidance) && category !== 'ODD';
  // User picked Odd Number / Custom Amount but the amount is a clean increment of 50.
  const showConfirmCommonNote =
    isAppleCard && category === 'ODD' && hasAmountForGuidance && isAppleCommonAmount(amountForGuidance);

  // Category selector is an Apple-only concept (layout/odd). Non-Apple cards no longer
  // show it — card range is auto-derived, so category isn't needed to submit.
  const showCategorySelector = isAppleCard && (availableCategories === null || availableCategories.length > 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor={colors.background} barStyle={colors.statusBar} />

        {/* Error banner */}
        {showErrorDisplay && errorDisplayData && (
          <ErrorDisplay
            type={errorDisplayData.type}
            title={errorDisplayData.title}
            message={errorDisplayData.message}
            autoHide={errorDisplayData.autoHide !== false}
            duration={errorDisplayData.duration || 4000}
            dismissible={errorDisplayData.dismissible !== false}
            onDismiss={hideError}
          />
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Updated to match main gift card screen */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 8 }}>
                <Text style={styles.headerTitle}>{brand}</Text>
                {preselectedCountryName ? (
                  <Text style={styles.headerSubtitle}>{preselectedCountryName}</Text>
                ) : null}
              </View>
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Country */}
          <SelectField
            label="Select available country"
            value={country}
            placeholder="Select country"
            onPress={() => setShowCountrySheet(true)}
          />

          {/* Receipt */}
          <SelectField
            label="Receipt Availability"
            value={receipt ? RECEIPT.find(r => r.id === receipt)?.label : ''}
            placeholder="Select option"
            onPress={() => setOpenPicker('receipt')}
          />

          {/* E-code Entry */}
          {receipt === 'ECODE' && (
            <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
              <Text style={styles.label}>E-code</Text>
              <TextInput
                style={styles.input}
                value={ecode}
                onChangeText={setEcode}
                placeholder="Enter e-code (e.g., XXXX-XXXX-XXXX-XXXX)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          )}

          {/* VANILLA Variant Selection */}
          {isVanillaCard && (
            <SelectField
              label="Variant"
              value={selectedVanillaVariant?.label || ''}
              placeholder="Select variant"
              onPress={() => setOpenPicker('vanilla')}
            />
          )}

          {/* Category — "Apple Card Type" for Apple, "Category" otherwise.
              Hidden for non-Apple cards when the backend offers no categories. */}
          {showCategorySelector && (
            <View>
              <SelectField
                label={isAppleCard ? 'Apple Card Type' : 'Category'}
                value={category ? categoryLabelFor(category) : ''}
                placeholder={availableCategories === null && countryId ? 'Loading categories…' : 'Select category'}
                onPress={() => {
                  if (availableCategories !== null && availableCategories.length > 0) setOpenPicker('category');
                }}
              />
              {isAppleCard && (
                <View style={{ marginTop: -8, marginBottom: 18, marginHorizontal: 16 }}>
                  <Text style={styles.helperText}>
                    Choose Horizontal or Vertical based on the card layout. Use Odd Number / Custom Amount for values that are not standard increments of 50.
                  </Text>
                  {category === 'ODD' ? (
                    <Text style={styles.helperText}>Examples: $72, $97, $102, $152, $170.</Text>
                  ) : (category === 'VERTICAL' || category === 'HORIZONTAL') ? (
                    <Text style={styles.helperText}>
                      Common values are usually $50, $100, $150, $200, $250, $300, and other increments of 50.
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* Amount */}
          <LabeledInput
            label="Card Value ($)"
            value={valueUSD}
            onChangeText={setValueUSD}
            placeholder="Enter value in USD"
            keyboardType="numeric"
          />

          {/* Auto-derived card range (read-only) — replaces the manual Card Range picker */}
          {valueUSD ? (
            <View style={{ marginTop: -8, marginBottom: 14, marginHorizontal: 16 }}>
              {derivedRange ? (
                <Text style={styles.helperText}>Detected range: {derivedRange.label}</Text>
              ) : (
                <Text style={styles.noteText}>Enter a value between $25 and $1000.</Text>
              )}
            </View>
          ) : null}

          {/* Apple amount/category guidance (guidance only — never auto-changes selection) */}
          {showSelectOddNote && (
            <View style={{ marginTop: -8, marginBottom: 14, marginHorizontal: 16 }}>
              <Text style={styles.noteText}>
                This looks like an Odd Number / Custom Amount. Please select Odd Number / Custom Amount so the correct rate can apply.
              </Text>
            </View>
          )}
          {showConfirmCommonNote && (
            <View style={{ marginTop: -8, marginBottom: 14, marginHorizontal: 16 }}>
              <Text style={styles.noteText}>
                This looks like a common Apple amount. Please confirm this should be submitted as Odd Number / Custom Amount.
              </Text>
            </View>
          )}

          {/* Rate Display */}
          <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
            <Text style={styles.label}>Rate</Text>
            <View style={styles.select}>
              <Text style={{ color: colors.primary, fontFamily: Typography.medium || 'System', fontWeight: '700', fontSize: 15, marginRight: 6 }}>₦</Text>
              {rateQuote.loading ? (
                <Text style={[styles.selectText, { color: colors.textSecondary }]}>Calculating rate…</Text>
              ) : rateQuote.success && rateQuote.rateDisplay ? (
                <Text style={styles.selectText}>{rateQuote.rateDisplay}</Text>
              ) : (
                <Text style={[styles.selectText, { color: colors.textSecondary }]}>
                  {!countryId
                    ? 'Select country to see rate'
                    : !receipt
                    ? 'Select receipt type to see rate'
                    : !valueUSD || Number(valueUSD) < 25
                    ? 'Enter a valid amount to see your rate.'
                    : rateQuote.errorMessage || 'No rate is currently available for this amount.'}
                </Text>
              )}
              {!rateQuote.loading && rateQuote.success && rateQuote.payoutDisplay ? (
                <Text style={{ color: colors.primary, fontFamily: Typography.medium || 'System', fontWeight: '600', fontSize: 13 }}>
                  {rateQuote.payoutDisplay}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Upload Section */}
          <View style={{ marginBottom: 10, marginHorizontal: 16 }}>
            <Text style={styles.label}>Upload card</Text>
          </View>
          
          {uploads.length === 0 ? (
            <View style={[styles.uploadBox, { marginHorizontal: 16 }]}>
              <TouchableOpacity style={styles.uploadTap} activeOpacity={0.85} onPress={onPickFile}>
                <Text style={styles.uploadTapTitle}>Upload your card</Text>
                <Text style={styles.uploadTapHint}>Opens your photo gallery • JPEG/PNG</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.uploadContainer}
                contentContainerStyle={styles.uploadContent}
              >
                {uploads.map((upload, index) => (
                  <View key={index} style={styles.uploadedImageContainer}>
                    <Image source={{ uri: upload.uri }} style={styles.uploadedImage} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeUpload(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Add More Button */}
                <TouchableOpacity 
                  style={styles.addMoreButton} 
                  onPress={onPickFile}
                  activeOpacity={0.7}
                >
                  <Image source={cloudUploadIcon} style={styles.cloudIcon} />
                </TouchableOpacity>
              </ScrollView>
              
              <Text style={styles.uploadHint}>
                {`${uploads.length} image${uploads.length > 1 ? 's' : ''} uploaded • Tap + to add more`}
              </Text>
            </View>
          )}

          {/* Comments */}
          <View style={{ marginBottom: 8, marginHorizontal: 16 }}>
            <Text style={styles.label}>Comments (Optional)</Text>
          </View>
          <TextInput
            style={[styles.textArea, { marginHorizontal: 16 }]}
            multiline
            placeholder="Add any details for reviewers..."
            placeholderTextColor={colors.textSecondary}
            value={comments}
            onChangeText={setComments}
          />

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Confirm button */}
        <View style={[styles.footer, { paddingHorizontal: 16 }]}>
          <TouchableOpacity
            style={[styles.cta, (!isValid || submitLoading) && styles.ctaDisabled]}
            disabled={!isValid || submitLoading}
            onPress={handleConfirmPress}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>{submitLoading ? 'Processing...' : 'Confirm Trade'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomTabNavigator activeTab="giftcards" />

      {/* Bottom sheet pickers */}
      <ChoiceSheet
        visible={!!openPicker}
        title={activeTitle}
        choices={activeChoices}
        selectedId={activeSelectedId}
        onClose={() => setOpenPicker(null)}
        onSelect={(id) => {
          if (openPicker === 'receipt') setReceipt(id);
          if (openPicker === 'vanilla') setVanillaVariant(id);
          if (openPicker === 'category') setCategory(id);
          setOpenPicker(null);
        }}
        centerAlign={openPicker === 'receipt' || openPicker === 'category'}
        showDescription={openPicker === 'vanilla'}
      />

      {/* Country sheet */}
      <AvailableCountrySheet
        visible={showCountrySheet}
        brand={brand}
        selectedCountryId={countryId ?? undefined}
        filterCountryId={preselectedCountryCode || undefined}
        onSelect={(c) => {
          setCountry(c.name);
          setCountryId(c.id);
          setCountryRate(c.rate ?? null);
          setCountryRateDisplay(c.rateDisplay ?? (c.rate != null ? `${c.rate}/USD` : ''));
          setShowCountrySheet(false);
        }}
        onClose={() => setShowCountrySheet(false)}
      />

      {/* Confirmation Modal */}
      <GiftCardConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmContinue}
        loading={submitLoading}
        transactionData={giftcardTransactionData}
        // Authoritative quote from this screen — the modal must display this and NOT recalculate.
        quote={{
          loading: rateQuote.loading,
          success: rateQuote.success,
          rateDisplay: rateQuote.rateDisplay,
          payoutDisplay: rateQuote.payoutDisplay,
          amountToReceive: rateQuote.amountToReceive,
          errorMessage: rateQuote.errorMessage,
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Trade Submitted"
        message="Your gift card details have been submitted. We will notify you after review."
      />

      {/* Loading Screen - full-screen overlay during processing */}
      {submitLoading && (
        <Loading />
      )}
    </View>
  );
};

/* ---------- Field rows ---------- */
const SelectField = ({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.select} onPress={onPress} activeOpacity={0.8}>
        <Text
          style={[
            styles.selectText,
            !value && { color: colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {value || placeholder || 'Select'}
        </Text>
        <Image source={chevronRightIcon} style={styles.chev} />
      </TouchableOpacity>
    </View>
  );
};

const LabeledInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
  <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType}
    />
  </View>
  );
};

/* ---------------- Styles ---------------- */
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Header - Updated to match main gift card screen
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    tintColor: colors.text,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: { width: 40 },

  label: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    marginBottom: 8,
  },

  helperText: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  noteText: {
    color: colors.primary,
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },

  select: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: colors.text,
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  chev: { width: 14, height: 14, tintColor: colors.textSecondary, resizeMode: 'contain' },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    height: Platform.select({ ios: 52, android: 48 }),
    color: colors.text,
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
  },

  // Upload box styles
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 16,
    marginTop: -8,
    marginBottom: 18,
  },
  uploadTap: { alignItems: 'center', paddingVertical: 18 },
  uploadTapTitle: {
    color: colors.primary,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 6,
  },
  uploadTapHint: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
  },

  // Multiple photos upload styles
  uploadContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  uploadContent: {
    paddingVertical: 10,
    gap: 10,
  },
  uploadedImageContainer: {
    position: 'relative',
    width: 95,
    height: 96,
  },
  uploadedImage: {
    width: 95,
    height: 96,
    borderRadius: 8,
    backgroundColor: colors.separator,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
  },
  addMoreButton: {
    width: 95,
    height: 96,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cloudIcon: {
    width: 32,
    height: 32,
    tintColor: colors.primary,
    resizeMode: 'contain',
  },
  uploadHint: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    color: colors.text,
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlignVertical: 'top',
  },

  footer: {
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaDisabled: { backgroundColor: '#9CA3AF' },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom sheet chrome
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
  },
  handleBar: {
    width: 42,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  closeTxt: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },

  // Choice pills
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
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.iconBg,
  },
  pillLeft: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  pillLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  pillLabelSelected: { color: colors.iconFg, fontWeight: '700' },
  pillDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillDescriptionSelected: {
    color: colors.iconFg,
  },
});

// Success Modal Styles
const makeSuccessModalStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: 320,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: colors.separator,
    zIndex: 1,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GiftcardTradeScreen;