import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Storage keys (matching simpleAppState)
  PHONE_NUMBER_KEY: 'saved_phone_number',
  USERNAME_KEY: 'saved_username',

  // Helper method to get auth headers
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Save phone number to AsyncStorage
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

  // Save username to AsyncStorage
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
      
      // Store access token in AsyncStorage using same key as apiClient
      if (response.data.accessToken) {
        await AsyncStorage.setItem('auth_token', response.data.accessToken);
      }
      
      // Store refresh token
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      // Store user data
      if (response.data.user) {
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      // Store portfolio data
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
      
      if (response.data.accessToken) {
        await AsyncStorage.setItem('auth_token', response.data.accessToken);
      }
    }
    
    return response;
  },

  async logout() {
    console.log('🚪 Logging out user');
    // Clear all stored data using same keys as apiClient
    await AsyncStorage.multiRemove([
      'auth_token',
      'refresh_token', 
      'user_data', 
      'portfolio_data'
      // Note: We keep phone number and username for easier re-login
    ]);
    
    return { success: true };
  },

  async refreshToken() {
    console.log('🔄 Refreshing auth token');
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshToken
      });
      
      if (response.success && response.data.accessToken) {
        await AsyncStorage.setItem('auth_token', response.data.accessToken);
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
      // First try to get from local storage
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        return { 
          success: true, 
          data: JSON.parse(userData) 
        };
      }
      
      // If not in storage, fetch from API with auth headers
      const authHeaders = await this.getAuthHeaders();
      return apiClient.get('/auth/me', authHeaders);
    } catch (error) {
      console.log('❌ Get current user failed:', error);
      return { success: false, error: error.message };
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
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },

  // Get stored access token
  async getStoredAccessToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
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
};