import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import BackButton from './BackButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backDisabled?: boolean;
  rightComponent?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backDisabled = false,
  rightComponent
}: ScreenHeaderProps) {
  return (
    <View style={styles.headerSection}>
      <View style={styles.headerContainer}>
        <BackButton onPress={onBack} disabled={backDisabled} />

        <View style={styles.headerGroup}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerRight}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
