import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  StatusBar
} from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { authService } from '../../services/authService';

const bellIcon = require('../../components/icons/bell-icon.png');
const activityIcon = require('../../components/icons/activity-icon.png');

interface DashboardHeaderProps {
  onNotificationPress?: () => void;
  onActivityPress?: () => void;
  /** When false, username greeting is hidden (e.g. on wallet screen). */
  showUsername?: boolean;
  /** When false, activity/history icon is hidden. */
  showActivityIcon?: boolean;
  /** When false, notification bell icon is hidden. */
  showNotificationIcon?: boolean;
  /** Optional centered title (e.g. "Wallet") when no username/icons. */
  title?: string;
}

export default function DashboardHeader({
  onNotificationPress,
  onActivityPress,
  showUsername = true,
  showActivityIcon = true,
  showNotificationIcon = true,
  title,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    if (showUsername) loadUsername();
  }, [showUsername]);

  const loadUsername = async () => {
    try {
      const savedUsername = await authService.getSavedUsername();
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.log('❌ Error loading username for header:', error);
    }
  };

  const handleActivityPress = () => {
    router.push('/user/generalhistory');
  };

  const handleNotificationPress = () => {
    router.push('/user/notificationpage');
  };

  const showIcons = showActivityIcon || showNotificationIcon;

  return (
    <>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          {title ? (
            <Text style={styles.headerTitle}>{title}</Text>
          ) : showUsername && username ? (
            <Text style={styles.greetingText}>
              Hi, {username} 👋
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        
        {showIcons && (
          <View style={styles.iconsContainer}>
            {showActivityIcon && (
              <TouchableOpacity style={styles.iconButton} onPress={handleActivityPress}>
                <Image source={activityIcon} style={styles.activityIcon} />
              </TouchableOpacity>
            )}
            {showNotificationIcon && (
              <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
                <Image source={bellIcon} style={styles.bellIcon} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg + Layout.spacing.sm, // Added extra top padding for industry standard spacing
    backgroundColor: Colors.background,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    opacity: 0.8,
  },
  headerTitle: {
    fontFamily: Typography.medium,
    fontSize: 18,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  bellIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});