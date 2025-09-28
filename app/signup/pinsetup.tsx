import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Vibration } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SetupPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const PIN_LENGTH = 6;

  const handleNumberPress = (number: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin(pin + number);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleContinue = () => {
    if (pin.length === PIN_LENGTH) {
      // Store PIN and navigate to confirm screen
      router.push({ pathname: '/signup/pinconfirm', params: { setupPin: pin } });
    } else {
      // Vibrate if PIN incomplete
      Vibration.vibrate(100);
    }
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length && styles.filledDot
          ]}
        />
      );
    }
    return dots;
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫']
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((number, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.numberButton,
              number === '' && styles.emptyButton
            ]}
            onPress={() => {
              if (number === '⌫') {
                handleBackspace();
              } else if (number !== '') {
                handleNumberPress(number);
              }
            }}
            disabled={number === ''}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.numberText,
              number === '⌫' && styles.backspaceText
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set up your PIN</Text>
          <Text style={styles.subtitle}>Please set up your security PIN</Text>
        </View>

        {/* PIN Display */}
        <View style={styles.pinContainer}>
          <View style={styles.pinDots}>
            {renderPinDots()}
          </View>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {renderNumberPad()}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              pin.length === PIN_LENGTH ? styles.activeButton : styles.inactiveButton
            ]} 
            onPress={handleContinue}
          >
            <Text style={[
              styles.continueButtonText,
              pin.length === PIN_LENGTH ? styles.activeButtonText : styles.inactiveButtonText
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    paddingTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xxl,
  },
  pinDots: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  filledDot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.xl,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 8, // Changed from 35 to 8 for box corners
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyButton: {
    borderColor: 'transparent',
  },
  numberText: {
    fontSize: 24,
    fontFamily: Typography.medium,
    color: Colors.text.primary,
  },
  backspaceText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  continueButton: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  inactiveButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  continueButtonText: {
    ...Typography.styles.bodyMedium,
  },
  activeButtonText: {
    color: Colors.surface,
  },
  inactiveButtonText: {
    color: Colors.text.secondary,
  },
});