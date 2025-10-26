// components/AddressCopied.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Typography } from '../constants/Typography';

type AddressCopiedProps = {
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
  label?: string; // optional override, defaults to "Copied"
};

const AddressCopied: React.FC<AddressCopiedProps> = ({
  onDismiss,
  autoHide = true,
  duration = 1800,
  dismissible = true,
  label = 'Copied',
}) => {
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleDismiss = (): void => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -90, duration: 225, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 225, useNativeDriver: true }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    if (autoHide) {
      const t = setTimeout(handleDismiss, duration);
      return () => clearTimeout(t);
    }
  }, [autoHide, duration]);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents="box-none"
    >
      <TouchableWithoutFeedback onPress={dismissible ? handleDismiss : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Copied</Text>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const GREEN = {
  text: '#059669',   // emerald-600
  border: '#10B981', // emerald-500
  bg: '#ECFDF5',     // emerald-50
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 1000,
    paddingTop: 54,
    paddingHorizontal: 14,
  },
  content: {
    backgroundColor: GREEN.bg,
    borderLeftColor: GREEN.border,
    borderLeftWidth: 3.6,
    borderRadius: 11,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 54,
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3.6 },
    shadowOpacity: 0.135,
    shadowRadius: 10.8,
    elevation: 7.2,
    borderWidth: 0.9,
    borderColor: 'rgba(0,0,0,0.054)',
  },
  title: {
    color: GREEN.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});

export default AddressCopied;
