import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';

interface ErrorDisplayProps {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

interface ErrorContent {
  defaultTitle: string;
  defaultMessage: string;
  color: string;
  bgColor: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'general',
  title,
  message,
  onDismiss,
  autoHide = true,
  duration = 4000,
  dismissible = true,
}) => {
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const getErrorContent = (): ErrorContent => {
    switch (type) {
      case 'network':
        return { defaultTitle: 'No Connection', defaultMessage: 'Check your internet connection and try again', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'validation':
        return { defaultTitle: 'Invalid Input', defaultMessage: 'Please check your information and try again', color: '#35297F', bgColor: '#F8F7FF' };
      case 'auth':
        return { defaultTitle: 'Authentication Error', defaultMessage: 'Please check your credentials and try again', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'server':
        return { defaultTitle: 'Server Error', defaultMessage: 'Something went wrong on our end. Please try again', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'setup':
        return { defaultTitle: 'Setup Required', defaultMessage: 'Please complete your account setup to continue', color: '#35297F', bgColor: '#F8F7FF' };
      case 'limit':
        return { defaultTitle: 'Limit Exceeded', defaultMessage: 'This transaction exceeds your account limits', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'balance':
        return { defaultTitle: 'Insufficient Balance', defaultMessage: "You don't have enough funds for this transaction", color: '#EF4444', bgColor: '#FEF2F2' };
      case 'notFound':
        return { defaultTitle: 'Not Found', defaultMessage: 'The requested information could not be found', color: '#6B7280', bgColor: '#F9FAFB' };
      default:
        return { defaultTitle: 'Error', defaultMessage: 'Something went wrong. Please try again', color: '#35297F', bgColor: '#F8F7FF' };
    }
  };

  const errorContent = getErrorContent();
  const displayTitle = title || errorContent.defaultTitle;
  const displayMessage = message || errorContent.defaultMessage;

  const handleDismiss = (): void => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -90, duration: 225, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 225, useNativeDriver: true }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();

    // Auto hide
    if (autoHide) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
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
        <View
          style={[
            styles.content,
            { backgroundColor: errorContent.bgColor, borderLeftColor: errorContent.color, borderLeftWidth: 3.6 },
          ]}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: errorContent.color }]} numberOfLines={2}>
              {displayTitle}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {displayMessage}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
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
    borderRadius: 11,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3.6 },
    shadowOpacity: 0.135,
    shadowRadius: 10.8,
    elevation: 7.2,
    borderWidth: 0.9,
    borderColor: 'rgba(0,0,0,0.054)',
    minHeight: 54,
  },
  textContainer: { flex: 1 },
  title: {
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  message: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    color: Colors.text?.secondary || '#6B7280',
    lineHeight: 16,
  },
});

export default ErrorDisplay;
