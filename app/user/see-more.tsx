import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
  color: string;
  route: string;
}

const UtilitiesScreen: React.FC = () => {
  const router = useRouter();
  const services: Service[] = [
    {
      id: 'airtime',
      title: 'Buy Airtime',
      icon: AirtimeIcon,
      color: '#FFFFFF',
      route: 'Airtime'
    },
    {
      id: 'data',
      title: 'Buy Data',
      icon: DataIcon,
      color: '#FFFFFF',
      route: 'Data'
    },
    {
      id: 'electricity',
      title: 'Electricity',
      icon: ElectricityIcon,
      color: '#FFFFFF',
      route: 'Electricity'
    },
    {
      id: 'betting',
      title: 'Betting',
      icon: BettingIcon,
      color: '#FFFFFF',
      route: 'Betting'
    },
    {
      id: 'cable_tv',
      title: 'Cable TV',
      icon: CableTVIcon,
      color: '#FFFFFF',
      route: 'CableTV'
    },
    {
      id: 'gift_cards',
      title: 'Gift Cards',
      icon: GiftCardIcon,
      color: '#FFFFFF',
      route: 'Giftcard'
    }
  ];

  const handleServicePress = (service: Service): void => {
    router.push(`user/${service.route}`);
  };

  const renderServiceItem = (service: Service, containerStyle: any, textStyle: any, isLast: boolean = false): JSX.Element => (
    <TouchableOpacity 
      key={service.id}
      style={[styles.serviceItem, isLast && styles.lastServiceItem]}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.8}
    >
      <View style={[containerStyle, { backgroundColor: service.color }]}>
        <Image 
          source={service.icon}
          style={styles.iconImage}
          resizeMode="contain"
        />
      </View>
      <Text style={textStyle}>{service.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#352F7F" />
      
      <LinearGradient
        colors={['#352F7F', '#4536A4', '#352F7F']}
        style={styles.phoneContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>See more</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.push('/user/dashboard')}
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
            {renderServiceItem(services[0], styles.frame257, styles.textWrapper369)}
            {renderServiceItem(services[1], styles.frame257, styles.textWrapper369)}
            {renderServiceItem(services[2], styles.frame257, styles.textWrapper369, true)}
          </View>

          {/* Second Row - Betting, Cable TV, Gift Cards */}
          <View style={styles.serviceRow}>
            {renderServiceItem(services[3], styles.frame257, styles.textWrapper368)}
            {renderServiceItem(services[4], styles.frame257, styles.textWrapper369)}
            {renderServiceItem(services[5], styles.frame257, styles.textWrapper369, true)}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#352F7F',
  },
  phoneContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 31,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2FF',
    marginHorizontal: 31,
    position: 'relative',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  closeButton: {
    width: 27,
    height: 27,
    position: 'absolute',
    right: 0,
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
  lastServiceItem: {
    marginRight: 0,
  },
  frame257: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  textWrapper368: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
  textWrapper369: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UtilitiesScreen;
