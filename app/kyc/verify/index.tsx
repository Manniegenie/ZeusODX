import { useRouter } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import backIcon from '../../../components/icons/backy.png';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function VerifyIndex() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
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

          <TouchableOpacity style={styles.card} onPress={() => router.push('/kyc/verify/nin')}>
            <Text style={styles.cardTitle}>National ID Number (NIN)</Text>
            <Text style={styles.cardSub}>Authority check + selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/kyc/verify/passport')}>
            <Text style={styles.cardTitle}>Passport</Text>
            <Text style={styles.cardSub}>Authority check + selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/kyc/verify/drivers-license')}>
          <Text style={styles.cardTitle}>{`Driver's License`}</Text>
            <Text style={styles.cardSub}>Authority Check + selfie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
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
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 13, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { color: Colors.text?.primary || '#111827', fontSize: 16, fontWeight: '600' },
  cardSub: { color: Colors.text?.secondary || '#6B7280', marginTop: 4, fontSize: 12 },
});