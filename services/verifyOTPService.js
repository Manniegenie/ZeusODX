import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export const verifyService = {
  async verifyOTP(verificationData) {
    console.log('🔐 Verifying OTP for:', verificationData.phonenumber);
    
    try {
      const response = await apiClient.post('/verify-otp/verify-otp', {
        phonenumber: verificationData.phonenumber,
        code: verificationData.code
      });
      
      if (response.success && response.data) {
        console.log('✅ OTP verified successfully - ready for PIN setup');
        
        // Store pending user data for PIN setup step
        const pendingUserData = {
          pendingUserId: response.data.pendingUserId,
          email: response.data.email,
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          phonenumber: response.data.phonenumber,
          otpVerified: true,
          verifiedAt: new Date().toISOString()
        };
        
        await AsyncStorage.setItem('pending_user_data', JSON.stringify(pendingUserData));
        console.log('💾 Pending user data stored for PIN setup');
        
        // Clear any previous temporary signup data
        await AsyncStorage.removeItem('temp_signup_data');
        
        console.log('✅ Ready to proceed to PIN setup');
      } else {
        console.log('❌ OTP verification failed:', response.error);
      }
      
      return response;
    } catch (error) {
      console.log('❌ OTP verification error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to verify OTP' 
      };
    }
  },

  async resendOTP(phonenumber) {
    console.log('🔄 Resending OTP for:', phonenumber);
    
    try {
      // You might need to update this endpoint based on your backend
      const response = await apiClient.post('/signup/resend-otp', {
        phonenumber: phonenumber
      });
      
      if (response.success) {
        console.log('✅ OTP resent successfully');
      } else {
        console.log('❌ Resend OTP failed:', response.error);
      }
      
      return response;
    } catch (error) {
      console.log('❌ Resend OTP error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to resend OTP' 
      };
    }
  },

  async getPendingUserData() {
    console.log('📋 Getting pending user data');
    try {
      const pendingData = await AsyncStorage.getItem('pending_user_data');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        console.log('✅ Retrieved pending user data');
        return { 
          success: true, 
          data: data 
        };
      }
      
      console.log('❌ No pending user data found');
      return { success: false, error: 'No pending user data found' };
    } catch (error) {
      console.log('❌ Get pending user data failed:', error);
      return { success: false, error: error.message };
    }
  },

  async clearPendingUserData() {
    console.log('🗑️ Clearing pending user data');
    try {
      await AsyncStorage.removeItem('pending_user_data');
      console.log('✅ Pending user data cleared');
      return { success: true };
    } catch (error) {
      console.log('❌ Clear pending user data failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getTempSignupData() {
    console.log('📋 Getting temp signup data');
    try {
      const tempData = await AsyncStorage.getItem('temp_signup_data');
      if (tempData) {
        console.log('✅ Retrieved temp signup data');
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
    console.log('🗑️ Clearing temp signup data');
    try {
      await AsyncStorage.removeItem('temp_signup_data');
      console.log('✅ Temp signup data cleared');
      return { success: true };
    } catch (error) {
      console.log('❌ Clear temp signup data failed:', error);
      return { success: false, error: error.message };
    }
  },

  async checkVerificationStatus(phonenumber) {
    console.log('🔍 Checking verification status for:', phonenumber);
    
    try {
      // Check if we have pending user data locally first
      const pendingData = await this.getPendingUserData();
      if (pendingData.success && pendingData.data.phonenumber === phonenumber) {
        return {
          success: true,
          data: {
            isVerified: pendingData.data.otpVerified,
            pendingUserId: pendingData.data.pendingUserId,
            userInfo: pendingData.data
          }
        };
      }
      
      // If no local data, you might want to add an API endpoint to check status
      // const response = await apiClient.get(`/verify-otp/status?phonenumber=${phonenumber}`);
      
      return { success: false, error: 'No verification status found' };
    } catch (error) {
      console.log('❌ Failed to check verification status:', error);
      return { success: false, error: error.message };
    }
  },

  async isOTPVerified() {
    console.log('🔍 Checking if OTP is verified');
    try {
      const pendingData = await this.getPendingUserData();
      if (pendingData.success && pendingData.data.otpVerified) {
        console.log('✅ OTP is verified, ready for PIN setup');
        return {
          success: true,
          data: {
            isVerified: true,
            pendingUserId: pendingData.data.pendingUserId,
            userInfo: pendingData.data
          }
        };
      }
      
      console.log('❌ OTP not verified');
      return {
        success: false,
        error: 'OTP not verified'
      };
    } catch (error) {
      console.log('❌ Error checking OTP verification status:', error);
      return { success: false, error: error.message };
    }
  },

  async validateOTPFormat(code) {
    console.log('🔍 Validating OTP format');
    
    // Assuming OTP is 6 digits - adjust based on your requirements
    const otpRegex = /^\d{6}$/;
    const isValid = otpRegex.test(code);
    
    if (!isValid) {
      console.log('❌ Invalid OTP format');
      return {
        success: false,
        error: 'OTP must be exactly 6 digits'
      };
    }
    
    console.log('✅ OTP format is valid');
    return { success: true };
  }
};