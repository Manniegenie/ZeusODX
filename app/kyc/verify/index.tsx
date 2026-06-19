import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import backIcon from '../../../components/icons/backy.png';
import { useTheme } from '../../../hooks/useTheme';
import type { AppColors } from '../../../hooks/useTheme';
import { Typography } from '../../../constants/Typography';

export default function VerifyIndex() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const navigateWithCameraPermission = async (route: string) => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status === 'granted') {
      router.push(route as any);
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is required for identity verification. Please enable camera access in your device settings to continue.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.statusBar} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Identity Verification</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sub}>Choose a method to continue</Text>

          <TouchableOpacity style={styles.card} onPress={() => navigateWithCameraPermission('/kyc/verify/nin')}>
            <Text style={styles.cardTitle}>National ID Number (NIN)</Text>
            <Text style={styles.cardSub}>Authority check + selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigateWithCameraPermission('/kyc/verify/passport')}>
            <Text style={styles.cardTitle}>Passport</Text>
            <Text style={styles.cardSub}>Authority check + selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigateWithCameraPermission('/kyc/verify/drivers-license')}>
          <Text style={styles.cardTitle}>{`Driver's License`}</Text>
            <Text style={styles.cardSub}>Authority Check + selfie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
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
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cardSub: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
});