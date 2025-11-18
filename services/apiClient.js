import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_SESSION_KEY = 'auth_session_bundle';

class ApiClient {
  constructor() {
    this.baseURL = __DEV__
      ? 'https://zeusadminxyz.online'
      : 'https://zeusadminxyz.online';

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.refreshPromise = null;
  }

  async getAuthToken() {
    try {
      const session = await this.getAuthSession();
      if (session?.accessToken) {
        return session.accessToken;
      }
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        await this.updateAuthSession({ accessToken: token });
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token from SecureStore:', error);
      return null;
    }
  }

  async setAuthToken(token) {
    try {
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        console.log('✅ Auth token stored securely');
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        console.log('✅ Auth token cleared');
      }
      await this.updateAuthSession({ accessToken: token ?? null });
    } catch (error) {
      console.error('Error storing auth token in SecureStore:', error);
      throw error;
    }
  }

  async clearAuthToken() {
    try {
      await this.setAuthToken(null);
    } catch (error) {
      console.error('Error clearing auth token from SecureStore:', error);
      throw error;
    }
  }

  async getRefreshToken() {
    try {
      const session = await this.getAuthSession();
      if (session?.refreshToken) {
        return session.refreshToken;
      }
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await this.updateAuthSession({ refreshToken });
      }
      return refreshToken;
    } catch (error) {
      console.error('Error getting refresh token from SecureStore:', error);
      return null;
    }
  }

  async setRefreshToken(token) {
    try {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        console.log('✅ Refresh token stored securely (apiClient)');
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        console.log('✅ Refresh token cleared (apiClient)');
      }
      await this.updateAuthSession({ refreshToken: token ?? null });
    } catch (error) {
      console.error('Error storing refresh token in SecureStore:', error);
      throw error;
    }
  }

  async clearRefreshToken() {
    try {
      await this.setRefreshToken(null);
    } catch (error) {
      console.error('Error clearing refresh token from SecureStore:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        console.warn('⚠️ No refresh token available for refresh attempt');
        return { success: false, error: 'No refresh token' };
      }

      try {
        console.log('🔄 Attempting to refresh access token...');
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (!response.ok) {
          console.error(`❌ Refresh token request failed ${response.status}:`, data);
          return {
            success: false,
            error: data?.message || data?.error || 'Refresh token request failed',
            status: response.status,
          };
        }

        const newAccessToken = data?.accessToken ?? data?.data?.accessToken;
        const newRefreshToken = data?.refreshToken ?? data?.data?.refreshToken;

        if (!newAccessToken) {
          console.error('❌ No access token in refresh response:', data);
          return {
            success: false,
            error: 'No access token received from refresh endpoint',
          };
        }

        // Store tokens before returning
        await this.setAuthToken(newAccessToken);
        
        if (newRefreshToken) {
          await this.setRefreshToken(newRefreshToken);
        }

        console.log('✅ Access token refreshed successfully');
        return { success: true, data };
      } catch (error) {
        console.error('❌ Error refreshing access token:', error);
        return { success: false, error: error.message || 'Refresh token failed' };
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async handleAuthError(status, errorData) {
    const message = (errorData?.message || errorData?.error || '').toLowerCase();
    const isAuthError =
      status === 401 ||
      status === 403 ||
      message.includes('token') ||
      message.includes('unauthorized') ||
      message.includes('forbidden');

    if (!isAuthError) {
      return false;
    }

    const refreshResult = await this.refreshAccessToken();
    if (refreshResult?.success) {
      return true;
    }

    console.warn('⚠️ Refresh token attempt failed, clearing tokens.');
    await this.clearSession();

    try {
      await Updates.reloadAsync();
    } catch (restartError) {
      console.error('❌ Failed to restart app after auth error:', restartError);
    }

    return false;
  }

  async request(endpoint, options = {}, retry = true) {
    try {
      const token = await this.getAuthToken();

      // Handle FormData properly
      const isFormData = options.body instanceof FormData;

      const config = {
        ...options,
        headers: {
          // Don't set Content-Type for FormData
          ...(isFormData ? {} : this.headers),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      // Handle AbortSignal - only use if provided
      const finalSignal = options.signal || null;

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        ...(finalSignal && { signal: finalSignal }),
      });

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

        if (retry && (response.status === 401 || response.status === 403)) {
          const refreshed = await this.handleAuthError(response.status, data);
          if (refreshed) {
            // Get the newly refreshed token before retrying
            const newToken = await this.getAuthToken();
            if (!newToken) {
              console.error('❌ No token available after refresh, cannot retry request');
              return {
                success: false,
                error: 'Authentication failed: Unable to refresh token',
                status: 401,
              };
            }
            // Retry the request with the new token
            return this.request(endpoint, options, false);
          }
          // If refresh failed, allow fall-through to send error response
        }

        // Return the actual error message from server
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        return {
          success: false,
          error: errorMessage,
          status: response.status,
        };
      }

      console.log(`✅ API Success: ${endpoint}`, data);
      return { success: true, data };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏹️ API Request Cancelled: ${endpoint}`);
        return {
          success: false,
          error: 'CANCELLED',
          message: 'Request was cancelled',
        };
      }
      console.error(`❌ API Network Error: ${endpoint}`, error);
      return {
        success: false,
        error: error.message || 'Network request failed',
      };
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
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

  async getAuthSession() {
    try {
      const stored = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading auth session bundle:', error);
    }
    return { accessToken: null, refreshToken: null, userId: null };
  }

  async saveAuthSession(session) {
    try {
      if (!session || (!session.accessToken && !session.refreshToken && !session.userId)) {
        await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
        return;
      }
      const payload = {
        accessToken: session.accessToken || null,
        refreshToken: session.refreshToken || null,
        userId: session.userId || null,
        updatedAt: new Date().toISOString(),
      };
      await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Error storing auth session bundle:', error);
    }
  }

  async updateAuthSession(partial = {}) {
    const current = await this.getAuthSession();
    const updated = {
      accessToken: partial.hasOwnProperty('accessToken') ? partial.accessToken : current.accessToken,
      refreshToken: partial.hasOwnProperty('refreshToken') ? partial.refreshToken : current.refreshToken,
      userId: partial.hasOwnProperty('userId') ? partial.userId : current.userId,
    };
    await this.saveAuthSession(updated);
    return updated;
  }

  async setUserId(userId) {
    await this.updateAuthSession({ userId: userId ?? null });
    try {
      if (userId) {
        await SecureStore.setItemAsync('userId', String(userId));
      } else {
        await SecureStore.deleteItemAsync('userId');
      }
    } catch (error) {
      console.error('Error syncing userId to SecureStore:', error);
    }
  }

  async clearSession() {
    await this.saveAuthSession(null);
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync('userId');
    } catch (error) {
      console.error('Error clearing auth session tokens:', error);
    }
  }
}

export const apiClient = new ApiClient();