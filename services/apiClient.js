import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_SESSION_KEY = 'auth_session_bundle';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiClient {
  constructor() {
    this.baseURL = __DEV__
      ? 'https://zeusadminxyz.online'
      : 'https://zeusadminxyz.online';

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // --- AUTH TOKEN MANAGEMENT ---

  async getAuthToken() {
    try {
      const session = await this.getAuthSession();
      if (session?.accessToken) return session.accessToken;

      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) await this.updateAuthSession({ accessToken: token });
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async setAuthToken(token) {
    try {
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      }
      await this.updateAuthSession({ accessToken: token ?? null });
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  }

  // --- REFRESH TOKEN MANAGEMENT ---

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
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
      console.error('Error storing refresh token:', error);
      throw error;
    }
  }

  // --- CORE REQUEST LOGIC ---

  async request(endpoint, options = {}) {
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

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Parse response
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);

        // Removed restart logic; just return error
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          status: response.status,
          data,
        };
      }

      console.log(`✅ API Success: ${endpoint}`);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Network Error: ${endpoint}`, error);
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

  async clearSession() {
    await this.saveAuthSession(null);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync('userId');
  }
}

export const apiClient = new ApiClient();
