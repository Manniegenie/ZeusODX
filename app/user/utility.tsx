import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ImageSourcePropType
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import BottomTabNavigator from '../../components/BottomNavigator';

// Utility service icons
import utilityAirtimeIcon from '../../components/icons/utility-airtime.png';
import utilityDataIcon from '../../components/icons/utility-data.png';
import utilityElectricityIcon from '../../components/icons/utility-electricity.png';
import utilityCableIcon from '../../components/icons/utility-cable.png';
import utilityBettingIcon from '../../components/icons/utility-betting.png';
import utilityGiftcardIcon from '../../components/icons/utility-giftcard.png';

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
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.headerTitle}>Utility</Text>

            {/* Empty space for alignment */}
            <View style={styles.emptySpace} />
          </View>
          
          {/* Header underline */}
          <View style={styles.headerUnderline} />
        </View>

        {/* Utility Services Grid */}
        <View style={styles.servicesContainer}>
          <View style={styles.servicesGrid}>
            {utilityServices.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  // Special styling for the last item (Giftcard) to make it single column
                  index === utilityServices.length - 1 && styles.lastServiceCard
                ]}
                onPress={() => handleServiceSelect(service)}
                activeOpacity={0.8}
              >
                <Image source={service.iconSrc} style={styles.serviceIcon} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Add BottomTabNavigator */}
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

  // Header styles
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 6,        // Reduced from 12 to 6
    paddingBottom: 12,    // Reduced from 24 to 12
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
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
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
  emptySpace: {
    width: 40,
  },
  headerUnderline: {
    height: 0.5,
    backgroundColor: '#6358A6',
    marginTop: 16,
    marginHorizontal: -16,
  },

  // Services grid styles
  servicesContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,       // Reduced from 40 to 20
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  serviceCard: {
    width: 155,
    height: 81,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastServiceCard: {
    // For giftcard to be positioned properly in the layout
    alignSelf: 'flex-start',
  },
  serviceIcon: {
    width: 155,
    height: 81,
    resizeMode: 'contain',
    borderRadius: 8,
  },
});

export default UtilityScreen;