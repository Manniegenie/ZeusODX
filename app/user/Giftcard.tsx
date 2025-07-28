import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';

// Gift card icons - replace with actual paths
import amazonIcon from '../../components/icons/azn.png';
import amexIcon from '../../components/icons/amex.png';
import googlePlayIcon from '../../components/icons/google-play.png';
import itunesIcon from '../../components/icons/iTunes.png';
import ebayIcon from '../../components/icons/ebay.png';
import adidasIcon from '../../components/icons/adiddas.png';
import lensIcon from '../../components/icons/lens-icon.png';

const GiftCardScreen = ({ onGiftCardSelect }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoBack = () => {
    router.back();
  };

  const giftCards = [
    { id: 'amazon', name: 'Amazon', iconSrc: amazonIcon },
    { id: 'amex-serve', name: 'American Express Serve', iconSrc: amexIcon },
    { id: 'google-play', name: 'Google Play', iconSrc: googlePlayIcon },
    { id: 'itunes', name: 'iTunes', iconSrc: itunesIcon },
    { id: 'ebay', name: 'Ebay', iconSrc: ebayIcon },
    { id: 'adidas', name: 'Adidas', iconSrc: adidasIcon },
  ];

  const filteredGiftCards = giftCards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGiftCardPress = (giftCard) => {
    onGiftCardSelect?.(giftCard);
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
            <Text style={styles.headerTitle}>Gift Card</Text>
          </View>

          {/* Subtitle Section */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitleText}>Select your desired giftcard below</Text>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIcon}>
                <Image source={lensIcon} style={styles.searchIconImage} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for giftcard"
                placeholderTextColor={Colors.text.secondary}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 6,
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
  },

  subtitleSection: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  subtitleText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchIconImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
  },

  giftCardsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  giftCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  giftCardItem: {
    width: '47%', // Slightly less than 50% to account for gap
    marginBottom: 16,
  },
  giftCardIconContainer: {
    width: '100%',
    aspectRatio: 155/142, // Maintain original aspect ratio
    borderRadius: 8,
    overflow: 'hidden',
  },
  giftCardIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default GiftCardScreen;