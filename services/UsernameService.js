import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usernameService = {
  // Validation rules - single source of truth
  validationRules: {
    minLength: 3,
    maxLength: 15,
    pattern: /^[a-zA-Z][a-zA-Z0-9]*(?:[._]?[a-zA-Z0-9]+)*$/,
    invalidPattern: /[._]{2,}|^[._]|[._]$/,
    rules: [
      'Must start with a letter',
      'Maximum 15 characters',
      'Only letters, numbers, underscores, and periods allowed',
      'No consecutive dots or underscores',
      'Cannot start or end with dots or underscores'
    ]
  },

  // Validate username format
  validateFormat(username) {
    const trimmed = username?.trim() || '';
    const errors = [];

    if (trimmed.length === 0) {
      return { isValid: false, errors: ['Username is required'] };
    }

    if (trimmed.length < this.validationRules.minLength) {
      errors.push(`Username must be at least ${this.validationRules.minLength} characters long`);
    }

    if (trimmed.length > this.validationRules.maxLength) {
      errors.push(`Username must be ${this.validationRules.maxLength} characters or less`);
    }

    if (!this.validationRules.pattern.test(trimmed) || this.validationRules.invalidPattern.test(trimmed)) {
      errors.push('Invalid username format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Check if username meets individual requirements
  checkRequirements(username) {
    const trimmed = username?.trim() || '';
    
    return {
      hasMinLength: trimmed.length >= this.validationRules.minLength,
      hasMaxLength: trimmed.length <= this.validationRules.maxLength,
      hasValidChars: this.validationRules.pattern.test(trimmed),
      noInvalidPattern: !this.validationRules.invalidPattern.test(trimmed),
      startsWithLetter: /^[a-zA-Z]/.test(trimmed)
    };
  },

  // Check username availability - consistent return type
  async checkAvailability(username) {
    try {
      const response = await apiClient.post('/usernamecheck/check-username', {
        username: username.trim()
      });
      
      console.log('API Response:', response);
      
      // Ensure we always get a boolean value for availability
      const isAvailable = response.data?.available === true;
      
      // Handle success response - access data.available instead of response.available
      return {
        success: true,
        isAvailable: isAvailable,  // ✅ Always boolean
        errors: response.data?.errors || (isAvailable ? [] : ['Username not available']),
        error: null
      };
    } catch (error) {
      console.log('Error checking availability:', error);
      
      // Handle API error response (400, etc.)
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const isAvailable = errorData.available === true;
        return {
          success: true, // We got a valid response, just not available
          isAvailable: isAvailable,
          errors: errorData.errors || [errorData.message || 'Username not available'],
          error: null
        };
      }
      
      // Handle network/unknown errors - always return unavailable
      return {
        success: true, // Treat as successful check, just unavailable
        isAvailable: false,
        errors: ['Username unavailable'],
        error: null
      };
    }
  },

  // Update username (final step)
  async updateUsername(username) {
    try {
      const response = await apiClient.post('/username/update-username', {
        username: username.trim()
      });
      
      if (response.success && response.data) {
        // Update local storage
        if (response.data.user) {
          await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || response.message || 'Failed to update username'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update username'
      };
    }
  }
};