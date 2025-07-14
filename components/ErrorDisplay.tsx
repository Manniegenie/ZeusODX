import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

interface ErrorDisplayProps {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general';
  title?: string;
  message?: string;
  onDismiss?: () => void;
  showIcon?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export default function ErrorDisplay({
  type = 'general',
  title,
  message,
  onDismiss,
  showIcon = true,
  autoHide = true,
  duration = 2000
}: ErrorDisplayProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Get default content based on error type
  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: '📡',
          defaultTitle: 'No Connection',
          defaultMessage: 'Check your internet connection',
        };
      case 'validation':
        return {
          icon: '⚠️',
          defaultTitle: 'Invalid Input',
          defaultMessage: 'Please check your information',
        };
      case 'auth':
        return {
          icon: '🔐',
          defaultTitle: 'Incorrect PIN',
          defaultMessage: 'Please try again',
        };
      case 'server':
        return {
          icon: '⚡',
          defaultTitle: 'Server Error',
          defaultMessage: 'Something went wrong',
        };
      case 'notFound':
        return {
          icon: '🔍',
          defaultTitle: 'Not Found',
          defaultMessage: 'Information not found',
        };
      default:
        return {
          icon: '❌',
          defaultTitle: 'Error',
          defaultMessage: 'Something went wrong',
        };
    }
  };

  const errorContent = getErrorContent();
  const displayTitle = title || errorContent.defaultTitle;
  const displayMessage = message || errorContent.defaultMessage;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        {showIcon && (
          <Text style={styles.icon}>
            {errorContent.icon}
          </Text>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          {message && (
            <Text style={styles.message} numberOfLines={1}>
              {displayMessage}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissIcon}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50, // Account for status bar
    paddingHorizontal: Layout.spacing.md,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  icon: {
    fontSize: 16,
    marginRight: Layout.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  title: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  message: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginTop: 1,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
    lineHeight: 16,
  },
});