// services/KYCService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-backend-domain.com'; // Replace with your actual backend URL

class KYCService {
  
  // Get auth token from storage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Make authenticated API calls
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      console.log(`📡 API Call: ${method} ${endpoint}`, data ? { data } : '');

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, result);
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ API Success: ${method} ${endpoint}`, result);
      return result;
    } catch (error) {
      console.error(`💥 API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // 1. Initiate KYC process
  async initiateKYC(kycLevel, documentType = null) {
    return this.makeRequest('/kyc/initiate', 'POST', {
      kycLevel: parseInt(kycLevel),
      documentType
    });
  }

  // 2. Process OCR results
  async processOCRResults(customerReference, ocrData) {
    return this.makeRequest('/kyc/process-ocr', 'POST', {
      customerReference,
      ocrData
    });
  }

  // 3. Get KYC status
  async getKYCStatus() {
    return this.makeRequest('/kyc/status');
  }

  // 4. Get detailed limits
  async getDetailedLimits() {
    return this.makeRequest('/kyc/limits-detailed');
  }

  // 5. Validate transaction
  async validateTransaction(amount, currency = 'NGNB', transactionType = 'WITHDRAWAL') {
    return this.makeRequest('/kyc/validate-transaction', 'POST', {
      amount,
      currency,
      transactionType
    });
  }

  // 6. Test currency conversion
  async testConversion(amount, currency) {
    return this.makeRequest('/kyc/test-conversion', 'POST', {
      amount,
      currency
    });
  }

  // 7. Clear cache
  async clearCache() {
    return this.makeRequest('/kyc/clear-cache', 'POST');
  }
}

// Export singleton instance  
export default new KYCService();