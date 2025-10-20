import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

class ApiClient {
  constructor() {
    this.baseURL = __DEV__ 
      ? 'https://zeusodx-web.onrender.com'
      : 'https://zeusodx-web.onrender.com';
    
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getAuthToken() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token from SecureStore:', error);
      return null;
    }
  }

  async setAuthToken(token) {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      console.log('✅ Auth token stored securely');
    } catch (error) {
      console.error('Error storing auth token in SecureStore:', error);
      throw error;
    }
  }

  async clearAuthToken() {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      console.log('✅ Auth token cleared from SecureStore');
    } catch (error) {
      console.error('Error clearing auth token from SecureStore:', error);
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      // CRITICAL FIX: Handle FormData properly
      const isFormData = options.body instanceof FormData;
      
      const config = {
        ...options,
        headers: {
          // CRITICAL FIX: Don't set Content-Type for FormData
          ...(isFormData ? {} : this.headers),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Better error handling - get the response body even for errors
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        
        // Handle 401 Unauthorized and 403 Forbidden - restart the app
        if (response.status === 401 || response.status === 403) {
          console.log(`🔄 ${response.status} ${response.status === 401 ? 'Unauthorized' : 'Forbidden'} detected - restarting app...`);
          try {
            await Updates.reloadAsync();
          } catch (restartError) {
            console.error('❌ Failed to restart app:', restartError);
            // Fallback: clear auth tokens and let user re-authenticate
            await this.clearAuthToken();
          }
        }
        
        // Return the actual error message from server
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        return { 
          success: false, 
          error: errorMessage,
          status: response.status 
        };
      }

      console.log(`✅ API Success: ${endpoint}`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ API Network Error: ${endpoint}`, error);
      return { 
        success: false, 
        error: error.message || 'Network request failed' 
      };
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    // CRITICAL FIX: Handle FormData vs JSON properly
    const isFormData = data instanceof FormData;
    
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    // CRITICAL FIX: Handle FormData vs JSON properly
    const isFormData = data instanceof FormData;
    
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();