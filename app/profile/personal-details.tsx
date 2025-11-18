// app/user/PersonalDetailsScreen.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useUserProfile } from '../../hooks/useProfile';

// use same back icon as other screens
import backIcon from '../../components/icons/backy.png';

interface PersonalDetails {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

const dashOr = (v?: string | null) => (v && String(v).trim().length ? v : '—');

/** Extract first/last name from profile, preferring original fields, else split fullName */
function deriveNames(profile: any): { firstName: string; lastName: string } {
  const first =
    profile?._original?.firstname ??
    profile?._original?.firstName ??
    (profile?.fullName ? String(profile.fullName).trim().split(/\s+/)[0] : '') ??
    '';
  const last =
    profile?._original?.lastname ??
    profile?._original?.lastName ??
    (profile?.fullName
      ? String(profile.fullName)
          .trim()
          .split(/\s+/)
          .slice(1)
          .join(' ')
      : '') ??
    '';
  return { firstName: first || '', lastName: last || '' };
}

const PersonalDetailsScreen = () => {
  const router = useRouter();

  // Load profile on mount; expose refetch for retry
  const { profile, loading, error, refetch } = useUserProfile();

  // Fetch profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const details: PersonalDetails = useMemo(() => {
    const { firstName, lastName } = deriveNames(profile);
    const email: string = profile?.email ?? '';
    const username: string =
      profile?.username ??
      (email && email.includes('@') ? email.split('@')[0] : '');

    return {
      firstName,
      lastName,
      username,
      email,
    };
  }, [profile]);

  const isBusy = Boolean(loading);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Personal Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Loading */}
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>
                {error.message || 'Could not load profile'}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>First name</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{dashOr(details.firstName)}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{dashOr(details.lastName)}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{dashOr(details.username)}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{dashOr(details.email)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
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
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: { width: 40, height: 40 },

  loadingWrap: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { marginLeft: 8, color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 },

  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#991B1B',
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryText: { color: '#fff', fontFamily: Typography.medium, fontSize: 14 },

  formSection: { paddingHorizontal: 16, paddingBottom: 32 },
  fieldContainer: { marginBottom: 24 },
  fieldLabel: {
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'left',
  },
  disabledInput: {
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  disabledInputText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 16,
    fontWeight: '400',
  },
});

export default PersonalDetailsScreen;
