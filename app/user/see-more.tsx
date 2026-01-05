import { useRouter } from 'expo-router';
import React, { ReactElement } from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
  const services: Service[] = [
    {
      id: 'airtime',
      title: 'Buy Airtime',
      icon: AirtimeIcon,
      route: 'Airtime'
    },
    {
      id: 'data',
      title: 'Buy Data',
      icon: DataIcon,
      route: 'Data'
    },
    {
      id: 'electricity',
      title: 'Electricity',
      icon: ElectricityIcon,
      route: 'Electricity'
    },
    {
      id: 'betting',
      title: 'Betting',
      icon: BettingIcon,
      route: 'Betting'
    },
    {
      id: 'gift_cards',
      title: 'Gift Cards',
      icon: GiftCardIcon,
      route: 'Giftcard'
    },
    {
      id: 'cable_tv',
      title: 'Cable TV',
      icon: CableTVIcon,
      route: 'CableTV'
    },
  ];

  const handleServicePress = (service: Service): void => {
    router.push(`/user/${service.route}` as any);
  };

  const renderServiceItem = (service: Service): ReactElement => (
    <TouchableOpacity 
      key={service.id}
      style={styles.serviceItem}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.7}
    >
      <Image 
        source={service.icon}
        style={styles.iconImage}
        resizeMode="contain"
      />
      <Text style={styles.serviceText}>{service.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#35297F" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>See more</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.push('/user/dashboard')}
            activeOpacity={0.7}
          >
            <Image 
              source={CloseIcon}
              style={styles.closeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Services Content */}
        <View style={styles.servicesContent}>
          {/* First Row - Buy Airtime, Buy Data, Electricity */}
          <View style={styles.serviceRow}>
            {renderServiceItem(services[0])}
            {renderServiceItem(services[1])}
            {renderServiceItem(services[2])}
          </View>

          {/* Second Row - Betting, Gift Cards, Cable TV */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35297F',
  },
  content: {
    flex: 1,
    backgroundColor: '#35297F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 31,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 31,
    position: 'relative',
  },
  headerText: {
    color: '#FFFFFF',
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
    tintColor: '#FFFFFF',
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
  iconImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  serviceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UtilitiesScreen;