import { useCallback, useState } from 'react';
import { customerService } from '../services/customerService';

// Match backend service IDs exactly
const ELECTRICITY_SERVICES = [
  'ikeja-electric', 'eko-electric', 'kano-electric', 'portharcourt-electric',
  'jos-electric', 'ibadan-electric', 'kaduna-electric', 'abuja-electric',
  'enugu-electric', 'benin-electric', 'aba-electric', 'yola-electric'
];

const CABLE_TV_SERVICES = ['dstv', 'gotv', 'startimes', 'showmax'];

const BETTING_SERVICES = [
  '1xBet', 'BangBet', 'Bet9ja', 'BetKing', 'BetLand', 'BetLion',
  'BetWay', 'CloudBet', 'LiveScoreBet', 'MerryBet', 'NaijaBet',
  'NairaBet', 'SupaBet'
];

export const useCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(null);

  /** Utility: Get service category */
  const getServiceCategory = (serviceId) => {
    if (ELECTRICITY_SERVICES.includes(serviceId)) return 'electricity';
    if (CABLE_TV_SERVICES.includes(serviceId)) return 'cable_tv';
    if (BETTING_SERVICES.includes(serviceId)) return 'betting';
    return 'unknown';
  };

  /** Clear errors & data */
  const clearError = useCallback(() => setError(null), []);
  const clearCustomerData = useCallback(() => setCustomerData(null), []);

  /** MAIN: Verify customer (electricity/cable/betting) */
  const verifyCustomer = useCallback(async (customerId, serviceId, variationId = null) => {
    if (!customerId?.trim()) {
      setError('INVALID_CUSTOMER_ID');
      return { success: false, error: 'INVALID_CUSTOMER_ID', message: 'Customer ID is required' };
    }
    if (!serviceId?.trim()) {
      setError('INVALID_SERVICE_ID');
      return { success: false, error: 'INVALID_SERVICE_ID', message: 'Service ID is required' };
    }

    const category = getServiceCategory(serviceId.trim());
    const params = { customer_id: customerId.trim(), service_id: serviceId.trim() };

    // Only add variation_id for electricity
    if (category === 'electricity' && variationId) {
      params.variation_id = variationId;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await customerService.verifyCustomer(params);
      console.log('🔍 Raw verification response:', response);

      if (response && response.success) {
        const normalizedData = {
          customer_name: response.data?.customer_name || response.data?.CustomerName || '',
          ...response.data
        };
        setCustomerData(normalizedData);
        setSelectedService(serviceId);
        setSelectedServiceCategory(category);
        return { success: true, data: normalizedData };
      } else {
        const errorMessage = response?.message || 'Customer verification failed';
        setError('VERIFICATION_FAILED');
        return { success: false, error: 'VERIFICATION_FAILED', message: errorMessage };
      }
    } catch (err) {
      console.error('❌ Customer verification error:', err);
      setError('VERIFICATION_ERROR');
      return { success: false, error: 'VERIFICATION_ERROR', message: 'Unable to verify customer at this time.' };
    } finally {
      setLoading(false);
    }
  }, []);

  /** Wrapper for electricity */
  const verifyElectricityCustomer = useCallback((customerId, serviceId, meterType) => {
    return verifyCustomer(customerId, serviceId, meterType);
  }, [verifyCustomer]);

  /** Wrapper for cable */
  const verifyCableTVCustomer = useCallback(async (customerId, serviceId) => {
    if (!customerId?.trim()) {
      setError('INVALID_CUSTOMER_ID');
      return { success: false, error: 'INVALID_CUSTOMER_ID', message: 'Customer ID is required' };
    }
    if (!serviceId?.trim()) {
      setError('INVALID_SERVICE_ID');
      return { success: false, error: 'INVALID_SERVICE_ID', message: 'Service ID is required' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await customerService.verifyCableTVCustomer(customerId.trim(), serviceId.trim());
      console.log('🔍 Raw cable TV verification response:', response);

      if (response && response.success) {
        const normalizedData = {
          customer_name: response.data?.customer_name || response.data?.CustomerName || '',
          ...response.data
        };
        setCustomerData(normalizedData);
        setSelectedService(serviceId);
        setSelectedServiceCategory('cable_tv');
        return { success: true, data: normalizedData };
      } else {
        const errorMessage = response?.message || 'Cable TV customer verification failed';
        setError('VERIFICATION_FAILED');
        return { success: false, error: 'VERIFICATION_FAILED', message: errorMessage };
      }
    } catch (err) {
      console.error('❌ Cable TV customer verification error:', err);
      setError('VERIFICATION_ERROR');
      return { success: false, error: 'VERIFICATION_ERROR', message: 'Unable to verify cable TV customer at this time.' };
    } finally {
      setLoading(false);
    }
  }, []);

  /** Wrapper for betting */
  const verifyBettingCustomer = useCallback((customerId, serviceId) => {
    return verifyCustomer(customerId, serviceId);
  }, [verifyCustomer]);

  /** Format customer name for display */
  const formatCustomerName = useCallback((name) => {
    if (!name) return '';
    
    // Convert to string to handle any type issues
    const nameStr = String(name);
    
    // Check if the name is purely numeric (like SportyBet customer IDs)
    if (/^\d+$/.test(nameStr)) {
      return nameStr; // Return numeric names as-is
    }
    
    // For non-numeric names, apply normal formatting
    return nameStr
      .split(' ')
      .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  /** User-friendly error messages */
  const getUserFriendlyMessage = useCallback((errorCode, originalMessage) => {
    const messages = {
      INVALID_CUSTOMER_ID: 'Please enter a valid Customer ID.',
      INVALID_SERVICE_ID: 'Please select a valid service provider.',
      VERIFICATION_FAILED: 'Unable to verify customer details. Please check your information.',
      VERIFICATION_ERROR: 'An error occurred during verification. Please try again later.'
    };
    return messages[errorCode] || originalMessage || 'Verification failed. Please try again.';
  }, []);

  return {
    loading,
    error,
    customerData,
    selectedService,
    selectedServiceCategory,
    verifyCustomer,
    verifyElectricityCustomer,
    verifyCableTVCustomer,
    verifyBettingCustomer,
    clearError,
    clearCustomerData,
    setCustomerData,
    formatCustomerName,
    getUserFriendlyMessage
  };
};
