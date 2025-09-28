import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import backIcon from '../../components/icons/backy.png';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';

// Icons
import checkmarkIcon from '../../components/icons/green-checkmark.png';

const KYCLevel1Screen: React.FC = () => {
  const router = useRouter();

  // Navigation handler
  const handleGoBack = (): void => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.headerTitle}>Level 1 Verification</Text>

              {/* Spacer to center title */}
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to ₦0 daily and ₦0 monthly in fiat
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Withdraw and transfer up to $0 in crypto
                </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Buy Utilities up to ₦50,000 daily and ₦200,000 monthly
            </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.benefitText}>
                Complete Fiat Verification to Withdraw NGNZ
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Overall Progress</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>100% complete</Text>
              </View>
            </View>
          </View>

          {/* Verification Steps Section */}
          <View style={styles.section}>
            {/* Confirm Phone Number */}
            <View style={styles.verificationCard}>
              <View style={styles.verificationContent}>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationTitle}>Confirm Phone number</Text>
                  <Text style={styles.verificationSubtitle}>
                    Your phone number has been successfully verified.
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F8F9FA' 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },

  // Header styles (matching previous screens)
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
  headerSpacer: {
    width: 40,
  },

  // Section styles
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Benefits section styles
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text?.primary || '#111827',
    marginTop: 8,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 13, // Reduced by 20%
    fontWeight: '400',
    lineHeight: 18,
  },

  // Progress section styles
  progressCard: {
    backgroundColor: '#F0FDF4', // Light green background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5', // Light green border
    padding: 12, // More minimal padding
  },
  progressTitle: {
    color: '#065F46', // Dark green text
    fontFamily: Typography.medium || 'System',
    fontSize: 12, // Smaller, more subtle
    fontWeight: '500', // Less bold
    marginBottom: 8, // Reduced margin
    textAlign: 'center',
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6, // Thinner progress bar
    backgroundColor: '#D1FAE5', // Light green background
    borderRadius: 3,
    marginBottom: 6, // Reduced margin
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%', // 100% complete
    height: '100%',
    backgroundColor: '#10B981', // Green fill
    borderRadius: 3,
  },
  progressText: {
    color: '#065F46', // Dark green text
    fontFamily: Typography.medium || 'System',
    fontSize: 10, // Smaller, more subtle
    fontWeight: '500', // Less bold
  },

  // Verification card styles
  verificationCard: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  verificationTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14, // Reduced by 20%
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationSubtitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11, // Reduced by 20%
    fontWeight: '400',
    lineHeight: 16,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default KYCLevel1Screen;