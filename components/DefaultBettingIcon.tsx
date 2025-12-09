import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  name?: string;
  size?: number;
}

const DefaultBettingIcon: React.FC<Props> = ({ name = '', size = 40 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.text}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#6B7280',
    fontWeight: '700',
  },
});

export default DefaultBettingIcon;

