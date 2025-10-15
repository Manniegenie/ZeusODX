import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  type?: 'center' | 'bottom';
  avoidKeyboard?: boolean;
  disableBackdropPress?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  children,
  type = 'center',
  avoidKeyboard = true,
  disableBackdropPress = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      if (type === 'center') {
        scaleAnim.setValue(0);
      } else {
        slideAnim.setValue(SCREEN_HEIGHT);
      }
      fadeAnim.setValue(0);

      // Animate in
      Animated.parallel([
        type === 'center'
          ? Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            })
          : Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        type === 'center'
          ? Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type, scaleAnim, slideAnim, fadeAnim]);

  const handleBackdropPress = () => {
    if (!disableBackdropPress) {
      onClose();
    }
  };

  const modalContent = (
    <Animated.View
      style={[
        styles.modalContainer,
        type === 'center' ? styles.centerModal : styles.bottomModal,
        type === 'center'
          ? {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          : {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            {avoidKeyboard ? (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={type === 'center' ? styles.centerContainer : styles.bottomContainer}
              >
                {modalContent}
              </KeyboardAvoidingView>
            ) : (
              modalContent
            )}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalContainer: {
    backgroundColor: Colors.surface || '#FFFFFF',
    width: '90%',
    maxWidth: 400,
    borderRadius: Layout.borderRadius?.xl || 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  centerModal: {
    margin: 20,
  },
  bottomModal: {
    width: '100%',
    borderTopLeftRadius: Layout.borderRadius?.xl || 16,
    borderTopRightRadius: Layout.borderRadius?.xl || 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Account for iOS home indicator
  },
});

export default BaseModal;
