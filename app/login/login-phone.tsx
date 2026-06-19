import { useRouter } from 'expo-router';
import { useState , useMemo} from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+234');
  const [selectedFlag, setSelectedFlag] = useState('🇳🇬');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

  const countryCodeOptions = [
    { code: '+234', country: '🇳🇬', name: 'Nigeria' },
    { code: '+27', country: '🇿🇦', name: 'South Africa' },
    { code: '+233', country: '🇬🇭', name: 'Ghana' },
    { code: '+254', country: '🇰🇪', name: 'Kenya' },
    { code: '+20', country: '🇪🇬', name: 'Egypt' },
    { code: '+212', country: '🇲🇦', name: 'Morocco' },
    { code: '+216', country: '🇹🇳', name: 'Tunisia' },
    { code: '+213', country: '🇩🇿', name: 'Algeria' },
    { code: '+251', country: '🇪🇹', name: 'Ethiopia' },
    { code: '+256', country: '🇺🇬', name: 'Uganda' },
    { code: '+255', country: '🇹🇿', name: 'Tanzania' },
  ];

  // Check if phone number is valid
  const isFormValid = phoneNumber.trim().length >= 10;

  const handleContinue = () => {
    if (isFormValid) {
      // 🔥 ONLY CHANGE: Pass phone number to next screen
      const fullPhoneNumber = countryCode + phoneNumber;
      router.push({
        pathname: '/login/login-pin2',
        params: { phonenumber: fullPhoneNumber }
      });
    }
  };

  const handleCreateAccount = () => {
    router.push('/signup/signupI');
  };

  const selectCountryCode = (option: { code: string, country: string, name: string }) => {
    setCountryCode(option.code);
    setSelectedFlag(option.country);
    setShowCountryCodeDropdown(false);
  };

  const closeDropdown = () => {
    setShowCountryCodeDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.content} onPress={closeDropdown}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Enter your phone number to continue</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCodeContainer}>
                    <TouchableOpacity 
                      style={styles.countryCodeButton}
                      onPress={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                    >
                      <Text style={styles.flagText}>{selectedFlag}</Text>
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                      <Text style={styles.countryCodeArrow}>▼</Text>
                    </TouchableOpacity>
                    
                    {showCountryCodeDropdown && (
                      <View style={styles.countryCodeDropdown}>
                        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                          {countryCodeOptions.map((option, index) => (
                            <TouchableOpacity
                              key={`${option.code}-${index}`}
                              style={[styles.dropdownOption, index === countryCodeOptions.length - 1 && styles.lastDropdownOption]}
                              onPress={() => selectCountryCode(option)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.flagEmoji}>{option.country}</Text>
                              <Text style={styles.dropdownOptionText}>{option.name} ({option.code})</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.textMuted}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    onFocus={closeDropdown}
                  />
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  isFormValid ? styles.activeButton : styles.inactiveButton
                ]} 
                onPress={handleContinue}
                disabled={!isFormValid}
              >
                <Text style={[
                  styles.continueButtonText,
                  isFormValid ? styles.activeButtonText : styles.inactiveButtonText
                ]}>
                  Continue
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleCreateAccount}>
                <Text style={styles.createAccountText}>
                  I am new here. <Text style={styles.createAccountLink}>Create my account!</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStartedBorder = {
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: Layout.borderRadius.lg,
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Layout.spacing.xxl,
    marginBottom: Layout.spacing.xxl,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
    marginBottom: Layout.spacing.lg, // Reduced from xxl to lg
  },
  inputContainer: {
    gap: Layout.spacing.xs,
    position: 'relative',
  },
  label: {
    ...Typography.styles.bodyMedium,
    color: colors.text,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    alignItems: 'flex-start',
  },
  countryCodeContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  countryCodeButton: {
    ...getStartedBorder,
    backgroundColor: colors.card,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    minWidth: 100,
  },
  flagText: {
    fontSize: 16,
  },
  countryCodeText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: colors.text,
  },
  countryCodeArrow: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  phoneInput: {
    ...getStartedBorder,
    flex: 1,
    backgroundColor: colors.card,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontFamily: Typography.regular,
    fontSize: 16,
    color: colors.text,
  },
  countryCodeDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2000,
    maxHeight: 180,
    width: 200,
  },
  dropdownScrollView: {
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontFamily: Typography.regular,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: Layout.spacing.xs,
  },
  buttonContainer: {
    paddingBottom: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  continueButton: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inactiveButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  continueButtonText: {
    ...Typography.styles.bodyMedium,
  },
  activeButtonText: {
    color: colors.card,
  },
  inactiveButtonText: {
    color: colors.textSecondary,
  },
  createAccountText: {
    ...Typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createAccountLink: {
    color: colors.primary,
    fontFamily: Typography.medium,
  },
});