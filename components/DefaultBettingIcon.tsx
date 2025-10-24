import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface DefaultBettingIconProps {
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

const DefaultBettingIcon: React.FC<DefaultBettingIconProps> = ({
  name,
  size = 40,
  backgroundColor = Colors.primary,
  textColor = Colors.white
}) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor
      }
    ]}>
      <Text style={[
        styles.text,
        {
          fontSize: size * 0.4,
          color: textColor
        }
      ]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DefaultBettingIcon;
