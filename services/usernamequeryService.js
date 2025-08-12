import { apiClient } from './apiClient';

export const usernameSearchService = {
  async searchUsername(query) {
    console.log('🔍 Searching for username:', query);
    
    try {
      // Validate query length
      if (!query || query.trim().length < 2) {
        console.log('❌ Query too short - must be at least 2 characters');
        return {
          success: false,
          error: 'Query must be at least 2 characters'
        };
      }

      const trimmedQuery = query.trim();
      console.log('📤 Making search request with query:', trimmedQuery);
      
      const response = await apiClient.post('/user-query/search', {
        q: trimmedQuery
      });
      
      console.log('🔍 Debug response:', response);
      
      // Handle different response formats
      let users = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        users = response;
      } else if (response && Array.isArray(response.data)) {
        // Wrapped in data property
        users = response.data;
      } else if (response && response.success && Array.isArray(response.users)) {
        // Wrapped in users property
        users = response.users;
      } else if (response && response.error) {
        // Error response
        console.log('❌ Username search failed:', response.error);
        return {
          success: false,
          error: response.error
        };
      } else {
        // Fallback - assume empty array for no results
        users = [];
      }
      
      console.log('✅ Username search successful, found', users.length, 'users');
      return {
        success: true,
        data: {
          users: users,
          totalFound: users.length,
          query: trimmedQuery
        }
      };
      
    } catch (error) {
      console.log('❌ Username search service error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to search username' 
      };
    }
  },

  async validateSearchQuery(query) {
    console.log('🔍 Validating search query format');
    
    if (!query) {
      console.log('❌ Empty query');
      return {
        success: false,
        error: 'Search query is required'
      };
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      console.log('❌ Query too short');
      return {
        success: false,
        error: 'Query must be at least 2 characters'
      };
    }

    if (trimmed.length > 50) {
      console.log('❌ Query too long');
      return {
        success: false,
        error: 'Query must be 50 characters or less'
      };
    }

    // Check for valid username characters (letters, numbers, underscore, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      console.log('❌ Invalid characters in query');
      return {
        success: false,
        error: 'Query can only contain letters, numbers, underscore, and hyphen'
      };
    }
    
    console.log('✅ Search query is valid');
    return { success: true, data: { query: trimmed } };
  },

  async quickSearchUsername(query) {
    console.log('⚡ Quick username search with validation');
    
    // Validate query first
    const validation = await this.validateSearchQuery(query);
    if (!validation.success) {
      return validation;
    }
    
    // Perform search with validated query
    return await this.searchUsername(validation.data.query);
  }
};