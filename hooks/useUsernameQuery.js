import { useState, useCallback, useRef } from 'react';
import { usernameSearchService } from '../services/usernamequeryService';

export const useUsernameSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  
  // Use ref to track the latest search to avoid race conditions
  const latestSearchRef = useRef(0);

  const searchUsername = useCallback(async (query) => {
    console.log('🔍 Hook: Starting username search for:', query);
    
    if (!query || query.trim().length === 0) {
      console.log('❌ Hook: Empty query provided');
      setError('Please enter a username to search');
      setSearchResults([]);
      setHasSearched(false);
      return { success: false, error: 'Please enter a username to search' };
    }

    // Increment search counter for race condition handling
    const currentSearchId = ++latestSearchRef.current;
    
    setIsLoading(true);
    setError(null);
    setLastQuery(query.trim());
    
    try {
      console.log('📤 Hook: Making search request...');
      const result = await usernameSearchService.searchUsername(query);
      
      // Check if this is still the latest search
      if (currentSearchId !== latestSearchRef.current) {
        console.log('🚫 Hook: Search cancelled - newer search in progress');
        return { success: false, error: 'Search cancelled' };
      }
      
      if (result.success) {
        console.log('✅ Hook: Search successful, updating state');
        setSearchResults(result.data.users);
        setError(null);
        setHasSearched(true);
        
        return {
          success: true,
          data: {
            users: result.data.users,
            totalFound: result.data.totalFound,
            query: result.data.query
          }
        };
      } else {
        console.log('❌ Hook: Search failed:', result.error);
        setError(result.error);
        setSearchResults([]);
        setHasSearched(true);
        
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.log('❌ Hook: Search error:', error);
      
      // Check if this is still the latest search
      if (currentSearchId !== latestSearchRef.current) {
        return { success: false, error: 'Search cancelled' };
      }
      
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      setSearchResults([]);
      setHasSearched(true);
      
      return { success: false, error: errorMessage };
    } finally {
      // Only set loading to false if this is still the latest search
      if (currentSearchId === latestSearchRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearResults = useCallback(() => {
    console.log('🗑️ Hook: Clearing search results');
    setSearchResults([]);
    setError(null);
    setHasSearched(false);
    setLastQuery('');
    setIsLoading(false);
    
    // Reset search counter
    latestSearchRef.current = 0;
  }, []);

  const clearError = useCallback(() => {
    console.log('🗑️ Hook: Clearing error');
    setError(null);
  }, []);

  return {
    // Data
    searchResults,
    error,
    isLoading,
    hasSearched,
    lastQuery,
    
    // Actions
    searchUsername,
    clearResults,
    clearError,
    
    // Computed
    hasResults: searchResults.length > 0,
    isEmpty: !isLoading && hasSearched && searchResults.length === 0,
    hasError: !!error,
    isIdle: !isLoading && !hasSearched,
  };
};