import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { authService } from './authService';

export const simpleAppState = {
  // Storage keys
  ONBOARDING_KEY: 'onboarding_completed',
  PHONE_NUMBER_KEY: 'saved_phone_number',
  USERNAME_KEY: 'saved_username',

  // Check if onboarding is completed
  async isOnboardingCompleted() {
    try {
      const completed = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.log('❌ Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as completed
  async markOnboardingCompleted() {
    try {
      await AsyncStorage.setItem(this.ONBOARDING_KEY, 'true');
      console.log('✅ Onboarding marked as completed');
      return { success: true };
    } catch (error) {
      console.log('❌ Error marking onboarding completed:', error);
      return { success: false, error: error.message };
    }
  },

  // Save phone number after first entry
  async savePhoneNumber(phoneNumber) {
    try {
      await AsyncStorage.setItem(this.PHONE_NUMBER_KEY, phoneNumber);
      console.log('📱 Phone number saved:', phoneNumber);
      return { success: true };
    } catch (error) {
      console.log('❌ Error saving phone number:', error);
      return { success: false, error: error.message };
    }
  },

  // Get saved phone number
  async getSavedPhoneNumber() {
    try {
      const phoneNumber = await AsyncStorage.getItem(this.PHONE_NUMBER_KEY);
      return phoneNumber;
    } catch (error) {
      console.log('❌ Error getting saved phone number:', error);
      return null;
    }
  },

  // Check if phone number is saved
  async hasPhoneNumber() {
    const phoneNumber = await this.getSavedPhoneNumber();
    return !!phoneNumber;
  },

  // Save username
  async saveUsername(username) {
    try {
      await AsyncStorage.setItem(this.USERNAME_KEY, username);
      console.log('👤 Username saved:', username);
      return { success: true };
    } catch (error) {
      console.log('❌ Error saving username:', error);
      return { success: false, error: error.message };
    }
  },

  // Get saved username
  async getSavedUsername() {
    try {
      const username = await AsyncStorage.getItem(this.USERNAME_KEY);
      return username;
    } catch (error) {
      console.log('❌ Error getting saved username:', error);
      return null;
    }
  },

  // Check if username is saved
  async hasUsername() {
    const username = await this.getSavedUsername();
    return !!username;
  },

  // Determine which screen to show on app start
  async getInitialScreen() {
    console.log('🚀 Determining initial screen...');
    
    const onboardingCompleted = await this.isOnboardingCompleted();
    const hasPhone = await this.hasPhoneNumber();
    
    console.log('📊 App State:', { onboardingCompleted, hasPhone });
    
    if (!onboardingCompleted) {
      console.log('🎯 Route: Onboarding (not completed)');
      return 'onboarding';
    }
    
    if (!hasPhone) {
      console.log('🎯 Route: Phone Entry (no saved phone)');
      return 'phone-entry';
    }
    
    console.log('🎯 Route: PIN Entry (has saved phone)');
    return 'pin-entry';
  },

  // Reset everything (for testing/logout)
  async resetAppState() {
    try {
      console.log('🧹 Starting app state reset...');
      
      // Clear secure tokens using proper methods
      try {
        await apiClient.clearAuthToken();
        console.log('✅ Auth token cleared from SecureStore');
      } catch (error) {
        console.log('⚠️ Error clearing auth token:', error);
      }
      
      try {
        await authService.clearRefreshToken();
        console.log('✅ Refresh token cleared from SecureStore');
      } catch (error) {
        console.log('⚠️ Error clearing refresh token:', error);
      }
      
      // Clear non-sensitive data from AsyncStorage
      await AsyncStorage.multiRemove([
        this.ONBOARDING_KEY,
        this.PHONE_NUMBER_KEY,
        this.USERNAME_KEY,
        'user_data',
        'portfolio_data'
      ]);
      
      console.log('🧹 App state reset successfully');
      return { success: true };
    } catch (error) {
      console.log('❌ Error resetting app state:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current app status (for debugging)
  async getAppStatus() {
    const onboardingCompleted = await this.isOnboardingCompleted();
    const savedPhone = await this.getSavedPhoneNumber();
    const savedUsername = await this.getSavedUsername();
    const hasPhone = !!savedPhone;
    const hasUsername = !!savedUsername;
    const initialScreen = await this.getInitialScreen();
    
    // Check if user is authenticated (from secure storage)
    const isAuthenticated = await authService.isAuthenticated();
    
    return {
      onboardingCompleted,
      hasPhoneNumber: hasPhone,
      hasUsername: hasUsername,
      savedPhoneNumber: savedPhone ? `***${savedPhone.slice(-4)}` : null, // Masked for security
      savedUsername: savedUsername,
      initialScreen,
      isAuthenticated
    };
  }
};