import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const passwordPinService = {
  async setPasswordPin(passwordPinData) {
    console.log('🔐 Setting password PIN for pending user:', passwordPinData.pendingUserId);
    
    try {
      const response = await apiClient.post('/passwordpin/password-pin', {
        newPin: passwordPinData.newPin,
        renewPin: passwordPinData.renewPin,
        pendingUserId: passwordPinData.pendingUserId
      });
      
      if (response.success && response.data) {
        console.log('✅ Password PIN set successfully, account created');
        
        // Store authentication tokens - CRITICAL for other services to work
        if (response.data.accessToken) {
          console.log('🔑 Storing access token in AsyncStorage');
          await AsyncStorage.setItem('auth_token', response.data.accessToken); // ✅ Changed to match apiClient
        } else {
          console.log('⚠️ No access token received - API calls may fail');
        }
        
        // Store refresh token
        if (response.data.refreshToken) {
          console.log('🔄 Storing refresh token');
          await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
        }
        
        // Store user data
        if (response.data.user) {
          console.log('👤 Storing user data');
          await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
          
          // Also save username separately for easy access
          if (response.data.user.username) {
            await AsyncStorage.setItem('saved_username', response.data.user.username);
            console.log('👤 Username saved separately:', response.data.user.username);
          }
        }
        
        console.log('✅ All authentication data stored - other services can now make authorized requests');
        
        // Clear pending user data after successful account creation
        await this.clearPendingUserData();
        console.log('🗑️ Pending user data cleared after successful account creation');
      } else {
        console.log('❌ Password PIN setup failed:', response.error);
      }
      
      return response;
    } catch (error) {
      console.log('❌ Password PIN service error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to set password PIN' 
      };
    }
  },

  async validatePinFormat(pin) {
    console.log('🔍 Validating PIN format');
    
    // Check if PIN is exactly 6 digits
    const pinRegex = /^\d{6}$/;
    const isValid = pinRegex.test(pin);
    
    if (!isValid) {
      console.log('❌ Invalid PIN format - must be exactly 6 digits');
      return {
        success: false,
        error: 'Password PIN must be exactly 6 digits'
      };
    }
    
    console.log('✅ PIN format is valid');
    return { success: true };
  },

  async validatePinsMatch(newPin, renewPin) {
    console.log('🔍 Validating PINs match');
    
    if (newPin !== renewPin) {
      console.log('❌ PINs do not match');
      return {
        success: false,
        error: 'PINs do not match'
      };
    }
    
    console.log('✅ PINs match');
    return { success: true };
  },

  async getPendingUserId() {
    console.log('🔍 Getting pending user ID from storage');
    try {
      const pendingData = await AsyncStorage.getItem('pending_user_data');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        if (data.pendingUserId && data.otpVerified) {
          console.log('✅ Found verified pending user ID');
          return { success: true, data: { pendingUserId: data.pendingUserId, userInfo: data } };
        } else {
          console.log('❌ Pending user not verified or missing ID');
          return { success: false, error: 'OTP not verified or missing pending user ID' };
        }
      } else {
        console.log('❌ No pending user data found');
        return { success: false, error: 'No pending user data found' };
      }
    } catch (error) {
      console.log('❌ Error getting pending user ID:', error);
      return { success: false, error: error.message };
    }
  },

  async validateAndSetPin(passwordPinData) {
    console.log('🔍 Starting PIN validation and setup process');
    
    // Get pendingUserId from storage if not provided
    let pendingUserId = passwordPinData.pendingUserId;
    if (!pendingUserId) {
      console.log('🔄 No pendingUserId provided, getting from storage...');
      const pendingResult = await this.getPendingUserId();
      if (pendingResult.success) {
        pendingUserId = pendingResult.data.pendingUserId;
        console.log('✅ Using pendingUserId from storage');
      } else {
        console.log('❌ Failed to get pending user ID');
        return {
          success: false,
          error: pendingResult.error || 'Pending user ID is required'
        };
      }
    }
    
    if (!passwordPinData.newPin || !passwordPinData.renewPin) {
      console.log('❌ Missing required PIN fields');
      return {
        success: false,
        error: 'Both newPin and renewPin are required'
      };
    }
    
    // Validate PIN format
    const formatValidation = await this.validatePinFormat(passwordPinData.newPin);
    if (!formatValidation.success) {
      return formatValidation;
    }
    
    // Validate PINs match
    const matchValidation = await this.validatePinsMatch(
      passwordPinData.newPin, 
      passwordPinData.renewPin
    );
    if (!matchValidation.success) {
      return matchValidation;
    }
    
    console.log('✅ All validations passed, proceeding with PIN setup');
    
    // Set the password PIN and create account with the pendingUserId
    return await this.setPasswordPin({
      ...passwordPinData,
      pendingUserId: pendingUserId
    });
  },

  async checkPendingUserStatus(pendingUserId) {
    console.log('🔍 Checking pending user status:', pendingUserId);
    
    try {
      // This would be an additional endpoint to check pending user status
      // You might want to create this endpoint in your backend
      const response = await apiClient.get(`/admin/pending-user/${pendingUserId}`);
      
      if (response.success && response.data) {
        console.log('✅ Pending user found:', response.data);
        
        if (!response.data.otpVerified) {
          console.log('❌ OTP not verified for pending user');
          return {
            success: false,
            error: 'Phone number must be verified before setting PIN'
          };
        }
        
        return { success: true, data: response.data };
      } else {
        console.log('❌ Pending user not found');
        return {
          success: false,
          error: 'Pending user not found'
        };
      }
    } catch (error) {
      console.log('❌ Error checking pending user status:', error);
      return {
        success: false,
        error: error.message || 'Failed to check pending user status'
      };
    }
  },

  async clearPendingUserData() {
    console.log('🧹 Clearing any pending user data from storage');
    try {
      await AsyncStorage.multiRemove([
        'pending_user_id', 
        'pending_user_data', 
        'temp_signup_data'
      ]);
      console.log('✅ All pending user data cleared');
    } catch (error) {
      console.log('❌ Error clearing pending user data:', error);
    }
  },

  async getPendingUserInfo() {
    console.log('👤 Getting pending user information');
    try {
      const pendingData = await AsyncStorage.getItem('pending_user_data');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        console.log('✅ Found pending user info');
        return { success: true, data: data };
      } else {
        console.log('❌ No pending user info found');
        return { success: false, error: 'No pending user information found' };
      }
    } catch (error) {
      console.log('❌ Error getting pending user info:', error);
      return { success: false, error: error.message };
    }
  },

  async validatePendingUser() {
    console.log('🔍 Validating pending user is ready for PIN setup');
    
    const pendingResult = await this.getPendingUserId();
    if (!pendingResult.success) {
      return pendingResult;
    }
    
    const userInfo = pendingResult.data.userInfo;
    if (!userInfo.otpVerified) {
      console.log('❌ OTP not verified for pending user');
      return {
        success: false,
        error: 'Phone number must be verified before setting PIN'
      };
    }
    
    console.log('✅ Pending user is ready for PIN setup');
    return { success: true, data: userInfo };
  },

  async quickSetupPin(newPin, renewPin) {
    console.log('⚡ Quick PIN setup using stored pending user');
    
    // Validate pending user first
    const validation = await this.validatePendingUser();
    if (!validation.success) {
      return validation;
    }
    
    // Use the stored pendingUserId
    return await this.validateAndSetPin({
      newPin,
      renewPin
      // pendingUserId will be automatically retrieved from storage
    });
  },

  async getStoredTokens() {
    console.log('📱 Getting stored authentication tokens');
    try {
      const accessToken = await AsyncStorage.getItem('auth_token'); // ✅ Changed to match apiClient
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const username = await AsyncStorage.getItem('saved_username');
      
      return {
        success: true,
        data: {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUsername: !!username,
          accessToken: accessToken ? '***' + accessToken.slice(-4) : null, // Masked for security
          refreshToken: refreshToken ? '***' + refreshToken.slice(-4) : null,
          username: username
        }
      };
    } catch (error) {
      console.log('❌ Error getting stored tokens:', error);
      return { success: false, error: error.message };
    }
  },

  async isReadyForPinSetup() {
    console.log('🔍 Checking if ready for PIN setup');
    
    const pendingResult = await this.getPendingUserId();
    if (pendingResult.success) {
      console.log('✅ Ready for PIN setup');
      return { 
        success: true, 
        data: { 
          isReady: true, 
          userInfo: pendingResult.data.userInfo 
        } 
      };
    } else {
      console.log('❌ Not ready for PIN setup');
      return { 
        success: false, 
        error: pendingResult.error,
        data: { isReady: false }
      };
    }
  },

  async getAccountCreationStatus() {
    console.log('📊 Getting account creation status');
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          success: true,
          data: {
            isAccountCreated: true,
            kycLevel: user.kycLevel,
            kycStatus: user.kycStatus,
            user: user
          }
        };
      }
      
      return {
        success: true,
        data: {
          isAccountCreated: false
        }
      };
    } catch (error) {
      console.log('❌ Error getting account creation status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};