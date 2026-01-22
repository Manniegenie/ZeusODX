import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_SESSION_KEY = 'auth_session_bundle';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Optional SSL Pinning - only available after native rebuild
let SSLPinning = null;
try {
  SSLPinning = require('expo-ssl-pinning');
} catch (e) {
  // SSL Pinning not available, will use regular fetch
  if (__DEV__) {
    console.log('⚠️ SSL Pinning not available - using regular fetch');
  }
}

class ApiClient {
  constructor() {
    // Use environment variable for API base URL
    this.baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://zeusadminxyz.online';

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Flag to prevent multiple simultaneous refresh attempts
    this.isRefreshing = false;
    // Queue of requests waiting for token refresh
    this.refreshQueue = [];

    if (__DEV__) {
      console.log('🔧 API Client initialized with base URL:', this.baseURL);
    }
  }

  // --- AUTH TOKEN MANAGEMENT ---

  async getAuthToken() {
    try {
      // Check if token is expired
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        if (__DEV__) {
          console.log('⚠️ Token expired, attempting refresh...');
        }
        // Try to refresh before clearing
        const refreshed = await this.attemptTokenRefresh();
        if (!refreshed) {
          await this.clearSession();
          return null;
        }
      }

      const session = await this.getAuthSession();
      if (session?.accessToken) return session.accessToken;

      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) await this.updateAuthSession({ accessToken: token });
      return token;
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting auth token:', error);
      }
      return null;
    }
  }

  async setAuthToken(token, expiryInSeconds = 3600) {
    try {
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        // Set token expiry (default 1 hour to match server's ACCESS_TOKEN_EXPIRES_IN)
        const expiryTime = Date.now() + (expiryInSeconds * 1000);
        await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      }
      await this.updateAuthSession({ accessToken: token ?? null });
    } catch (error) {
      if (__DEV__) {
        console.error('Error storing auth token:', error);
      }
      throw error;
    }
  }

  async isTokenExpired() {
    try {
      const expiryTime = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return false; // No expiry set, assume valid

      const expiry = parseInt(expiryTime, 10);
      const now = Date.now();

      // Add 30 second buffer to refresh before actual expiry
      return now >= (expiry - 30000);
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking token expiry:', error);
      }
      return false; // On error, don't block access
    }
  }

  // --- REFRESH TOKEN MANAGEMENT ---

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting refresh token:', error);
      }
      return null;
    }
  }

  async setRefreshToken(token) {
    try {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error storing refresh token:', error);
      }
      throw error;
    }
  }

  async clearRefreshToken() {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) {
        console.error('Error clearing refresh token:', error);
      }
    }
  }

  // --- TOKEN REFRESH LOGIC ---

  async attemptTokenRefresh() {
    // If already refreshing, wait for the result
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        if (__DEV__) {
          console.log('❌ No refresh token available');
        }
        return false;
      }

      if (__DEV__) {
        console.log('🔄 Attempting to refresh access token...');
      }

      // Call the server's refresh endpoint directly (not through this.request to avoid loops)
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.accessToken) {
        if (__DEV__) {
          console.log('✅ Token refresh successful');
        }

        // Store new access token (1 hour expiry)
        await this.setAuthToken(data.accessToken, 3600);

        // Store new refresh token if provided (server rotates tokens)
        if (data.refreshToken) {
          await this.setRefreshToken(data.refreshToken);
        }

        // Resolve all queued requests
        this.refreshQueue.forEach((resolve) => resolve(true));
        this.refreshQueue = [];

        return true;
      } else {
        if (__DEV__) {
          console.log('❌ Token refresh failed:', data.message || 'Unknown error');
        }

        // Clear tokens on refresh failure
        await this.clearSession();

        // Resolve all queued requests as failed
        this.refreshQueue.forEach((resolve) => resolve(false));
        this.refreshQueue = [];

        return false;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Token refresh error:', error);
      }

      // Resolve all queued requests as failed
      this.refreshQueue.forEach((resolve) => resolve(false));
      this.refreshQueue = [];

      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- CORE REQUEST LOGIC ---

  async request(endpoint, options = {}, retryCount = 0) {
    try {
      const token = await this.getAuthToken();
      const isFormData = options.body instanceof FormData;

      const config = {
        ...options,
        headers: {
          ...(isFormData ? {} : this.headers),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      // Use SSL pinning for production builds
      let response;
      if (!__DEV__ && SSLPinning) {
        try {
          // Certificate pinning enabled in production
          response = await SSLPinning.fetch(`${this.baseURL}${endpoint}`, {
            ...config,
            sslPinning: {
              certs: ['zeusadminxyz.online'], // Add your SSL certificate hash here
            },
          });
        } catch (pinningError) {
          // Fallback to regular fetch if pinning fails
          if (__DEV__) {
            console.warn('⚠️ SSL Pinning failed, falling back to regular fetch:', pinningError);
          }
          response = await fetch(`${this.baseURL}${endpoint}`, config);
        }
      } else {
        // Development mode - use regular fetch
        response = await fetch(`${this.baseURL}${endpoint}`, config);
      }

      // Parse response
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/refresh')) {
        if (__DEV__) {
          console.log('🔄 Received 401, attempting token refresh...');
        }

        const refreshed = await this.attemptTokenRefresh();
        if (refreshed) {
          // Retry the original request with new token
          return this.request(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed, return the 401 error
          return {
            success: false,
            error: 'Session expired. Please log in again.',
            status: 401,
            sessionExpired: true,
            data,
          };
        }
      }

      if (!response.ok) {
        if (__DEV__) {
          console.error(`❌ API Error ${response.status}:`, data);
        }

        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          status: response.status,
          data,
        };
      }

      if (__DEV__) {
        console.log(`✅ API Success: ${endpoint}`);
      }
      return { success: true, data };
    } catch (error) {
      if (__DEV__) {
        console.error(`❌ Network Error: ${endpoint}`, error);
      }
      return { success: false, error: error.message || 'Network request failed' };
    }
  }

  // --- HTTP WRAPPERS ---

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // --- SESSION STORAGE ---

  async getAuthSession() {
    try {
      const stored = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
      return stored ? JSON.parse(stored) : { accessToken: null, userId: null };
    } catch {
      return { accessToken: null, userId: null };
    }
  }

  async saveAuthSession(session) {
    if (!session) {
      await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
      return;
    }
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
  }

  async updateAuthSession(partial = {}) {
    const current = await this.getAuthSession();
    const updated = { ...current, ...partial };
    await this.saveAuthSession(updated);
    return updated;
  }

  async setUserId(userId) {
    try {
      if (userId) {
        await SecureStore.setItemAsync('userId', userId);
        await this.updateAuthSession({ userId });
      } else {
        await SecureStore.deleteItemAsync('userId');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error storing userId:', error);
      }
    }
  }

  async clearSession() {
    await this.saveAuthSession(null);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    await SecureStore.deleteItemAsync('userId');
  }
}

export const apiClient = new ApiClient();
