import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_SESSION_KEY = 'auth_session_bundle';
const LOGIN_TIME_KEY = 'login_time';
const SESSION_TIMEOUT_MS = 50 * 60 * 1000; // 50 minutes in milliseconds
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

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
    this.loginTime = null;
    this.sessionTimer = null;
    
    // Initialize session timer if user is already logged in
    this.initializeSessionTimer();
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
        // Start session timer when token is set
        this.startSessionTimer();
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        console.log('✅ Auth token cleared');
        // Stop session timer when token is cleared
        this.stopSessionTimer();
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
    // Refresh tokens are no longer used
    return null;
  }

  async setRefreshToken(token) {
    try {
      // Refresh tokens are deprecated; always clear storage/session
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await this.updateAuthSession({ refreshToken: null });
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
    // Refresh flow removed; force caller to restart
    return { success: false, error: 'Refresh disabled' };
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

    console.warn('⚠️ Auth error detected; clearing session and restarting app.');
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
          data: data, // Include full error response data for detailed error handling
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
    // Stop session timer when session is cleared
    this.stopSessionTimer();
  }

  /**
   * Initialize session timer on app start if user is already logged in
   */
  async initializeSessionTimer() {
    try {
      const token = await this.getAuthToken();
      if (token) {
        // Try to restore login time from storage
        const storedLoginTime = await SecureStore.getItemAsync(LOGIN_TIME_KEY);
        if (storedLoginTime) {
          this.loginTime = parseInt(storedLoginTime, 10);
          // Check if we should restart immediately
          await this.checkSessionTimeout();
        } else {
          // If no stored time, assume login just happened
          this.loginTime = Date.now();
          await SecureStore.setItemAsync(LOGIN_TIME_KEY, String(this.loginTime));
        }
        // Start the timer
        this.startSessionTimerInterval();
      }
    } catch (error) {
      console.error('Error initializing session timer:', error);
    }
  }

  /**
   * Start the session timer that will restart the app after 50 minutes
   * This is called automatically when a token is set
   */
  startSessionTimer() {
    // Clear any existing timer
    this.stopSessionTimer();
    
    // Record login time
    this.loginTime = Date.now();
    
    // Store login time for persistence across app restarts
    SecureStore.setItemAsync(LOGIN_TIME_KEY, String(this.loginTime)).catch(error => {
      console.error('Error storing login time:', error);
    });
    
    // Start the interval
    this.startSessionTimerInterval();
    
    console.log('🕐 Session timer started (50 minute timeout)');
  }

  /**
   * Start the interval timer (internal method)
   */
  startSessionTimerInterval() {
    // Set up interval to check session timeout
    this.sessionTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, SESSION_CHECK_INTERVAL_MS);
  }

  /**
   * Stop the session timer
   * This is called automatically when token is cleared or session ends
   */
  stopSessionTimer() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.loginTime = null;
    // Clear stored login time
    SecureStore.deleteItemAsync(LOGIN_TIME_KEY).catch(error => {
      console.error('Error clearing login time:', error);
    });
    console.log('🕐 Session timer stopped');
  }

  /**
   * Check if session has exceeded 50 minutes and restart app if needed
   */
  async checkSessionTimeout() {
    if (!this.loginTime) {
      return;
    }

    const elapsed = Date.now() - this.loginTime;
    
    if (elapsed >= SESSION_TIMEOUT_MS) {
      console.log('⏰ Session timeout reached (50 minutes), restarting app...');
      this.stopSessionTimer();
      
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.error('❌ Failed to restart app after session timeout:', error);
      }
    }
  }
}

export const apiClient = new ApiClient();