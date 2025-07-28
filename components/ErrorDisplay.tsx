import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

interface ErrorAction {
  title: string;
  message: string;
  actionText: string;
  route?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ErrorDisplayProps {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  onDismiss?: () => void;
  showIcon?: boolean;
  autoHide?: boolean;
  duration?: number;
  // Enhanced props for structured errors
  errorAction?: ErrorAction;
  onActionPress?: () => void;
  dismissible?: boolean;
}

interface ErrorContent {
  icon: string;
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
  showIcon = true,
  autoHide = true,
  duration = 4000,
  // Enhanced props for structured errors
  errorAction,
  onActionPress,
  dismissible = true
}) => {
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Get default content based on error type
  const getErrorContent = (): ErrorContent => {
    switch (type) {
      case 'network':
        return {
          icon: '📡',
          defaultTitle: 'No Connection',
          defaultMessage: 'Check your internet connection and try again',
          color: '#EF4444',
          bgColor: '#FEF2F2'
        };
      case 'validation':
        return {
          icon: '⚠️',
          defaultTitle: 'Invalid Input',
          defaultMessage: 'Please check your information and try again',
          color: '#35297F',
          bgColor: '#F8F7FF'
        };
      case 'auth':
        return {
          icon: '🔐',
          defaultTitle: 'Authentication Error',
          defaultMessage: 'Please check your credentials and try again',
          color: '#EF4444',
          bgColor: '#FEF2F2'
        };
      case 'server':
        return {
          icon: '⚡',
          defaultTitle: 'Server Error',
          defaultMessage: 'Something went wrong on our end. Please try again',
          color: '#EF4444',
          bgColor: '#FEF2F2'
        };
      case 'setup':
        return {
          icon: '⚙️',
          defaultTitle: 'Setup Required',
          defaultMessage: 'Please complete your account setup to continue',
          color: '#35297F',
          bgColor: '#F8F7FF'
        };
      case 'limit':
        return {
          icon: '📊',
          defaultTitle: 'Limit Exceeded',
          defaultMessage: 'This transaction exceeds your account limits',
          color: '#F59E0B',
          bgColor: '#FFFBEB'
        };
      case 'balance':
        return {
          icon: '💰',
          defaultTitle: 'Insufficient Balance',
          defaultMessage: 'You don\'t have enough funds for this transaction',
          color: '#EF4444',
          bgColor: '#FEF2F2'
        };
      case 'notFound':
        return {
          icon: '🔍',
          defaultTitle: 'Not Found',
          defaultMessage: 'The requested information could not be found',
          color: '#6B7280',
          bgColor: '#F9FAFB'
        };
      default:
        return {
          icon: '❌',
          defaultTitle: 'Error',
          defaultMessage: 'Something went wrong. Please try again',
          color: '#35297F',
          bgColor: '#F8F7FF'
        };
    }
  };

  const errorContent: ErrorContent = getErrorContent();
  const displayTitle: string = title || (errorAction && errorAction.title) || errorContent.defaultTitle;
  const displayMessage: string = message || (errorAction && errorAction.message) || errorContent.defaultMessage;
  const hasAction: boolean = !!(errorAction || onActionPress);

  const handleDismiss = (): void => {
    if (!dismissible) return;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -90,
        duration: 225,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 225,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  const handleActionPress = (): void => {
    if (onActionPress) {
      onActionPress();
    } else if (errorAction && errorAction.route) {
      router.push(errorAction.route);
    }
    
    // Auto dismiss after action
    if (dismissible) {
      handleDismiss();
    }
  };

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration (longer for actionable errors)
    if (autoHide && !hasAction) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hasAction, duration]);

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
      <View 
        style={[
          styles.content,
          { 
            backgroundColor: errorContent.bgColor,
            borderLeftColor: errorContent.color,
            borderLeftWidth: 3.6
          }
        ]}
      >
        {showIcon && (
          <Text style={styles.icon}>
            {errorContent.icon}
          </Text>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: errorContent.color }]} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {displayMessage}
          </Text>

          {/* Action Button for actionable errors */}
          {hasAction && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: errorContent.color }]}
              onPress={handleActionPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {(errorAction && errorAction.actionText) || 'Take Action'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dismiss button (only if dismissible) */}
        {dismissible && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
          >
            <Text style={styles.dismissIcon}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 54, // Reduced by 10% from 60
    paddingHorizontal: 14, // Reduced by 10% from 16
  },
  content: {
    borderRadius: 11, // Reduced by 10% from 12
    paddingVertical: 14, // Reduced by 10% from 16
    paddingHorizontal: 14, // Reduced by 10% from 16
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3.6 }, // Reduced by 10%
    shadowOpacity: 0.135, // Reduced by 10%
    shadowRadius: 10.8, // Reduced by 10%
    elevation: 7.2, // Reduced by 10%
    borderWidth: 0.9, // Reduced by 10%
    borderColor: 'rgba(0,0,0,0.054)', // Reduced opacity by 10%
    minHeight: 54, // Reduced by 10% from 60
  },
  icon: {
    fontSize: 18, // Reduced by 10% from 20
    marginRight: 7, // Reduced by 10% from 8
    marginTop: 1.8, // Reduced by 10%
  },
  textContainer: {
    flex: 1,
    marginRight: 7, // Reduced by 10% from 8
  },
  title: {
    fontFamily: Typography.medium || 'System',
    fontSize: 14, // Reduced by 10% from 15
    fontWeight: '600',
    lineHeight: 18, // Reduced by 10% from 20
    marginBottom: 1.8, // Reduced by 10%
  },
  message: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12, // Reduced by 10% from 13
    color: Colors.text?.secondary || '#6B7280',
    lineHeight: 16, // Reduced by 10% from 18
  },
  actionButton: {
    paddingHorizontal: 14, // Reduced by 10% from 16
    paddingVertical: 7, // Reduced by 10% from 8
    borderRadius: 5.4, // Reduced by 10% from 6
    marginTop: 9, // Reduced by 10% from 10
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 12, // Reduced by 10% from 13
    fontWeight: '600',
  },
  dismissButton: {
    width: 25, // Reduced by 10% from 28
    height: 25, // Reduced by 10% from 28
    borderRadius: 12.5, // Reduced by 10% from 14
    backgroundColor: 'rgba(0,0,0,0.09)', // Reduced opacity by 10%
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1.8, // Reduced by 10%
  },
  dismissIcon: {
    fontSize: 16, // Reduced by 10% from 18
    color: Colors.text?.secondary || '#6B7280',
    fontWeight: '500',
    lineHeight: 16, // Reduced by 10% from 18
  },
});

export default ErrorDisplay;