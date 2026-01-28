// services/cableTVService.js
import { apiClient } from './apiClient';

export const cableTVService = {
  /**
   * Purchase cable TV subscription
   * @param {Object} purchaseData - Cable TV purchase data
   * @returns {Promise<Object>} Purchase response
   */
  async purchaseCableTV(purchaseData) {
    try {
      console.log('📺 Starting cable TV purchase:', {
        customer_id: purchaseData.customer_id,
        service_id: purchaseData.service_id,
        variation_id: purchaseData.variation_id,
        subscription_type: purchaseData.subscription_type || 'change',
        amount: purchaseData.amount,
        provider: this.getProviderDisplayName(purchaseData.service_id)
      });

      const response = await apiClient.post('/cabletv/purchase', {
        customer_id: purchaseData.customer_id,
        service_id: purchaseData.service_id.toLowerCase(),
        variation_id: purchaseData.variation_id,
        subscription_type: purchaseData.subscription_type || 'change',
        amount: parseFloat(purchaseData.amount),
        payment_currency: 'NGNZ',
        twoFactorCode: purchaseData.twoFactorCode,
        passwordpin: purchaseData.passwordpin,
        customer_name: purchaseData.customer_name,
        reference: purchaseData.reference
      });

      if (response.success) {
        const data = response.data?.data || response.data;
        console.log('✅ Cable TV purchase successful:', data);
        return { 
          success: true, 
          data,
          message: response.message || 'Cable TV purchase successful'
        };
      } else {
        console.log('❌ Cable TV purchase failed:', response.data || response.error);
        return { 
          success: false, 
          ...response.data, // Spread the backend data (error code, message)
          error: response.error, 
          message: response.data?.message || response.error,
          status: response.status 
        };
      }
    } catch (error) {
      console.error('❌ Cable TV service network error:', error);
      return { 
        success: false, 
        error: error.message, 
        message: error.message 
      };
    }
  },

  // ... KEEP ALL THE REST OF YOUR EXISTING METHODS BELOW EXACTLY AS THEY ARE ...
  // Only change the purchaseCableTV method above
  getCableTVProviders() {
    return [
      { id: 'dstv', name: 'DStv', description: 'Digital Satellite Television' },
      { id: 'gotv', name: 'GOtv', description: 'Digital Terrestrial Television' },
      { id: 'startimes', name: 'StarTimes', description: 'Digital TV Entertainment' },
      { id: 'showmax', name: 'Showmax', description: 'Video Streaming Service' }
    ];
  },

  getSubscriptionTypes() {
    return [
      { 
        id: 'change', 
        name: 'Change Package', 
        description: 'Switch to a different package/bouquet' 
      },
      { 
        id: 'renew', 
        name: 'Renew Subscription', 
        description: 'Renew current package/bouquet' 
      }
    ];
  },

  validatePurchaseData(data) {
    const errors = [];

    // Customer ID (smartcard/IUC number) validation
    if (!data.customer_id?.trim()) {
      errors.push('Smartcard/IUC number is required');
    } else {
      const customerId = data.customer_id.trim();
      if (customerId.length < 8) {
        errors.push('Smartcard/IUC number must be at least 8 characters');
      } else if (customerId.length > 20) {
        errors.push('Smartcard/IUC number must not exceed 20 characters');
      } else if (!/^[a-zA-Z0-9]+$/.test(customerId)) {
        errors.push('Smartcard/IUC number can only contain letters and numbers');
      }
    }

    // Provider validation
    if (!data.service_id?.trim()) {
      errors.push('Cable TV provider is required');
    } else {
      const validProviders = this.getCableTVProviders().map(p => p.id);
      if (!validProviders.includes(data.service_id.toLowerCase())) {
        errors.push('Please select a valid cable TV provider');
      }
    }

    // Package/variation validation
    if (!data.variation_id?.trim()) {
      errors.push('Package/bouquet selection is required');
    } else {
      const variationId = data.variation_id.trim();
      if (variationId.length === 0) {
        errors.push('Package/bouquet must be selected');
      }
    }

    // Subscription type validation
    if (data.subscription_type) {
      const validTypes = ['change', 'renew'];
      if (!validTypes.includes(data.subscription_type.toLowerCase())) {
        errors.push('Subscription type must be "change" or "renew"');
      }
    }

    // Amount validation
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount)) {
      errors.push('Amount is required');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero');
    } else if (amount < 500) {
      errors.push('Minimum cable TV purchase amount is ₦500');
    } else if (amount > 50000) {
      errors.push('Maximum cable TV purchase amount is ₦50,000');
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

  validateCustomerId(customerId) {
    if (!customerId || typeof customerId !== 'string') return false;
    
    const cleaned = customerId.trim();
    
    // Basic validation: 8-20 characters, alphanumeric
    if (cleaned.length < 8 || cleaned.length > 20) return false;
    if (!/^[a-zA-Z0-9]+$/.test(cleaned)) return false;
    
    return true;
  },

  formatCustomerId(customerId) {
    if (!customerId) return '';
    
    const cleaned = customerId.toString().trim().replace(/[^a-zA-Z0-9]/g, '');
    
    // Add spaces every 4 characters for readability
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  },

  getProviderDisplayName(providerId) {
    const provider = this.getCableTVProviders().find(
      p => p.id.toLowerCase() === providerId?.toLowerCase()
    );
    
    return provider?.name || (providerId || 'Unknown Provider');
  },

  getProviderDescription(providerId) {
    const provider = this.getCableTVProviders().find(
      p => p.id.toLowerCase() === providerId?.toLowerCase()
    );
    
    return provider?.description || '';
  },

  getSubscriptionTypeDisplayName(subscriptionTypeId) {
    const subscriptionType = this.getSubscriptionTypes().find(
      t => t.id.toLowerCase() === subscriptionTypeId?.toLowerCase()
    );
    
    return subscriptionType?.name || (subscriptionTypeId || 'Unknown');
  },

  formatAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₦0.00';
    
    return `₦${numAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  getPurchaseLimits() {
    return {
      minimum: 500,
      maximum: 50000,
      currency: 'NGNZ',
      formattedMinimum: this.formatAmount(500),
      formattedMaximum: this.formatAmount(50000)
    };
  },

  getPopularAmounts() {
    return [
      { amount: 2500, label: '₦2,500', popular: true },
      { amount: 4000, label: '₦4,000', popular: true },
      { amount: 6300, label: '₦6,300', popular: true },
      { amount: 9000, label: '₦9,000', popular: true },
      { amount: 15700, label: '₦15,700', popular: true },
      { amount: 21000, label: '₦21,000', popular: false }
    ];
  },

  formatCustomerName(customerName) {
    if (!customerName) return '';
    
    return customerName.toString().trim();
  },

  getProviderIcon(providerId) {
    const iconMap = {
      'dstv': 'dstv-icon',
      'gotv': 'gotv-icon', 
      'startimes': 'startimes-icon',
      'showmax': 'showmax-icon'
    };
    
    return iconMap[providerId?.toLowerCase()] || 'default-tv-icon';
  },

  providerSupportsPackages(providerId) {
    // All cable TV providers support package selection
    const validProviders = this.getCableTVProviders().map(p => p.id);
    return validProviders.includes(providerId?.toLowerCase());
  },

  getDefaultSubscriptionType() {
    return 'change';
  }
};