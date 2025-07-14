import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [state, setState] = useState({
    user: null,
    portfolio: null,
    loading: true,
    isAuthenticated: false,
  });

  const login = async (credentials) => {
    try {
      console.log('🔐 useAuth: Attempting login for', credentials.phonenumber);
      const response = await authService.login({
        phonenumber: credentials.phonenumber,
        passwordpin: credentials.passwordpin
      });
      
      if (response.success && response.data) {
        console.log('✅ useAuth: Login successful');
        setState({
          user: response.data.user,
          portfolio: response.data.portfolio,
          loading: false,
          isAuthenticated: true,
        });
        return { success: true, data: response.data };
      } else {
        console.log('❌ useAuth: Login failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.log('💥 useAuth: Login exception', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 useAuth: Attempting registration for', userData.phonenumber);
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        console.log('✅ useAuth: Registration successful');
        setState({
          user: response.data.user || null,
          portfolio: response.data.portfolio || null,
          loading: false,
          isAuthenticated: true,
        });
        return { success: true, data: response.data };
      } else {
        console.log('❌ useAuth: Registration failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.log('💥 useAuth: Registration exception', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 useAuth: Logging out');
      await authService.logout();
      setState({
        user: null,
        portfolio: null,
        loading: false,
        isAuthenticated: false,
      });
      return { success: true };
    } catch (error) {
      console.error('💥 useAuth: Logout error', error);
      return { success: false, error: error.message };
    }
  };

  const refreshAuthToken = async () => {
    try {
      console.log('🔄 useAuth: Refreshing auth token');
      const response = await authService.refreshToken();
      
      if (response.success) {
        console.log('✅ useAuth: Token refreshed successfully');
        return { success: true };
      } else {
        console.log('❌ useAuth: Token refresh failed, logging out');
        await logout();
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.log('💥 useAuth: Token refresh exception', error);
      await logout();
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = (updatedUser) => {
    console.log('👤 useAuth: Updating user profile');
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...updatedUser }
    }));
    // Update stored user data
    AsyncStorage.setItem('user_data', JSON.stringify({ ...state.user, ...updatedUser }));
  };

  const updatePortfolio = (updatedPortfolio) => {
    console.log('💰 useAuth: Updating portfolio');
    setState(prev => ({
      ...prev,
      portfolio: { ...prev.portfolio, ...updatedPortfolio }
    }));
    // Update stored portfolio data
    AsyncStorage.setItem('portfolio_data', JSON.stringify({ ...state.portfolio, ...updatedPortfolio }));
  };

  const checkAuth = async () => {
    try {
      console.log('🔍 useAuth: Checking authentication status');
      
      // Check for access token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.log('❌ useAuth: No access token found');
        setState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
        }));
        return;
      }

      // Get stored user data
      const userData = await AsyncStorage.getItem('user_data');
      const portfolioData = await AsyncStorage.getItem('portfolio_data');

      if (userData) {
        console.log('✅ useAuth: Found stored user data, user is authenticated');
        setState({
          user: JSON.parse(userData),
          portfolio: portfolioData ? JSON.parse(portfolioData) : null,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        console.log('⚠️ useAuth: Token found but no user data, getting current user');
        // Token exists but no user data, try to get current user
        const userResponse = await authService.getCurrentUser();
        
        if (userResponse.success) {
          setState({
            user: userResponse.data,
            portfolio: null,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          // Token might be invalid, clear it
          console.log('❌ useAuth: Invalid token, clearing auth');
          await logout();
        }
      }
    } catch (error) {
      console.log('💥 useAuth: Check auth error', error);
      setState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
      }));
    }
  };

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (state.isAuthenticated) {
      // Set up token refresh interval (e.g., every 50 minutes)
      const refreshInterval = setInterval(() => {
        refreshAuthToken();
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshAuthToken,
    updateUserProfile,
    updatePortfolio,
    checkAuth,
  };
}

// Export AuthContext for provider
export { AuthContext };