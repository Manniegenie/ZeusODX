import AsyncStorage from '@react-native-async-storage/async-storage';

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
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const config = {
        ...options,
        headers: {
          ...this.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // 🔥 Better error handling - get the response body even for errors
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        
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

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  setAuthToken(token) {
    AsyncStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    AsyncStorage.removeItem('auth_token');
  }
}

export const apiClient = new ApiClient();