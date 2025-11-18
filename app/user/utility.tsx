// app/user/UtilityScreen.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

// Utility service icons
import utilityAirtimeIcon from '../../components/icons/utility-airtime.png';
import utilityBettingIcon from '../../components/icons/utility-betting.png';
import utilityCableIcon from '../../components/icons/utility-cable.png';
import utilityDataIcon from '../../components/icons/utility-data.png';
import utilityElectricityIcon from '../../components/icons/utility-electricity.png';
import utilityGiftcardIcon from '../../components/icons/utility-giftcard.png';

// use same back icon as other screens
import backIcon from '../../components/icons/backy.png';

// Type definitions
interface UtilityService {
  id: string;
  name: string;
  iconSrc: ImageSourcePropType;
  route: string;
  color: string;
}

const UtilityScreen: React.FC = () => {
  const router = useRouter();

  // Utility services configuration
  const utilityServices: UtilityService[] = [
    { 
      id: 'airtime', 
      name: 'Airtime', 
      iconSrc: utilityAirtimeIcon, 
      route: '/user/Airtime',
      color: '#6366F1'
    },
    { 
      id: 'data', 
      name: 'Data', 
      iconSrc: utilityDataIcon, 
      route: '/user/Data',
      color: '#F59E0B'
    },
    { 
      id: 'electricity', 
      name: 'Electricity', 
      iconSrc: utilityElectricityIcon, 
      route: '/user/Electricity',
      color: '#DC2626'
    },
    { 
      id: 'cable', 
      name: 'Cable', 
      iconSrc: utilityCableIcon, 
      route: '/user/CableTV',
      color: '#2563EB'
    },
    { 
      id: 'betting', 
      name: 'Betting', 
      iconSrc: utilityBettingIcon, 
      route: '/user/Betting',
      color: '#059669'
    },
    { 
      id: 'giftcard', 
      name: 'Giftcard', 
      iconSrc: utilityGiftcardIcon, 
      route: '/user/Giftcard',
      color: '#B45309'
    },
  ];

  // Navigation handlers
  const handleGoBack = (): void => {
    router.back();
  };

  const handleServiceSelect = (service: UtilityService): void => {
    router.push(service.route);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleGoBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>

            {/* Centered Title */}
            <Text style={styles.headerTitle}>Utility</Text>

            {/* Empty space for alignment */}
            <View style={styles.headerSpacer} />
          </View>
          
          {/* Header underline */}
          <View style={styles.headerUnderline} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Utility Services Grid */}
          <View style={styles.servicesContainer}>
            <View style={styles.servicesGrid}>
              {utilityServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServiceSelect(service)}
                  activeOpacity={0.8}
                >
                  <Image source={service.iconSrc} style={styles.serviceIcon} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom spacing to account for bottom navigation */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Navigator */}
      <BottomTabNavigator activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F3F4F6' 
  },
  safeArea: { 
    flex: 1 
  },

  // Header styles - Fixed header
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: Colors.background || '#F3F4F6',
    zIndex: 1,
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
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: {
    width: 40,
  },
  headerUnderline: {
    height: 0.5,
    backgroundColor: '#6358A6',
    marginTop: 16,
    marginHorizontal: -16,
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Services grid styles - Fixed dimensions
  servicesContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 28,
    rowGap: 1,
  },
  serviceCard: {
    width: 140,        // Reduced width
    height: 80,        // Reduced height
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
  },

  // Bottom spacer for navigation
  bottomSpacer: {
    height: 100,
  },
});

export default UtilityScreen;
