import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, ImageStyle, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

// Tab icon imports
const homeIcon = require('../components/icons/home-icon.png');
const tradeIcon = require('../components/icons/trade-icon.png');
const giftcardIcon = require('../components/icons/giftcard-icon.png');
const activityIcon = require('../components/icons/wallet-icon.png');
const profileIcon = require('../components/icons/profile-icon.png');

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

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: false
    }).start();

    if (isActive) {
      Animated.sequence([
        Animated.timing(translateYAnim, { toValue: -2, duration: 150, useNativeDriver: true }),
        Animated.spring(translateYAnim, { toValue: 0, tension: 300, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive]);

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
    { id: 'giftcard',  label: 'Giftcard', icon: giftcardIcon, route: '/user/come-soon' },
    { id: 'swap',      label: 'Buy/Sell', icon: tradeIcon,    route: '../user/Swap' },
    { id: 'wallet',  label: 'Wallet', icon: activityIcon, route: '../user/wallet' },
    { id: 'profile',   label: 'Profile',  icon: profileIcon,  route: '/user/come-soon' },
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
    router.push(tab.route);
  };

  const currentActiveTab = getCurrentTab();
  const slideTransform = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideTransform }],
          // Industry standard: fixed height + safe area inset
          paddingBottom: Math.max(insets.bottom, 8), // Minimum 8px, or safe area
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
  );
};

interface Styles {
  container: ViewStyle;
  tabNavContainer: ViewStyle;
  tabItem: ViewStyle;
  tabContainer: ViewStyle;
  tabIcon: ImageStyle;
  tabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8, // Industry standard padding
    // Removed shadow & elevation for cleaner look
  },
  tabNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    height: 56, // Industry standard tab bar height
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 24, // Slightly smaller for better proportions
    height: 24,
    resizeMode: 'contain',
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 4, // Reduced margin for better spacing
  },
});

export default BottomTabNavigator;