// services/customerService.js
import { apiClient } from './apiClient';

/**
 * Customer verification service
 * Handles customer information verification for various services
 */
class CustomerService {
  
  // Service categories and their valid services
  static ELECTRICITY_SERVICES = [
    'ikeja-electric', 'eko-electric', 'kano-electric', 'portharcourt-electric',
    'jos-electric', 'ibadan-electric', 'kaduna-electric', 'abuja-electric',
    'enugu-electric', 'benin-electric', 'aba-electric', 'yola-electric'
  ];

  static CABLE_TV_SERVICES = ['dstv', 'gotv', 'startimes', 'showmax'];

  static VALID_METER_TYPES = ['prepaid', 'postpaid'];

  /**
   * Validate customer verification request
   * @param {Object} verificationData - Customer verification data
   * @returns {Object} Validation result
   */
  validateVerificationData(verificationData) {
    const errors = [];
    
    // Check required fields
    if (!verificationData.customer_id) {
      errors.push('Customer ID is required');
    } else if (typeof verificationData.customer_id !== 'string' || verificationData.customer_id.trim().length === 0) {
      errors.push('Customer ID must be a non-empty string');
    } else if (verificationData.customer_id.trim().length < 8) {
      errors.push('Customer ID must be at least 8 characters long');
    }
    
    if (!verificationData.service_id) {
      errors.push('Service ID is required');
    } else {
      const allValidServices = [
        ...CustomerService.ELECTRICITY_SERVICES, 
        ...CustomerService.CABLE_TV_SERVICES
      ];
      if (!allValidServices.includes(verificationData.service_id)) {
        errors.push(`Invalid service ID. Must be one of: ${allValidServices.join(', ')}`);
      }
    }
    
    // Check if variation_id is required for electricity services
    if (CustomerService.ELECTRICITY_SERVICES.includes(verificationData.service_id)) {
      if (!verificationData.variation_id) {
        errors.push('Variation ID (meter type) is required for electricity services');
      } else if (!CustomerService.VALID_METER_TYPES.includes(verificationData.variation_id)) {
        errors.push('Variation ID must be "prepaid" or "postpaid" for electricity services');
      }
    }
    
    // variation_id should not be provided for non-electricity services
    if (!CustomerService.ELECTRICITY_SERVICES.includes(verificationData.service_id) && verificationData.variation_id) {
      errors.push('Variation ID should not be provided for non-electricity services');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Determine service category from service ID
   * @param {string} serviceId - Service identifier
   * @returns {string} Service category
   */
  getServiceCategory(serviceId) {
    if (CustomerService.ELECTRICITY_SERVICES.includes(serviceId)) return 'electricity';
    if (CustomerService.CABLE_TV_SERVICES.includes(serviceId)) return 'cable_tv';
    return 'unknown';
  }

  /**
   * Validate customer ID format
   * @param {string} customerId - Customer ID to validate
   * @param {string} serviceCategory - Service category
   * @returns {boolean} True if valid customer ID
   */
  validateCustomerId(customerId, serviceCategory = 'electricity') {
    if (!customerId || typeof customerId !== 'string') return false;
    
    const trimmedId = customerId.trim();
    
    switch (serviceCategory) {
      case 'electricity':
        // Meter numbers: typically 10-15 digits
        return /^\d{8,15}$/.test(trimmedId);
      case 'cable_tv':
        // Smart card numbers: typically 10-12 digits
        return /^\d{10,12}$/.test(trimmedId);
      default:
        return trimmedId.length >= 8;
    }
  }

  /**
   * Format customer ID for display
   * @param {string} customerId - Customer ID to format
   * @param {string} serviceCategory - Service category
   * @returns {string} Formatted customer ID
   */
  formatCustomerId(customerId, serviceCategory = 'electricity') {
    if (!customerId) return '';
    
    const trimmedId = customerId.trim();
    
    switch (serviceCategory) {
      case 'electricity':
        // Format meter number: 1234 5678 90
        return trimmedId.replace(/(\d{4})/g, '$1 ').trim();
      case 'cable_tv':
        // Format smart card: 1234-5678-90
        return trimmedId.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
      default:
        return trimmedId;
    }
  }

  /**
   * Get service display name
   * @param {string} serviceId - Service identifier
   * @returns {string} Service display name
   */
  getServiceDisplayName(serviceId) {
    const serviceNames = {
      // Electricity services
      'ikeja-electric': 'Ikeja Electric (IE)',
      'eko-electric': 'Eko Electric (EKEDC)',
      'kano-electric': 'Kano Electric (KEDCO)',
      'portharcourt-electric': 'Port Harcourt Electric (PHED)',
      'jos-electric': 'Jos Electric (JED)',
      'ibadan-electric': 'Ibadan Electric (IBEDC)',
      'kaduna-electric': 'Kaduna Electric (KAEDCO)',
      'abuja-electric': 'Abuja Electric (AEDC)',
      'enugu-electric': 'Enugu Electric (EEDC)',
      'benin-electric': 'Benin Electric (BEDC)',
      'aba-electric': 'Aba Electric (AEC)',
      'yola-electric': 'Yola Electric (YEDC)',
      
      // Cable TV services
      'dstv': 'DStv',
      'gotv': 'GOtv',
      'startimes': 'StarTimes',
      'showmax': 'Showmax'
    };
    
    return serviceNames[serviceId] || serviceId;
  }

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} originalMessage - Original error message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorCode, originalMessage) {
    const friendlyMessages = {
      'CUSTOMER_NOT_FOUND': 'Customer not found. Please check your details and try again.',
      'INVALID_CUSTOMER_ID': 'Invalid customer ID format. Please check and try again.',
      'INVALID_SERVICE_ID': 'Invalid service provider. Please select a valid provider.',
      'INVALID_VARIATION_ID': 'Invalid meter type. Please select prepaid or postpaid.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'TIMEOUT': 'Request timed out. Please try again.',
      'UNAUTHORIZED': 'Authentication failed. Please log in again.',
      'SERVICE_UNAVAILABLE': 'Customer verification service is temporarily unavailable.',
      'VERIFICATION_API_ERROR': 'Unable to verify customer information at this time.',
      'VERIFICATION_TIMEOUT': 'Customer verification request timed out. Please try again.',
      'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.'
    };
    
    return friendlyMessages[errorCode] || originalMessage || 'An unexpected error occurred';
  }

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
  }

  /**
   * Format customer name for display
   * @param {string} customerName - Customer name
   * @returns {string} Formatted customer name
   */
  formatCustomerName(customerName) {
    if (!customerName) return 'N/A';
    
    return customerName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format customer address for display
   * @param {string} customerAddress - Customer address
   * @returns {string} Formatted customer address
   */
  formatCustomerAddress(customerAddress) {
    if (!customerAddress) return 'N/A';
    
    // Capitalize first letter and trim extra spaces
    return customerAddress.trim().charAt(0).toUpperCase() + customerAddress.trim().slice(1);
  }

  /**
   * Check if customer has outstanding balance
   * @param {Object} customerData - Customer data
   * @returns {boolean} True if customer has outstanding balance
   */
  hasOutstandingBalance(customerData) {
    return !!(
      customerData?.customer_arrears > 0 || 
      customerData?.outstanding > 0 ||
      customerData?.purchase_info?.outstanding_amount > 0
    );
  }

  /**
   * Get outstanding amount
   * @param {Object} customerData - Customer data
   * @returns {number} Outstanding amount
   */
  getOutstandingAmount(customerData) {
    return customerData?.customer_arrears || 
           customerData?.outstanding || 
           customerData?.purchase_info?.outstanding_amount || 
           0;
  }

  /**
   * Get minimum purchase amount
   * @param {Object} customerData - Customer data
   * @returns {number} Minimum purchase amount
   */
  getMinimumAmount(customerData) {
    return customerData?.min_purchase_amount || 
           customerData?.purchase_info?.min_amount ||
           customerData?.minimum_amount ||
           1000;
  }

  /**
   * Get maximum purchase amount
   * @param {Object} customerData - Customer data
   * @returns {number} Maximum purchase amount
   */
  getMaximumAmount(customerData) {
    return customerData?.max_purchase_amount || 
           customerData?.purchase_info?.max_amount ||
           customerData?.maximum_amount ||
           100000;
  }

  /**
   * Verify customer information for a given service
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Verification result
   */
  async verifyCustomer(params) {
    try {
      const response = await apiClient.post('/verifybill/customer', params);
      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (error.response?.data) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Customer verification failed');
      }
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      if (error.code === 'TIMEOUT') {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Verify electricity customer
   * @param {string} customerId - Customer/meter number
   * @param {string} serviceId - Electricity service ID
   * @param {string} meterType - Meter type (prepaid/postpaid)
   * @returns {Promise<Object>} Verification result
   */
  async verifyElectricityCustomer(customerId, serviceId, meterType) {
    return this.verifyCustomer({
      customer_id: customerId,
      service_id: serviceId,
      variation_id: meterType
    });
  }

  /**
   * Verify cable TV customer using dedicated PayBeta endpoint
   * @param {string} customerId - Smart card number
   * @param {string} serviceId - Cable TV service ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyCableTVCustomer(customerId, serviceId) {
    try {
      const response = await apiClient.post('/verifycabletv/verify', {
        service_id: serviceId,
        customer_id: customerId,
        service: serviceId,
        smartCardNumber: customerId
      });

      const payload = response.data || {};
      return {
        ...payload,
        success: payload.status?.toLowerCase?.() === 'successful'
      };
    } catch (error) {
      // Handle different types of errors
      if (error.response?.data) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Cable TV customer verification failed');
      }
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      if (error.code === 'TIMEOUT') {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Get available electricity services
   * @returns {Array} Electricity services
   */
  getElectricityServices() {
    return CustomerService.ELECTRICITY_SERVICES.map(serviceId => ({
      id: serviceId,
      name: this.getServiceDisplayName(serviceId),
      category: 'electricity'
    }));
  }

  /**
   * Get available cable TV services
   * @returns {Array} Cable TV services
   */
  getCableTVServices() {
    return CustomerService.CABLE_TV_SERVICES.map(serviceId => ({
      id: serviceId,
      name: this.getServiceDisplayName(serviceId),
      category: 'cable_tv'
    }));
  }

  /**
   * Get all available services
   * @returns {Array} All services
   */
  getAllServices() {
    return [
      ...this.getElectricityServices(),
      ...this.getCableTVServices()
    ];
  }

  /**
   * Get meter types for electricity
   * @returns {Array} Meter types
   */
  getMeterTypes() {
    return [
      { id: 'prepaid', name: 'Prepaid', description: 'Pay before use' },
      { id: 'postpaid', name: 'Postpaid', description: 'Pay after use' }
    ];
  }
}

export const customerService = new CustomerService();