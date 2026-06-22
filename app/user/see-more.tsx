import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';

// Import your custom icons
const AirtimeIcon = require('../../components/icons/Airtimeicon.png');
const DataIcon = require('../../components/icons/Airtimeicon.png');
const ElectricityIcon = require('../../components/icons/electricity.png');
const BettingIcon = require('../../components/icons/betting.png');
const CableTVIcon = require('../../components/icons/cabletv.png');
const GiftCardIcon = require('../../components/icons/giftcard.png');
const CloseIcon = require('../../components/icons/close.png');

interface Service {
  id: string;
  title: string;
  icon: any;
  route: string;
}

const UtilitiesScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const services: Service[] = [
    { id: 'airtime', title: 'Buy Airtime', icon: AirtimeIcon, route: '/user/Airtime' },
    { id: 'data', title: 'Buy Data', icon: DataIcon, route: '/user/Data' },
    { id: 'electricity', title: 'Electricity', icon: ElectricityIcon, route: '/user/Electricity' },
    { id: 'betting', title: 'Betting', icon: BettingIcon, route: '/user/Betting' },
    { id: 'gift_cards', title: 'Gift Cards', icon: GiftCardIcon, route: '/user/Giftcard' },
    { id: 'cable_tv', title: 'Cable TV', icon: CableTVIcon, route: '/user/CableTV' },
  ];

  const handleServicePress = (service: Service): void => {
    router.push(service.route as any);
  };

  const renderServiceItem = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceItem}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Image source={service.icon} style={styles.iconImage} resizeMode="contain" />
      </View>
      <Text style={styles.serviceText}>{service.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>See more</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.push('/user/dashboard')}
            activeOpacity={0.7}
          >
            <Image source={CloseIcon} style={styles.closeIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Services Content */}
        <View style={styles.servicesContent}>
          <View style={styles.serviceRow}>
            {renderServiceItem(services[0])}
            {renderServiceItem(services[1])}
            {renderServiceItem(services[2])}
          </View>
          <View style={styles.serviceRow}>
            {renderServiceItem(services[3])}
            {renderServiceItem(services[4])}
            {renderServiceItem(services[5])}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 31,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 31,
    position: 'relative',
  },
  headerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  closeButton: {
    width: 27,
    height: 27,
    position: 'absolute',
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: colors.text,
  },
  servicesContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 70,
  },
  serviceItem: {
    alignItems: 'center',
    flexDirection: 'column',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  serviceText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UtilitiesScreen;
