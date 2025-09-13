import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useDigitalAddressVerification } from '../../hooks/useaddressVerification';

export default function AddressVerify() {
  const router = useRouter();
  const { loading, error, statusText, submit, validate, reset } = useDigitalAddressVerification();

  // Address-only fields (country/idType/phone handled in background)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Minimal validity: just ensure address line 1 is reasonably filled
  const valid = useMemo(() => String(addressLine1).trim().length >= 5, [addressLine1]);

  const onSubmit = async () => {
    const payload = {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
    };

    const errs = validate(payload);
    if (errs.length) {
      Alert.alert('Missing info', errs[0]);
      return;
    }

    const res = await submit(payload);
    if (res.success) {
      Alert.alert('Submitted', 'Your digital address verification has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      reset();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background || '#F8F9FA'} barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header (mirrored format: larger tappable back button, centered title) */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Address Verification</Text>

            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.sub}>
            Provide your address details. We’ll submit a Digital Address Verification to our KYC provider.
          </Text>

          {/* Status / Errors */}
          {!!statusText && (
            <View style={[styles.banner, styles.bannerInfo]}>
              <Text style={styles.bannerText}>{statusText}</Text>
            </View>
          )}
          {!!error && (
            <View style={[styles.banner, styles.bannerError]}>
              <Text style={styles.bannerText}>Error: {error}</Text>
            </View>
          )}

          {/* Address lines */}
          <Text style={styles.label}>Address Line 1</Text>
          <TextInput
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House/Street, Area"
            placeholderTextColor={Colors.text?.secondary || '#6B7280'}
            style={[styles.input, { minHeight: 46 }]}
          />

          <Text style={styles.label}>Address Line 2 (Optional)</Text>
          <TextInput
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Apartment, landmark (optional)"
            placeholderTextColor={Colors.text?.secondary || '#6B7280'}
            style={styles.input}
          />

          {/* City / State */}
          <View style={styles.row}>
            <View style={[styles.col, { marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ikeja"
                placeholderTextColor={Colors.text?.secondary || '#6B7280'}
                style={styles.input}
              />
            </View>
            <View style={[styles.col, { marginLeft: 8 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="Lagos"
                placeholderTextColor={Colors.text?.secondary || '#6B7280'}
                style={styles.input}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="100001"
                placeholderTextColor={Colors.text?.secondary || '#6B7280'}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>• We submit these details to verify your address digitally.</Text>
            <Text style={styles.infoText}>• No document upload is required for this check.</Text>
            <Text style={styles.infoText}>• You’ll see status update here once we get a result.</Text>
          </View>

          <TouchableOpacity
            style={[styles.cta, { opacity: valid && !loading ? 1 : 0.5 }]}
            disabled={!valid || loading}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{loading ? 'Submitting…' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background || '#F8F9FA',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header (mirrored format)
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontWeight: '500',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: { width: 48 },

  // Body
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sub: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 20,
    lineHeight: 18,
  },

  // Labels / Inputs — NOT bold
  label: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },

  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1 },

  // Info box — NOT bold
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#0C4A6E',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  infoText: {
    color: '#0369A1',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 4,
    lineHeight: 18,
  },

  // CTA — matches other screens
  cta: {
    backgroundColor: '#35297F',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    fontSize: 16,
  },

  // Banners
  banner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  bannerInfo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  bannerText: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
  },
});
