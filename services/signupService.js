import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export const signupService = {
  async addUser(userData) {
    console.log('📝 Creating user account for:', userData.phonenumber);
    const response = await apiClient.post('/signup/add-user', {
      email: userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      phonenumber: userData.phonenumber
    });
    
    if (response.success) {
      console.log('✅ User account created, OTP sent');
      // Store temporary signup data for OTP verification
      await AsyncStorage.setItem('temp_signup_data', JSON.stringify({
        email: userData.email,
        phonenumber: userData.phonenumber,
        firstname: userData.firstname,
        lastname: userData.lastname
      }));
    } else {
      console.log('❌ User creation failed:', response.error);
    }
    
    return response;
  },

  async verifyOTP(verificationData) {
    console.log('🔐 Verifying OTP for:', verificationData.phonenumber);
    const response = await apiClient.post('/verify-otp', {
      phonenumber: verificationData.phonenumber,
      otp: verificationData.otp
    });
    
    if (response.success) {
      console.log('✅ OTP verified successfully');
      // Keep temp data for PIN setup
    } else {
      console.log('❌ OTP verification failed:', response.error);
    }
    
    return response;
  },

  async createPIN(pinData) {
    console.log('🔑 Setting up PIN for user');
    const response = await apiClient.post('/create-pin', {
      phonenumber: pinData.phonenumber,
      pin: pinData.pin
    });
    
    if (response.success && response.data) {
      console.log('✅ PIN created, signup complete');
      
      // Set auth token if provided
      if (response.data.accessToken) {
        apiClient.setAuthToken(response.data.accessToken);
      }
      
      // Store refresh token
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      // Store user data
      if (response.data.user) {
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      // Clear temporary signup data
      await AsyncStorage.removeItem('temp_signup_data');
    } else {
      console.log('❌ PIN creation failed:', response.error);
    }
    
    return response;
  },

  async resendOTP(phonenumber) {
    console.log('🔄 Resending OTP for:', phonenumber);
    const response = await apiClient.post('/resend-otp', {
      phonenumber: phonenumber
    });
    
    if (response.success) {
      console.log('✅ OTP resent successfully');
    } else {
      console.log('❌ Resend OTP failed:', response.error);
    }
    
    return response;
  },

  async getTempSignupData() {
    try {
      const tempData = await AsyncStorage.getItem('temp_signup_data');
      if (tempData) {
        return { 
          success: true, 
          data: JSON.parse(tempData) 
        };
      }
      return { success: false, error: 'No temp signup data found' };
    } catch (error) {
      console.log('❌ Get temp signup data failed:', error);
      return { success: false, error: error.message };
    }
  },

  async clearTempSignupData() {
    try {
      await AsyncStorage.removeItem('temp_signup_data');
      console.log('🗑️ Temp signup data cleared');
      return { success: true };
    } catch (error) {
      console.log('❌ Clear temp signup data failed:', error);
      return { success: false, error: error.message };
    }
  }
};