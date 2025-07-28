import React, { useState, useEffect } from 'react';
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
  onNotificationPress: () => void;
  onActivityPress?: () => void;
}

export default function DashboardHeader({ 
  onNotificationPress,
  onActivityPress
}: DashboardHeaderProps) {
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
    onActivityPress?.();
  };

  return (
    <>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          {username ? (
            <Text style={styles.greetingText}>
              Hi, {username} 👋
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        
        <View style={styles.iconsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleActivityPress}>
            <Image source={activityIcon} style={styles.activityIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <Image source={bellIcon} style={styles.bellIcon} />
          </TouchableOpacity>
        </View>
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