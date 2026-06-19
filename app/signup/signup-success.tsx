import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';

export default function VerificationSuccessScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to PIN setup or home screen
    router.push('/login/login-phone');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Custom Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={require('../../assets/images/Signup-success.png')}
              style={styles.customIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Signup Successful</Text>
          <Text style={styles.subtitle}>
            Your account has been successfully created.{'\n'}
            Tap Continue to log in.
          </Text>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xxl,
  },
  iconContainer: {
    marginBottom: Layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIcon: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  subtitle: {
    ...Typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  continueButtonText: {
    ...Typography.styles.bodyMedium,
    color: colors.card,
  },
});