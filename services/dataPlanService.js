// services/dataPlansService.js
import { apiClient } from './apiClient';

export const dataPlansService = {
  /**
   * Get available data plans for a network
   * @param {string} serviceId - Network provider (mtn, airtel, glo, 9mobile, smile)
   * @returns {Promise<Object>} Available data plans
   */
  async getDataPlans(serviceId) {
    try {
      console.log('📋 Fetching data plans for:', this.getNetworkDisplayName(serviceId));

      // POST request with JSON body - service_id in lowercase
      const response = await apiClient.post('/plans/plans', {
        service_id: serviceId.toLowerCase()
      });

      if (response.success && response.data) {
        // ✅ FIXED: Access the nested data object
        const apiData = response.data.data || response.data; // Handle both structures
        
        console.log('✅ Data plans fetched successfully:', {
          network: this.getNetworkDisplayName(serviceId),
          plans_count: apiData.plans_by_provider?.[serviceId.toLowerCase()]?.length || 0,
          total_available: apiData.total_available_plans,
          total_all: apiData.total_all_plans
        });

        // Extract plans for the specific service from the grouped response
        const servicePlans = apiData.plans_by_provider?.[serviceId.toLowerCase()] || [];

        // Transform the plans from API format to client format
        const transformedPlans = servicePlans.map(plan => ({
          variationId: plan.variation_id,
          serviceName: plan.service_name,
          serviceId: plan.service_id,
          name: plan.data_plan,
          description: plan.data_plan,
          dataAllowance: this.formatDataAllowance(plan.data_plan),
          price: plan.price,
          formattedPrice: plan.price_formatted,
          formattedData: this.formatDataAllowance(plan.data_plan),
          availability: plan.availability,
          network: serviceId.toLowerCase(),
          validity: this.extractValidityFromDataPlan(plan.data_plan),
          originalData: plan // Keep original for reference
        }));

        // Categorize plans for modal display
        const categorizedPlans = this.categorizePlans(transformedPlans);

        return {
          success: true,
          data: transformedPlans,
          categorized: categorizedPlans,
          meta: {
            totalPlans: transformedPlans.length,
            serviceId: serviceId.toLowerCase(),
            serviceName: servicePlans[0]?.service_name || this.getNetworkDisplayName(serviceId),
            totalAvailable: apiData.total_available_plans,
            totalAll: apiData.total_all_plans,
            filterApplied: apiData.filter_applied
          },
          message: response.data.message || response.message || 'Data plans loaded successfully'
        };
      } else {
        const backendMessage = response.error || response.message || 'Failed to load data plans';
        const errorCode = this.generateErrorCode(backendMessage);
        
        console.log('❌ Failed to fetch data plans:', {
          backend_message: backendMessage,
          error_code: errorCode,
          network: serviceId
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Data plans fetch network error:', {
        error: error.message,
        network: serviceId,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      // Handle specific backend error responses
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorCode = this.generateErrorCode(errorData.error || errorData.message);
        
        return {
          success: false,
          error: errorCode,
          message: errorData.message || 'Failed to load data plans',
          data: []
        };
      }
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to load data plans. Please check your connection.',
        data: []
      };
    }
  },

  /**
   * Extract validity period from data plan name
   * @param {string} dataPlan - Data plan name from API
   * @returns {string} Extracted validity period
   */
  extractValidityFromDataPlan(dataPlan) {
    if (!dataPlan) return '30 days'; // Default
    
    const plan = dataPlan.toLowerCase();
    
    // Look for common validity patterns in plan names
    if (plan.includes('daily') || plan.includes('1day') || plan.includes('24hrs') || plan.includes('24 hours')) {
      return '1 day';
    }
    if (plan.includes('weekly') || plan.includes('7days') || plan.includes('1week') || plan.includes('7 days')) {
      return '7 days';
    }
    if (plan.includes('monthly') || plan.includes('30days') || plan.includes('1month') || plan.includes('30 days')) {
      return '30 days';
    }
    if (plan.includes('90days') || plan.includes('3months') || plan.includes('90 days')) {
      return '90 days';
    }
    if (plan.includes('yearly') || plan.includes('365days') || plan.includes('1year') || plan.includes('365 days')) {
      return '365 days';
    }
    
    // Try to extract number + time unit
    const patterns = [
      /(\d+)\s*days?/i,
      /(\d+)\s*weeks?/i,
      /(\d+)\s*months?/i,
      /(\d+)d/i,
      /(\d+)w/i,
      /(\d+)m/i
    ];
    
    for (const pattern of patterns) {
      const match = plan.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (pattern.source.includes('week') || pattern.source.includes('w')) {
          return `${number * 7} days`;
        } else if (pattern.source.includes('month') || pattern.source.includes('m')) {
          return `${number * 30} days`;
        } else {
          return `${number} days`;
        }
      }
    }
    
    return '30 days'; // Default fallback
  },

  /**
   * Categorize plans by validity period for modal display
   * @param {Array} plans - Array of data plans
   * @returns {Object} Categorized plans
   */
  categorizePlans(plans) {
    const categorized = {
      daily: [],
      weekly: [],
      monthly: [],
      other: []
    };

    plans.forEach(plan => {
      const validity = plan.validity.toLowerCase();
      
      if (validity.includes('1 day') || validity === '1 day') {
        categorized.daily.push(plan);
      } else if (validity.includes('7 days') || validity.includes('week')) {
        categorized.weekly.push(plan);
      } else if (validity.includes('30 days') || validity.includes('month')) {
        categorized.monthly.push(plan);
      } else {
        categorized.other.push(plan);
      }
    });

    return categorized;
  },

  /**
   * Generate standardized error code from backend error message
   * @param {string} errorMessage - Error message from backend
   * @returns {string} Standardized error code
   */
  generateErrorCode(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'FETCH_FAILED';
    }
    
    const message = errorMessage.toLowerCase().trim();
    
    // Service ID related errors
    if (message.includes('invalid service id') || message.includes('invalid service_id')) {
      return 'INVALID_SERVICE_ID';
    }
    
    // No plans available
    if (message.includes('no product') || message.includes('no plans') || message.includes('no data plans')) {
      return 'NO_PLANS_AVAILABLE';
    }
    
    // eBills API related errors
    if (message.includes('ebills') || message.includes('ebills api')) {
      return 'EBILLS_API_ERROR';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'REQUEST_TIMEOUT';
    }
    
    // Service unavailable
    if (message.includes('service unavailable') || 
        message.includes('temporarily unavailable') ||
        message.includes('service error')) {
      return 'SERVICE_ERROR';
    }
    
    // Authentication related
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'UNAUTHORIZED';
    }
    
    // Network related errors
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    // Server errors
    if (message.includes('internal server error') || message.includes('server error')) {
      return 'SERVER_ERROR';
    }
    
    // Default fallback
    return 'FETCH_FAILED';
  },

  /**
   * Get network provider display name
   * @param {string} serviceId - Service ID (mtn, airtel, glo, 9mobile, smile)
   * @returns {string} Display name
   */
  getNetworkDisplayName(serviceId) {
    const networkNames = {
      'mtn': 'MTN',
      'airtel': 'Airtel',
      'glo': 'Glo',
      '9mobile': '9mobile',
      'smile': 'Smile'
    };
    
    return networkNames[serviceId?.toLowerCase()] || (serviceId || 'Unknown');
  },

  /**
   * Format data allowance for display
   * @param {string} dataPlan - Data plan name (e.g., "1GB Monthly Data")
   * @returns {string} Formatted data allowance (e.g., "1 GB")
   */
  formatDataAllowance(dataPlan) {
    if (!dataPlan) return '';
    
    // Extract data amount from plan name (e.g., "1GB Monthly" -> "1GB")
    const dataMatch = dataPlan.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB|KB)/i);
    if (dataMatch) {
      const amount = dataMatch[1];
      const unit = dataMatch[2].toUpperCase();
      return `${amount} ${unit}`;
    }
    
    // If no clear data amount found, try to clean up the plan name
    return dataPlan.replace(/\s*(monthly|weekly|daily|days?|weeks?|months?)/gi, '').trim();
  },

  /**
   * Get formatted plans for modal display
   * @param {Array} plans - Array of data plans
   * @returns {Object} Formatted plans by category
   */
  getModalFormattedPlans(plans) {
    const categorized = this.categorizePlans(plans);
    
    const formatPlansForModal = (planArray) => planArray.map(plan => ({
      id: plan.variationId,
      data: plan.dataAllowance,
      duration: plan.validity,
      price: plan.price,
      formattedPrice: plan.formattedPrice,
      originalPlan: plan
    }));

    return {
      daily: formatPlansForModal(categorized.daily),
      weekly: formatPlansForModal(categorized.weekly),
      monthly: formatPlansForModal(categorized.monthly),
      other: formatPlansForModal(categorized.other)
    };
  },

  /**
   * Search data plans by query
   * @param {Array} plans - Array of data plans
   * @param {string} query - Search query
   * @returns {Array} Filtered data plans
   */
  searchPlans(plans, query) {
    if (!query || !query.trim()) {
      return plans;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(searchTerm) ||
      plan.dataAllowance.toLowerCase().includes(searchTerm) ||
      plan.formattedPrice.toLowerCase().includes(searchTerm) ||
      plan.validity.toLowerCase().includes(searchTerm) ||
      plan.price.toString().includes(searchTerm)
    );
  },

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} fallbackMessage - Fallback message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorCode, fallbackMessage = 'Something went wrong') {
    const errorMessages = {
      'INVALID_SERVICE_ID': 'Invalid network selected. Please choose a different network.',
      'NO_PLANS_AVAILABLE': 'No data plans are available for this network at the moment.',
      'EBILLS_API_ERROR': 'Data plans service is temporarily unavailable.',
      'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'SERVICE_ERROR': 'Service is temporarily unavailable.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'FETCH_FAILED': 'Failed to load data plans. Please try again.',
      'UNAUTHORIZED': 'Authentication required. Please log in again.'
    };
    
    return errorMessages[errorCode] || fallbackMessage;
  }
};