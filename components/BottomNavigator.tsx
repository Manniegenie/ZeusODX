import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Image, Text, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

// Tab icon imports
const homeIcon = require('../components/icons/home-icon.png');
const tradeIcon = require('../components/icons/trade-icon.png');
const giftcardIcon = require('../components/icons/giftcard-icon.png');
const activityIcon = require('../components/icons/activity-icon.png');
const profileIcon = require('../components/icons/profile-icon.png');

// Tab definition
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
  const iconBgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const iconColorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelColorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(iconBgAnim, { toValue: isActive ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    Animated.timing(iconColorAnim, { toValue: isActive ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    Animated.timing(labelColorAnim, { toValue: isActive ? 1 : 0, duration: 300, useNativeDriver: false }).start();

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

  const iconBackgroundColor = iconBgAnim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', Colors.primary] });
  const iconTintColor = iconColorAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.text.secondary, Colors.surface] });
  const labelColor = labelColorAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.text.secondary, Colors.primary] });
  const iconScale = iconBgAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[styles.tabContainer, { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }]}>        
        <Animated.View
          style={[
            styles.tabIconContainer,
            { backgroundColor: iconBackgroundColor, transform: [{ scale: iconScale }] },
          ]}
        >
          <Animated.Image source={tab.icon} style={[styles.tabIcon, { tintColor: iconTintColor }]} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.tabLabel,
            { color: labelColor, fontFamily: isActive ? Typography.medium : Typography.regular },
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
    { id: 'home', label: 'Home', icon: homeIcon, route: '../user/dashboard' },
    { id: 'giftcard', label: 'Giftcard', icon: giftcardIcon, route: '/user/come-soon' },
    { id: 'swap', label: 'Buy/Sell', icon: tradeIcon, route: '../user/Swap' },
    { id: 'activity', label: 'Activity', icon: activityIcon, route: '/user/come-soon' },
    { id: 'profile', label: 'Profile', icon: profileIcon, route: '/user/come-soon' },
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

  useEffect(() => {
    const entranceY = new Animated.Value(50);
    const opacity = new Animated.Value(0);
    Animated.parallel([
      Animated.timing(entranceY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const slideTransform = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  // Use full bottom inset for background cover and slightly push down
  const bottomInset = insets.bottom;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideTransform }],
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
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
  tabIconContainer: ViewStyle;
  tabIcon: ImageStyle;
  tabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default BottomTabNavigator;
