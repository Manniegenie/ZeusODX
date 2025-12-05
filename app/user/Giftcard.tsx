import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import BottomTabNavigator from '../../components/BottomNavigator';
import backIcon from '../../components/icons/backy.png';
import Loading from '../../components/Loading';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

// Gift card icons - keeping existing import routes
import amexIcon from '../../components/icons/amex.png';
import amazonIcon from '../../components/icons/azn.png';
import ebayIcon from '../../components/icons/ebay.png';
import googlePlayIcon from '../../components/icons/google-play.png';
import itunesIcon from '../../components/icons/iTunes.png';
import lensIcon from '../../components/icons/lens-icon.png';

// New gift card icons
import footlockerIcon from '../../components/icons/footlocker.png';
import macyIcon from '../../components/icons/macy.png';
import nikeIcon from '../../components/icons/nike.png';
import nordstromIcon from '../../components/icons/nordstrom.png';
import razorGoldIcon from '../../components/icons/razor-gold.png';
import sephoraIcon from '../../components/icons/sephora.png';
import steamIcon from '../../components/icons/steam.png';
import vanillaIcon from '../../components/icons/vanilla.png';
import visaIcon from '../../components/icons/visa.png';
import xboxIcon from '../../components/icons/xbox.png';

const GiftCardScreen = ({ onGiftCardSelect }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  // Reset loading state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(false);
    }, [])
  );

  const giftCards = [
    { id: 'amazon', name: 'Amazon', iconSrc: amazonIcon },
    { id: 'itunes', name: 'Apple/iTunes', iconSrc: itunesIcon },
    { id: 'steam', name: 'Steam Card', iconSrc: steamIcon },
    { id: 'nordstrom', name: 'Nordstrom', iconSrc: nordstromIcon },
    { id: 'macy', name: 'Macy', iconSrc: macyIcon },
    { id: 'nike', name: 'Nike Gift Card', iconSrc: nikeIcon },
    { id: 'google-play', name: 'Google Play Store', iconSrc: googlePlayIcon },
    { id: 'visa', name: 'Visa Card', iconSrc: visaIcon },
    { id: 'vanilla', name: 'Vanilla Cards', iconSrc: vanillaIcon },
    { id: 'razor-gold', name: 'Razor Gold Gift Card', iconSrc: razorGoldIcon },
    { id: 'amex', name: 'American Express', iconSrc: amexIcon },
    { id: 'sephora', name: 'Sephora', iconSrc: sephoraIcon },
    { id: 'footlocker', name: 'Footlocker', iconSrc: footlockerIcon },
    { id: 'xbox', name: 'Xbox Card', iconSrc: xboxIcon },
    { id: 'ebay', name: 'eBay', iconSrc: ebayIcon },
  ];

  const filteredGiftCards = giftCards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGiftCardPress = (giftCard) => {
    // Optional callback for analytics/side effects
    onGiftCardSelect?.(giftCard);

    // Show loading screen
    setIsLoading(true);

    // Navigate to trade screen, passing brand + id as params
    router.push({
      pathname: '/Giftcard/Giftcardtrade',
      params: { brand: giftCard.name, id: giftCard.id },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              {/* Back Button - Updated to match BTC screen */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.headerTitle}>Reedeem Gift Card</Text>

              {/* Empty space for alignment - Updated to match BTC screen */}
              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIcon}>
                <Image source={lensIcon} style={styles.searchIconImage} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for giftcard to reedeem"
                placeholderTextColor={Colors.text?.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Gift Cards Grid */}
          <View style={styles.giftCardsSection}>
            <View style={styles.giftCardsGrid}>
              {filteredGiftCards.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.giftCardItem}
                  onPress={() => handleGiftCardPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.giftCardIconContainer}>
                    <Image source={item.iconSrc} style={styles.giftCardIcon} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="giftcard" />

      {/* Loading Screen - full-screen overlay during processing */}
      {isLoading && (
        <Loading />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  // Header styles - Updated to match BTC screen
  headerSection: {
    paddingHorizontal: moderateScale(16, 0.1),
    paddingTop: moderateScale(12, 0.1),
    paddingBottom: moderateScale(6, 0.1),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { 
    width: moderateScale(40, 0.1),
    height: moderateScale(40, 0.1),
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: moderateScale(20, 0.1),
  },
  backIcon: {
    width: moderateScale(24, 0.1),
    height: moderateScale(24, 0.1),
    resizeMode: 'contain',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: moderateScale(18, 0.1),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: moderateScale(16, 0.1),
  },
  headerRight: { width: moderateScale(40, 0.1) },

  // Search
  searchSection: {
    paddingHorizontal: moderateScale(16, 0.1),
    paddingVertical: moderateScale(12, 0.1),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(8, 0.1),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: moderateScale(16, 0.1),
    paddingVertical: moderateScale(16, 0.1),
  },
  searchIcon: { marginRight: moderateScale(8, 0.1) },
  searchIconImage: { width: moderateScale(16, 0.1), height: moderateScale(16, 0.1), resizeMode: 'contain' },
  searchInput: {
    flex: 1,
    color: Colors.text?.primary,
    fontFamily: Typography.regular,
    fontSize: moderateScale(14, 0.1),
    fontWeight: '400',
  },

  // Grid
  giftCardsSection: {
    paddingHorizontal: moderateScale(16, 0.1),
    paddingTop: moderateScale(12, 0.1),
    paddingBottom: moderateScale(24, 0.1),
  },
  giftCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(16, 0.1),
  },
  giftCardItem: {
    width: '47%',
    marginBottom: moderateScale(16, 0.1),
  },
  giftCardIconContainer: {
    width: '100%',
    aspectRatio: 155 / 142,
    borderRadius: moderateScale(8, 0.1),
    overflow: 'hidden',
  },
  giftCardIcon: { width: '100%', height: '100%', resizeMode: 'cover' },
});

export default GiftCardScreen;