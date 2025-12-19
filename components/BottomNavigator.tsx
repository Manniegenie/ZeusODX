import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, ImageStyle, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

// Tab icon imports
const homeIcon = require('./icons/home-icon.png');
const tradeIcon = require('./icons/trade-icon.png');
const giftcardIcon = require('./icons/util.png');
const activityIcon = require('./icons/wallet-icon.png');
const profileIcon = require('./icons/profile-icon.png');

interface Tab {
  id: string;
  label: string;
  icon: any;
  route: string;
}

interface AnimatedTabProps {
  tab: Tab;
  isActive: boolean;
  onPress: (tab: Tab) => void;
}

const AnimatedTab: React.FC<AnimatedTabProps> = ({ tab, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const isBuySellTab = tab.id === 'swap';

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: false
    }).start();

    if (isActive && !isBuySellTab) {
      Animated.sequence([
        Animated.timing(translateYAnim, { toValue: -2, duration: 150, useNativeDriver: true }),
        Animated.spring(translateYAnim, { toValue: 0, tension: 300, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive, isBuySellTab]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress(tab);
  };

  const iconTintColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.text.secondary, Colors.primary]
  });
  
  const labelColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.text.secondary, Colors.primary]
  });

  if (isBuySellTab) {
    return (
      <TouchableOpacity style={styles.specialTabItem} onPress={handlePress} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.specialTabContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.specialIconContainer}>
            <Animated.Image
              source={tab.icon}
              style={[
                styles.specialTabIcon,
                { tintColor: '#FFFFFF' }
              ]}
            />
          </View>
          <Animated.Text
            style={[
              styles.specialTabLabel,
              {
                color: '#FFFFFF',
                fontFamily: Typography.medium,
                fontWeight: '600',
              }
            ]}
          >
            {tab.label}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Regular tab styling for other tabs
  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.tabContainer,
          { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }
        ]}
      >
        <Animated.Image
          source={tab.icon}
          style={[styles.tabIcon, { tintColor: iconTintColor }]}
        />
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: labelColor,
              fontFamily: isActive ? Typography.medium : Typography.regular,
            }
          ]}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface BottomTabNavigatorProps {
  activeTab?: string;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab }) => {
  const router = useRouter();
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const tabs: Tab[] = [
    { id: 'home',      label: 'Home',     icon: homeIcon,     route: '../user/dashboard' },
    // { id: 'giftcard',  label: 'Giftcard', icon: giftcardIcon, route: '/user/Giftcard' }, // TEMPORARILY HIDDEN
    { id: 'utility',   label: 'Utility',  icon: giftcardIcon, route: '/user/utility' }, // TEMPORARY: Replaced giftcard with utility
    { id: 'swap',      label: 'Buy/Sell', icon: tradeIcon,    route: '../user/Swap' },
    { id: 'wallet',  label: 'Wallet', icon: activityIcon, route: '../user/wallet' },
    { id: 'profile',   label: 'Profile',  icon: profileIcon,  route: '/profile/profile' },
  ];

  const getCurrentTab = (): string => {
    if (activeTab) return activeTab;
    const current = tabs.find(
      t => t.route === pathname || (t.route !== '/' && pathname.startsWith(t.route))
    );
    return current?.id ?? 'home';
  };

  const handleTabPress = (tab: Tab) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    router.push(tab.route as any);
  };

  const currentActiveTab = getCurrentTab();
  const slideTransform = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaContainer}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideTransform }],
          },
        ]}
      >
        <View style={styles.tabNavContainer}>
          {tabs.map(tab => (
            <AnimatedTab
              key={tab.id}
              tab={tab}
              isActive={currentActiveTab === tab.id}
              onPress={handleTabPress}
            />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

interface Styles {
  safeAreaContainer: ViewStyle;
  container: ViewStyle;
  tabNavContainer: ViewStyle;
  tabItem: ViewStyle;
  tabContainer: ViewStyle;
  tabIcon: ImageStyle;
  tabLabel: TextStyle;
  specialTabItem: ViewStyle;
  specialTabContainer: ViewStyle;
  specialIconContainer: ViewStyle;
  specialTabIcon: ImageStyle;
  specialTabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  safeAreaContainer: {
    backgroundColor: '#FAFAFA',
  },
  container: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: moderateScale(8, 0.1),
  },
  tabNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    height: moderateScale(40, 0.1),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(56, 0.1),
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: moderateScale(24, 0.1),
    height: moderateScale(24, 0.1),
    resizeMode: 'contain',
  },
  tabLabel: {
    fontSize: moderateScale(12, 0.1),
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: moderateScale(4, 0.1),
  },
  // Special styles for Buy/Sell tab - Shadow effects removed
  specialTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(56, 0.1),
    marginTop: moderateScale(-6, 0.1),
  },
  specialTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialIconContainer: {
    width: moderateScale(50, 0.1),
    height: moderateScale(50, 0.1),
    borderRadius: moderateScale(25, 0.1),
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#35297F33',
  },
  specialTabIcon: {
    width: moderateScale(24, 0.1),
    height: moderateScale(24, 0.1),
    resizeMode: 'contain',
  },
  specialTabLabel: {
    fontSize: moderateScale(12, 0.1),
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: moderateScale(6, 0.1),
    fontWeight: '600',
  },
});

export default BottomTabNavigator;