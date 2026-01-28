// services/dataService.js
import { apiClient } from './apiClient';

export const dataService = {
  /**
   * Purchase data
   * @param {Object} purchaseData - Data purchase data
   * @param {string} purchaseData.phone - Phone number
   * @param {string} purchaseData.service_id - Network provider (mtn, airtel, glo, 9mobile)
   * @param {string} purchaseData.variation_id - Data plan variation ID
   * @param {number} purchaseData.amount - Amount to purchase
   * @param {string} purchaseData.twoFactorCode - 2FA code
   * @param {string} purchaseData.passwordpin - 6-digit password PIN
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseData(purchaseData) {
    try {
      console.log('📊 Starting data purchase:', {
        phone: purchaseData.phone,
        service_id: purchaseData.service_id,
        variation_id: purchaseData.variation_id,
        amount: purchaseData.amount,
        network: this.getNetworkDisplayName(purchaseData.service_id)
      });

      // FIXED: Use same field names as airtime and electricity endpoints
      const response = await apiClient.post('/data/purchase', {
        phone: purchaseData.phone,                                    // FIXED: Changed from phone_number to phone
        service_id: purchaseData.service_id.toLowerCase(),
        variation_id: purchaseData.variation_id,                      // FIXED: Removed service_type field
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNZ',                                     // FIXED: Changed from NGNB to NGNZ
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin
      });

      // Handle successful response
      if (response.success && response.data) {
        console.log('✅ Data purchase successful:', {
          order_id: response.data.order_id,
          status: response.data.status,
          phone: response.data.phone,
          amount: response.data.amount,
          service_name: response.data.service_name,
          plan_details: response.data.plan_details
        });

        return {
          success: true,
          data: {
            orderId: response.data.order_id,
            status: response.data.status,
            phone: response.data.phone,
            amount: response.data.amount,
            serviceName: response.data.service_name,
            requestId: response.data.request_id,
            balanceAction: response.data.balance_action,
            planDetails: response.data.plan_details,
            paymentDetails: response.data.payment_details,
            securityInfo: response.data.security_info,
            message: response.message || 'Data purchase successful'
          }
        };
      } 
      
      // Handle error response - pass backend error directly
      else {
        // Use backend error message directly, no transformation
        const backendMessage = response.error || response.message || 'Data purchase failed';
        
        console.log('❌ Data purchase failed:', {
          backend_message: backendMessage,
          status: response.status || 400
        });

        return {
          success: false,
          error: backendMessage, // Direct backend error message
          message: backendMessage, // Same message for consistency
          status: response.status || 400
          // Removed requiresAction mapping
        };
      }

    } catch (error) {
      console.error('❌ Data service network error:', {
        error: error.message,
        type: 'NETWORK_ERROR'
      });
      
      return {
        success: false,
        error: error.message, // Network error message directly
        message: error.message // Same for consistency
      };
    }
  },

  /**
   * Get available data plans for a network
   * @param {string} serviceId - Network provider (mtn, airtel, glo, 9mobile)
   * @returns {Promise<Object>} Available data plans
   */
  async getDataPlans(serviceId) {
    try {
      console.log('📋 Fetching data plans for:', this.getNetworkDisplayName(serviceId));

      // FIXED: Use correct endpoint and payload format to match your backend
      const response = await apiClient.post('/plans/plans', {
        service_id: `${serviceId.toLowerCase()}_data`
      });

      if (response.success && response.data) {
        // Handle the nested data structure from the backend
        const apiData = response.data.data || response.data;
        
        console.log('✅ Data plans fetched successfully:', {
          network: this.getNetworkDisplayName(serviceId),
          plans_count: apiData.plans_by_provider?.[`${serviceId.toLowerCase()}_data`]?.length || 0
        });

        // Extract plans for the specific service from the grouped response
        const servicePlans = apiData.plans_by_provider?.[`${serviceId.toLowerCase()}_data`] || [];

        return {
          success: true,
          data: servicePlans.map(plan => ({
            variationId: plan.variation_id,
            name: plan.data_plan,
            description: plan.data_plan,
            price: parseFloat(plan.price),
            dataAllowance: this.formatDataAllowance(plan.data_plan),
            validity: this.extractValidityFromDataPlan(plan.data_plan),
            network: serviceId.toLowerCase(),
            formattedPrice: plan.price_formatted,
            formattedData: this.formatDataAllowance(plan.data_plan)
          })),
          message: response.message || 'Data plans loaded successfully'
        };
      } else {
        const backendMessage = response.error || 'Failed to load data plans';
        
        console.log('❌ Failed to fetch data plans:', {
          backend_message: backendMessage,
          network: serviceId
        });

        return {
          success: false,
          error: backendMessage, // Direct backend error message
          message: backendMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Data plans fetch network error:', {
        error: error.message,
        network: serviceId
      });
      
      return {
        success: false,
        error: error.message, // Network error message directly
        message: error.message,
        data: []
      };
    }
  },

  /**
   * Validate data purchase data
   * @param {Object} data - Purchase data to validate
   * @returns {Object} Validation result with errors array
   */
  validatePurchaseData(data) {
    const errors = [];

    // Phone number validation
    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    } else {
      const phone = data.phone.replace(/\D/g, '');
      if (phone.length < 10) {
        errors.push('Phone number is too short');
      } else if (phone.length > 16) {
        errors.push('Phone number is too long');
      } else if (!this.isValidNigerianPhone(phone)) {
        errors.push('Please enter a valid Nigerian phone number');
      }
    }

    // Network provider validation
    if (!data.service_id?.trim()) {
      errors.push('Network provider is required');
    } else {
      const validNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
      if (!validNetworks.includes(data.service_id.toLowerCase())) {
        errors.push('Please select a valid network provider');
      }
    }

    // Data plan validation
    if (!data.variation_id?.trim()) {
      errors.push('Data plan selection is required');
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 99) {
      errors.push('Minimum data purchase is ₦99');
    } else if (amount > 50000) {
      errors.push('Maximum data purchase is ₦50,000');
    }

    // 2FA code validation
    if (!data.twoFactorCode?.trim()) {
      errors.push('Two-factor authentication code is required');
    } else {
      const code = data.twoFactorCode.trim();
      if (!/^\d{6}$/.test(code)) {
        errors.push('2FA code must be exactly 6 digits');
      }
    }

    // Password PIN validation
    if (!data.passwordpin?.trim()) {
      errors.push('Password PIN is required');
    } else {
      const pin = data.passwordpin.trim();
      if (!/^\d{6}$/.test(pin)) {
        errors.push('Password PIN must be exactly 6 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Check if phone number is a valid Nigerian number
   * @param {string} phone - Phone number (digits only)
   * @returns {boolean} True if valid Nigerian number
   */
  isValidNigerianPhone(phone) {
    // Nigerian phone number patterns
    const patterns = [
      /^234[7-9]\d{9}$/,     // +234 format (234 + 7/8/9 + 9 digits)
      /^0[7-9]\d{9}$/,       // 0 format (0 + 7/8/9 + 9 digits)
      /^[7-9]\d{9}$/         // Raw format (7/8/9 + 9 digits)
    ];
    
    return patterns.some(pattern => pattern.test(phone));
  },

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to standard 0XXXXXXXXXX format for display
    if (cleaned.startsWith('234')) {
      return `0${cleaned.slice(3)}`;
    } else if (cleaned.startsWith('0')) {
      return cleaned;
    } else if (cleaned.length === 10 && /^[7-9]/.test(cleaned)) {
      return `0${cleaned}`;
    } else {
      return phone; // Return as-is if can't format
    }
  },

  /**
   * Get network provider display name
   * @param {string} serviceId - Service ID (mtn, airtel, glo, 9mobile)
   * @returns {string} Display name
   */
  getNetworkDisplayName(serviceId) {
    const networkNames = {
      'mtn': 'MTN',
      'airtel': 'Airtel',
      'glo': 'Glo',
      '9mobile': '9mobile'
    };
    
    return networkNames[serviceId?.toLowerCase()] || (serviceId || 'Unknown');
  },

  /**
   * Get network provider color theme
   * @param {string} serviceId - Service ID
   * @returns {string} Brand color
   */
  getNetworkColor(serviceId) {
    const networkColors = {
      'mtn': '#FFCC02',      // MTN Yellow
      'airtel': '#FF0000',   // Airtel Red
      'glo': '#00A651',      // Glo Green
      '9mobile': '#00AA4F'   // 9mobile Green
    };
    
    return networkColors[serviceId?.toLowerCase()] || '#6B7280';
  },

  /**
   * Format amount for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount with currency
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₦0.00';
    
    return `₦${numAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  /**
   * Format data allowance for display
   * @param {string} dataAllowance - Data allowance (e.g., "1GB", "500MB")
   * @returns {string} Formatted data allowance
   */
  formatDataAllowance(dataAllowance) {
    if (!dataAllowance) return '';
    
    // Clean up the data allowance string
    const cleaned = dataAllowance.toString().toUpperCase().trim();
    
    // Add space between number and unit if missing
    return cleaned.replace(/(\d)([A-Z])/g, '$1 $2');
  },

  /**
   * Parse data allowance to get numeric value for sorting
   * @param {string} dataAllowance - Data allowance (e.g., "1GB", "500MB")
   * @returns {number} Numeric value in MB for comparison
   */
  parseDataAllowanceToMB(dataAllowance) {
    if (!dataAllowance) return 0;
    
    const cleaned = dataAllowance.toString().toUpperCase().trim();
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB|TB)/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'TB': return value * 1024 * 1024;
      case 'GB': return value * 1024;
      case 'MB': return value;
      case 'KB': return value / 1024;
      default: return 0;
    }
  },

  /**
   * Sort data plans by price (ascending)
   * @param {Array} plans - Array of data plans
   * @returns {Array} Sorted data plans
   */
  sortPlansByPrice(plans) {
    return [...plans].sort((a, b) => a.price - b.price);
  },

  /**
   * Sort data plans by data allowance (ascending)
   * @param {Array} plans - Array of data plans
   * @returns {Array} Sorted data plans
   */
  sortPlansByData(plans) {
    return [...plans].sort((a, b) => {
      const aValue = this.parseDataAllowanceToMB(a.dataAllowance);
      const bValue = this.parseDataAllowanceToMB(b.dataAllowance);
      return aValue - bValue;
    });
  },

  /**
   * Filter data plans by price range
   * @param {Array} plans - Array of data plans
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} Filtered data plans
   */
  filterPlansByPriceRange(plans, minPrice, maxPrice) {
    return plans.filter(plan => plan.price >= minPrice && plan.price <= maxPrice);
  },

  /**
   * Get popular data plan amounts/ranges
   * @returns {Array} Array of popular data plan ranges
   */
  getPopularDataRanges() {
    return [
      { id: 'daily', label: 'Daily Plans', priceRange: [50, 500], popular: true },
      { id: 'weekly', label: 'Weekly Plans', priceRange: [300, 1500], popular: true },
      { id: 'monthly', label: 'Monthly Plans', priceRange: [1000, 15000], popular: true },
      { id: 'premium', label: 'Premium Plans', priceRange: [10000, 50000], popular: false }
    ];
  },

  /**
   * Get validity period display text
   * @param {string} validity - Validity period from API
   * @returns {string} Formatted validity text
   */
  formatValidityPeriod(validity) {
    if (!validity) return '';
    
    // Common validity patterns
    const patterns = {
      '1 day': '24 hours',
      '7 days': '1 week',
      '30 days': '1 month',
      '90 days': '3 months',
      '365 days': '1 year'
    };
    
    const cleaned = validity.toString().toLowerCase().trim();
    return patterns[cleaned] || validity;
  }
};