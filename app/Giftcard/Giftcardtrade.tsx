// app/giftcards/giftcard-trade.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useGiftCard } from '../../hooks/usegiftcard';

// Icons
import chevronRightIcon from '../../components/icons/arrow.png';
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

/* --------------- Consts --------------- */
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif'];

const RECEIPT = [
  { id: 'PHYSICAL', label: 'Physical Card', emoji: '💳' },
  { id: 'ECODE', label: 'E-code', emoji: '🏷️' }, // UI id stays "ECODE"
];

const RANGES = [
  { id: '25-100', label: '$25 – $100', min: 25, max: 100 },
  { id: '100-200', label: '$100 – $200', min: 100, max: 200 },
  { id: '200-500', label: '$200 – $500', min: 200, max: 500 },
  { id: '500-1000', label: '$500 – $1,000', min: 500, max: 1000 },
];

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
        <View style={successModalStyles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                successModalStyles.modalContainer,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={successModalStyles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={successModalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={successModalStyles.titleSection}>
                <Text style={successModalStyles.title}>{title}</Text>
                <Text style={successModalStyles.message}>{message}</Text>
              </View>

              <TouchableOpacity
                style={successModalStyles.submitButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={successModalStyles.submitButtonText}>{buttonText}</Text>
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
}) => (
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

/* ===================== Screen ===================== */
const GiftcardTradeScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ brand?: string }>();
  const brand = (params.brand as string) || 'Amazon';

  // Check if this is a VANILLA card
  const isVanillaCard = brand.toLowerCase().includes('vanilla');

  // Gift card hook
  const { loading: submitLoading, error: submitError, submitGiftCard, clearError } = useGiftCard();

  // form state
  const [country, setCountry] = useState('');          // country name for display
  const [countryId, setCountryId] = useState<string | null>(null); // ISO-ish code (e.g., 'US')
  const [receipt, setReceipt] = useState('');          // 'PHYSICAL' | 'ECODE'
  const [ecode, setEcode] = useState('');
  const [vanillaVariant, setVanillaVariant] = useState(''); // '4097' | '4118' for VANILLA cards
  const [rangeId, setRangeId] = useState('');
  const [valueUSD, setValueUSD] = useState('');
  const [uploads, setUploads] = useState<FileInfo[]>([]);
  const [comments, setComments] = useState('');

  const [openPicker, setOpenPicker] = useState<null | 'receipt' | 'vanilla' | 'range'>(null);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  const selectedRange = useMemo(() => RANGES.find(r => r.id === rangeId) || null, [rangeId]);
  const selectedVanillaVariant = useMemo(() => VANILLA_VARIANTS.find(v => v.id === vanillaVariant) || null, [vanillaVariant]);

  // Clear e-code when leaving ECODE
  useEffect(() => {
    if (receipt !== 'ECODE') setEcode('');
  }, [receipt]);

  // Clear vanilla variant when not VANILLA card
  useEffect(() => {
    if (!isVanillaCard) setVanillaVariant('');
  }, [isVanillaCard]);

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
        quality: 0.9,
        selectionLimit: 1,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      let size = asset.fileSize ?? 0;
      if (!size && asset.uri) {
        try {
          const stat = await FileSystem.getInfoAsync(asset.uri);
          if (stat.exists && typeof stat.size === 'number') size = stat.size;
        } catch {}
      }
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

      const newUpload: FileInfo = {
        name: asset.fileName || asset.uri.split('/').pop() || 'card.jpg',
        size,
        mimeType,
        uri: asset.uri,
      };

      setUploads(prev => [...prev, newUpload]);
    } catch (e: any) {
      showError({
        type: 'general',
        title: 'Upload Failed',
        message: e?.message || 'Unable to open gallery.',
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
    if (!rangeId) {
      showError({ type: 'validation', title: 'Card Range Required', message: 'Select the card range.', autoHide: true, duration: 3000 });
      return false;
    }
    const amount = Number(valueUSD);
    if (!valueUSD || isNaN(amount) || amount <= 0) {
      showError({ type: 'validation', title: 'Card Value Required', message: 'Enter a valid USD amount.', autoHide: true, duration: 3000 });
      return false;
    }
    if (selectedRange && (amount < selectedRange.min || amount > selectedRange.max)) {
      showError({
        type: 'validation',
        title: 'Value Out of Range',
        message: `Enter a value between ${selectedRange.min} and ${selectedRange.max}.`,
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
    return true;
  };

  const handleConfirmPress = () => {
    if (validate()) setShowConfirmationModal(true);
  };

  const handleConfirmContinue = async () => {
    setShowConfirmationModal(false);

    // Normalize UI receipt -> API format
    const normalizedCardFormat = receipt === 'ECODE' ? 'E_CODE' : receipt === 'PHYSICAL' ? 'PHYSICAL' : null;

    if (!normalizedCardFormat || !countryId) {
      showError({
        type: 'validation',
        title: 'Invalid Data',
        message: 'Please check your selections and try again.',
        autoHide: true,
        duration: 3000,
      });
      return;
    }

    // Map brand name to backend card type format
    const cardTypeMapping: Record<string, string> = {
      'Amazon': 'AMAZON',
      'Apple': 'APPLE', 
      'Steam': 'STEAM',
      'Nordstrom': 'NORDSTROM',
      'Macy': 'MACY',
      'Nike': 'NIKE',
      'Google Play': 'GOOGLE_PLAY',
      'Visa': 'VISA',
      'Vanilla': 'VANILLA',
      'Razer Gold': 'RAZOR_GOLD',
      'American Express': 'AMERICAN_EXPRESS',
      'Sephora': 'SEPHORA',
      'Foot Locker': 'FOOTLOCKER',
      'Xbox': 'XBOX',
      'eBay': 'EBAY',
    };

    const mappedCardType = cardTypeMapping[brand] || brand.toUpperCase().replace(/\s+/g, '_');

    // Prepare gift card data matching backend validation
    const giftCardData: any = {
      cardType: mappedCardType,
      cardFormat: normalizedCardFormat,
      cardRange: selectedRange ? `${selectedRange.min}-${selectedRange.max}` : rangeId,
      cardValue: valueUSD,
      currency: 'USD',
      country: countryId,
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
      setReceipt('');
      setEcode('');
      setVanillaVariant('');
      setRangeId('');
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
      rangeId &&
      valueUSD &&
      Number(valueUSD) > 0 &&
      uploads.length > 0
  );

  const receiptChoices: ChoiceItem[] = RECEIPT.map(r => ({
    id: r.id,
    label: r.label,
  }));
  const vanillaChoices: ChoiceItem[] = VANILLA_VARIANTS.map(v => ({ 
    id: v.id, 
    label: v.label,
    description: v.description 
  } as ChoiceItem));
  const rangeChoices: ChoiceItem[] = RANGES.map(r => ({ id: r.id, label: r.label }));

  const activeTitle = 
    openPicker === 'receipt' ? 'Receipt Availability' : 
    openPicker === 'vanilla' ? 'Select Variant' :
    openPicker === 'range' ? 'Select Range' : 
    '';

  const activeChoices = 
    openPicker === 'receipt' ? receiptChoices : 
    openPicker === 'vanilla' ? vanillaChoices :
    openPicker === 'range' ? rangeChoices : 
    [];

  const activeSelectedId = 
    openPicker === 'receipt' ? receipt : 
    openPicker === 'vanilla' ? vanillaVariant :
    openPicker === 'range' ? rangeId : 
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
    rate: selectedRange?.label || '',
    timeOfUpload: '',
    averageConfirmationTime: '10-15mins',
    cardType: isVanillaCard && selectedVanillaVariant ? selectedVanillaVariant.label : '',
    cardFormat: normalizedCardFormat,
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

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
          {/* Header - Updated to match BTC screen */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.back} 
              onPress={handleGoBack} 
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{brand}</Text>
            <View style={styles.headerRight} />
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
                placeholderTextColor={Colors.text?.secondary}
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

          {/* Range */}
          <SelectField
            label="Card Range"
            value={selectedRange?.label || ''}
            placeholder="Select range"
            onPress={() => setOpenPicker('range')}
          />

          {/* Amount */}
          <LabeledInput
            label="Card Value ($)"
            value={valueUSD}
            onChangeText={setValueUSD}
            placeholder="Enter value in USD"
            keyboardType="numeric"
          />

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
            placeholderTextColor={Colors.text?.secondary}
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
          if (openPicker === 'range') setRangeId(id);
          setOpenPicker(null);
        }}
        centerAlign={openPicker === 'receipt' || openPicker === 'range'}
        showDescription={openPicker === 'vanilla'}
      />

      {/* Country sheet */}
      <AvailableCountrySheet
        visible={showCountrySheet}
        brand={brand}
        selectedCountryId={countryId ?? undefined}
        onSelect={(c) => {
          setCountry(c.name);
          setCountryId(c.id);
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
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Trade Submitted"
        message="Your gift card details have been submitted. We will notify you after review."
      />
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
}) => (
  <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.select} onPress={onPress} activeOpacity={0.8}>
      <Text
        style={[
          styles.selectText,
          !value && { color: Colors.text?.secondary || '#9CA3AF' },
        ]}
        numberOfLines={1}
      >
        {value || placeholder || 'Select'}
      </Text>
      <Image source={chevronRightIcon} style={styles.chev} />
    </TouchableOpacity>
  </View>
);

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
}) => (
  <View style={{ marginBottom: 18, marginHorizontal: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text?.secondary}
      keyboardType={keyboardType}
    />
  </View>
);

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F7F6FF' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Header - Updated to match BTC screen
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { 
    width: 48,  // Increased from 40
    height: 48, // Increased from 40
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)', // Very subtle background instead of transparent
    overflow: 'hidden', // Better Android performance
  },
  backText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: {
    flex: 1,
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: { width: 48 }, // Updated to match new back button width

  label: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    marginBottom: 8,
  },

  select: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  chev: { width: 14, height: 14, tintColor: Colors.text?.secondary || '#9CA3AF', resizeMode: 'contain' },

  input: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 15,
  },

  // Upload box styles
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: Colors.surface || '#FFFFFF',
    padding: 16,
    marginTop: -8,
    marginBottom: 18,
  },
  uploadTap: { alignItems: 'center', paddingVertical: 18 },
  uploadTapTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 6,
  },
  uploadTapHint: {
    color: Colors.text?.secondary || '#6B7280',
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
    backgroundColor: '#F3F4F6',
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
    borderColor: '#35297F',
    backgroundColor: Colors.surface || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cloudIcon: {
    width: 32,
    height: 32,
    tintColor: '#35297F',
    resizeMode: 'contain',
  },
  uploadHint: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  textArea: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlignVertical: 'top',
  },

  footer: {
    paddingVertical: 20,
    backgroundColor: Colors.background || '#F7F6FF',
  },
  cta: {
    backgroundColor: '#35297F',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
  },
  handleBar: {
    width: 42,
    height: 3,
    backgroundColor: '#E5E7EB',
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
    color: '#111827',
    textAlign: 'center',
  },
  closeTxt: { fontSize: 16, color: '#6B7280', fontWeight: '600' },

  // Choice pills
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
  pillSelected: {
    borderColor: '#35297F',
    backgroundColor: '#F6F4FF',
  },
  pillLeft: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  pillLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  pillLabelSelected: { color: '#35297F', fontWeight: '700' },
  pillDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pillDescriptionSelected: { 
    color: '#5B4B8A',
  },
});

// Success Modal Styles
const successModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#35297F',
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