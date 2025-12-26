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
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';

// Utility service icons
import utilityAirtimeIcon from '../../components/icons/utility-airtime.png';
import utilityCableIcon from '../../components/icons/utility-cable.png';
import utilityDataIcon from '../../components/icons/utility-data.png';
import utilityElectricityIcon from '../../components/icons/utility-electricity.png';

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

  // Utility services configuration - organized by columns
  const leftColumnServices: UtilityService[] = [
    { 
      id: 'airtime', 
      name: 'Airtime', 
      iconSrc: utilityAirtimeIcon, 
      route: '/user/Airtime',
      color: '#6366F1'
    },
    { 
      id: 'electricity', 
      name: 'Electricity', 
      iconSrc: utilityElectricityIcon, 
      route: '/user/Electricity',
      color: '#DC2626'
    },
  ];

  const rightColumnServices: UtilityService[] = [
    { 
      id: 'data', 
      name: 'Data', 
      iconSrc: utilityDataIcon, 
      route: '/user/Data',
      color: '#F59E0B'
    },
    { 
      id: 'cable', 
      name: 'Cable', 
      iconSrc: utilityCableIcon, 
      route: '/user/CableTV',
      color: '#2563EB'
    },
  ];

  // Navigation handlers
  const handleGoBack = (): void => {
    router.back();
  };

  const handleServiceSelect = (service: UtilityService): void => {
    router.push(service.route as any);
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
          {/* Utility Services - Two Columns */}
          <View style={styles.servicesContainer}>
            <View style={styles.columnsContainer}>
              {/* Left Column: Airtime, Electricity */}
              <View style={styles.column}>
                {leftColumnServices.map((service) => (
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

              {/* Right Column: Data, Cable */}
              <View style={styles.column}>
                {rightColumnServices.map((service) => (
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
          </View>

          {/* Bottom spacing to account for bottom navigation */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Navigator - Updated activeTab to "utility" */}
      <BottomTabNavigator activeTab="utility" />
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
  headerSection: {
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.verticalSpacing.xs,
    paddingBottom: Layout.verticalSpacing.sm,
    backgroundColor: Colors.background || '#F3F4F6',
    zIndex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: Layout.scale(40),
    height: Layout.scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.scale(20),
  },
  backIcon: {
    width: Layout.icon.md,
    height: Layout.icon.md,
    resizeMode: 'contain',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: Layout.scale(40),
  },
  headerUnderline: {
    height: 0.5,
    backgroundColor: '#6358A6',
    marginTop: 16,
    marginHorizontal: -16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Layout.verticalSpacing.lg,
  },
  servicesContainer: {
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.verticalSpacing.lg,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Layout.spacing.xs,
  },
  serviceCard: {
    width: '100%',
    maxWidth: Layout.scale(140),
    minWidth: Layout.scale(110),
    height: Layout.scaleVertical(80),
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  serviceIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: Layout.borderRadius.md,
  },
  bottomSpacer: {
    height: Layout.scaleVertical(100),
  },
});

export default UtilityScreen;