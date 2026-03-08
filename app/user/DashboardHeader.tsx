import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { authService } from '../../services/authService';

const bellIcon = require('../../components/icons/bell-icon.png');
const activityIcon = require('../../components/icons/activity-icon.png');

interface DashboardHeaderProps {
  onNotificationPress?: () => void;
  onActivityPress?: () => void;
  /** Hide "Hi, username" greeting (e.g. on wallet page) */
  showGreeting?: boolean;
  /** Hide activity/history icon */
  showActivityIcon?: boolean;
  /** Hide notification bell icon */
  showNotificationIcon?: boolean;
}

export default function DashboardHeader({ 
  onNotificationPress,
  onActivityPress,
  showGreeting = true,
  showActivityIcon = true,
  showNotificationIcon = true,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    loadUsername();
  }, []);

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

  return (
    <>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        {showGreeting && (
          <View style={styles.greetingContainer}>
            {username ? (
              <Text style={styles.greetingText}>
                Hi, {username} 👋
              </Text>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        )}
        
        {(showActivityIcon || showNotificationIcon) && (
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