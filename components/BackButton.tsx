import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

// Import back icon
import backIcon from './icons/backy.png';

interface BackButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

export default function BackButton({ onPress, disabled = false, style }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
      delayPressIn={0}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Image source={backIcon} style={styles.backIcon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
