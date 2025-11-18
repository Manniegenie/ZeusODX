import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './apiClient';
import NotificationService from './notificationService';

export const authService = {
  // Storage keys
  PHONE_NUMBER_KEY: 'saved_phone_number',
  USERNAME_KEY: 'saved_username',
  REFRESH_TOKEN_KEY: 'refresh_token',
  BIOMETRIC_PIN_KEY: 'biometric_pin', // Store PIN for biometric unlock

  // Save phone number to AsyncStorage (non-sensitive convenience data)
  async savePhoneNumber(phoneNumber) {
    try {
      await AsyncStorage.setItem(this.PHONE_NUMBER_KEY, phoneNumber);
      console.log('📱 Phone number saved by authService:', phoneNumber);
      return { success: true };
    } catch (error) {
      console.log('❌ Error saving phone number:', error);
      return { success: false, error: error.message };
    }
  },

  // Get saved phone number from AsyncStorage
  async getSavedPhoneNumber() {
    try {
      const phoneNumber = await AsyncStorage.getItem(this.PHONE_NUMBER_KEY);
      return phoneNumber;
    } catch (error) {
      console.log('❌ Error getting saved phone number:', error);
      return null;
    }
  },

  // Save username to AsyncStorage (non-sensitive convenience data)
  async saveUsername(username) {
    try {
      await AsyncStorage.setItem(this.USERNAME_KEY, username);
      console.log('👤 Username saved by authService:', username);
      return { success: true };
    } catch (error) {
      console.log('❌ Error saving username:', error);
      return { success: false, error: error.message };
    }
  },

  // Get saved username from AsyncStorage
  async getSavedUsername() {
    try {
      const username = await AsyncStorage.getItem(this.USERNAME_KEY);
      return username;
    } catch (error) {
      console.log('❌ Error getting saved username:', error);
      return null;
    }
  },

  // Store refresh token securely
  async setRefreshToken(refreshToken) {
    try {
      await apiClient.setRefreshToken(refreshToken);
      console.log('✅ Refresh token stored securely');
    } catch (error) {
      console.error('❌ Error storing refresh token:', error);
      throw error;
    }
  },

  // Get refresh token securely
  async getRefreshToken() {
    try {
      const refreshToken = await apiClient.getRefreshToken();
      return refreshToken;
    } catch (error) {
      console.error('❌ Error getting refresh token:', error);
      return null;
    }
  },

  // Clear refresh token securely
  async clearRefreshToken() {
    try {
      await apiClient.clearRefreshToken();
      console.log('✅ Refresh token cleared from SecureStore');
    } catch (error) {
      console.error('❌ Error clearing refresh token:', error);
      throw error;
    }
  },

  // NEW: Store PIN securely for biometric unlock
  async savePinForBiometric(pin) {
    try {
      await SecureStore.setItemAsync(this.BIOMETRIC_PIN_KEY, pin);
      console.log('✅ PIN stored securely for biometric unlock');
      return { success: true };
    } catch (error) {
      console.error('❌ Error storing PIN for biometric:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Retrieve PIN for biometric unlock
  async getPinForBiometric() {
    try {
      const pin = await SecureStore.getItemAsync(this.BIOMETRIC_PIN_KEY);
      return pin;
    } catch (error) {
      console.error('❌ Error retrieving PIN for biometric:', error);
      return null;
    }
  },

  // NEW: Clear stored PIN (e.g., on logout or when user disables biometric)
  async clearBiometricPin() {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_PIN_KEY);
      console.log('✅ Biometric PIN cleared');
    } catch (error) {
      console.error('❌ Error clearing biometric PIN:', error);
    }
  },

  // NEW: Check if PIN is stored for biometric unlock
  async hasBiometricPin() {
    try {
      const pin = await SecureStore.getItemAsync(this.BIOMETRIC_PIN_KEY);
      return !!pin;
    } catch (error) {
      return false;
    }
  },

  async login(credentials) {
    // Use saved phone number if none provided
    let phoneNumber = credentials.phonenumber;
    
    if (!phoneNumber) {
      console.log('📱 No phone number provided, checking saved phone number...');
      phoneNumber = await this.getSavedPhoneNumber();
      
      if (!phoneNumber) {
        console.log('❌ No phone number provided and none saved');
        return { 
          success: false, 
          error: 'Phone number is required for login' 
        };
      }
      
      console.log('✅ Using saved phone number for login');
    }

    console.log('🔐 Attempting login for:', phoneNumber);
    
    const response = await apiClient.post('/signin/signin-pin', {
      phonenumber: phoneNumber,
      passwordpin: credentials.passwordpin
    });
    
    if (response.success && response.data) {
      console.log('✅ Login successful, storing tokens and data');
      
      // Save phone number for future use
      await this.savePhoneNumber(phoneNumber);
      
      // Save username if available
      if (response.data.user && response.data.user.username) {
        await this.saveUsername(response.data.user.username);
      }
      
      // Store access token securely using apiClient
      if (response.data.accessToken) {
        await apiClient.setAuthToken(response.data.accessToken);
      }
      
      // Store refresh token securely
      if (response.data.refreshToken) {
        await this.setRefreshToken(response.data.refreshToken);
      }
      
      // NEW: Store PIN for biometric unlock if provided
      if (credentials.passwordpin && credentials.enableBiometric !== false) {
        await this.savePinForBiometric(credentials.passwordpin);
      }
      
      // Store user data in AsyncStorage (non-sensitive)
      if (response.data.user) {
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
        if (response.data.user._id) {
          await apiClient.setUserId(response.data.user._id.toString());
        }
      }
      
      // Store portfolio data in AsyncStorage (non-sensitive)
      if (response.data.portfolio) {
        await AsyncStorage.setItem('portfolio_data', JSON.stringify(response.data.portfolio));
      }
    } else {
      console.log('❌ Login failed:', response.error);
    }
    
    return response;
  },

  async register(userData) {
    console.log('📝 Attempting registration for:', userData.phonenumber);
    const response = await apiClient.post('/auth/register', userData);
    
    if (response.success && response.data) {
      console.log('✅ Registration successful, storing tokens');
      
      // Save phone number for future use
      if (userData.phonenumber) {
        await this.savePhoneNumber(userData.phonenumber);
      }
      
      // Save username if available
      if (response.data.user && response.data.user.username) {
        await this.saveUsername(response.data.user.username);
      }
      
      if (response.data.user && response.data.user._id) {
        await apiClient.setUserId(response.data.user._id.toString());
      }
      
      // Store access token securely using apiClient
      if (response.data.accessToken) {
        await apiClient.setAuthToken(response.data.accessToken);
      }

      // Store refresh token securely
      if (response.data.refreshToken) {
        await this.setRefreshToken(response.data.refreshToken);
      }
    }
    
    return response;
  },

  async logout() {
    console.log('🚪 Logging out user');
    
    try {
      // Attempt to unregister push notification tokens before clearing local data
      await NotificationService.unregisterTokens();

      // Clear auth tokens and user session securely
      await apiClient.clearSession();
      
      // Clear biometric PIN
      await this.clearBiometricPin();
      
      // Clear non-sensitive data from AsyncStorage
      await AsyncStorage.multiRemove([
        'user_data', 
        'portfolio_data'
        // Note: We keep phone number and username for easier re-login
      ]);
      
      console.log('✅ Logout successful, all sensitive data cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return { success: false, error: error.message };
    }
  },

  async refreshToken() {
    console.log('🔄 Refreshing auth token');
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshToken
      });
      
      if (response.success && response.data.accessToken) {
        // Store new access token securely using apiClient
        await apiClient.setAuthToken(response.data.accessToken);
        
        // Update refresh token if provided
        if (response.data.refreshToken) {
          await this.setRefreshToken(response.data.refreshToken);
        }
      }
      
      return response;
    } catch (error) {
      console.log('❌ Refresh token failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getCurrentUser() {
    console.log('👤 Getting current user info');
    try {
      const response = await apiClient.get('/profile/complete');
      if (response?.success) {
        const profile =
          response?.data?.profile ??
          response?.profile ??
          response?.data ??
          null;

        if (profile) {
          return {
            success: true,
            data: profile,
            message: response?.message || 'Profile fetched successfully',
          };
        }
      }
      return response;
    } catch (error) {
      console.log('❌ Get current user failed:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to load user profile' };
    }
  },

  async getStoredPortfolio() {
    console.log('💰 Getting stored portfolio data');
    try {
      const portfolioData = await AsyncStorage.getItem('portfolio_data');
      if (portfolioData) {
        return { 
          success: true, 
          data: JSON.parse(portfolioData) 
        };
      }
      return { success: false, error: 'No portfolio data found' };
    } catch (error) {
      console.log('❌ Get portfolio data failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await apiClient.getAuthToken();
    return !!token;
  },

  // Get stored access token
  async getStoredAccessToken() {
    try {
      return await apiClient.getAuthToken();
    } catch (error) {
      console.log('❌ Get stored access token failed:', error);
      return null;
    }
  },

  // Convenience method for PIN-only login (using saved phone number)
  async loginWithPin(pin) {
    console.log('🔐 Attempting PIN-only login using saved phone number');
    return await this.login({
      passwordpin: pin
      // phonenumber will be retrieved from storage automatically
    });
  },

  // NEW: Login with biometric authentication
  async loginWithBiometric() {
    console.log('🔐 Attempting biometric login');
    
    try {
      // Retrieve stored PIN
      const pin = await this.getPinForBiometric();
      
      if (!pin) {
        return {
          success: false,
          error: 'No PIN stored for biometric authentication'
        };
      }
      
      // Actually authenticate with the server
      const result = await this.loginWithPin(pin);
      
      if (result.success) {
        console.log('✅ Biometric login successful');
      } else {
        console.log('❌ Biometric login failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error during biometric login:', error);
      return {
        success: false,
        error: error.message || 'Biometric login failed'
      };
    }
  },
};