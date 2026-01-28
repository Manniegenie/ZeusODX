// hooks/useCabletv.js
import { useCallback, useState } from 'react';
import { cableTVService } from '../services/cabletvService';

/**
 * Custom hook that encapsulates cable TV purchase logic/state
 * Mirrors the API surface expected by `app/user/CableTV.tsx`
 */
export const useCableTV = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState(() => cableTVService.getCableTVProviders());
  const [subscriptionTypes, setSubscriptionTypes] = useState(() => cableTVService.getSubscriptionTypes());
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  /** Clear last recorded error */
  const clearErrors = useCallback(() => setError(null), []);

  /** Retrieve and cache providers (currently static but keeps parity with other hooks) */
  const getCableTVProviders = useCallback(() => {
    const list = cableTVService.getCableTVProviders();
    setProviders(list);
    return list;
  }, []);

  /** Retrieve and cache subscription types */
  const getSubscriptionTypes = useCallback(() => {
    const types = cableTVService.getSubscriptionTypes();
    setSubscriptionTypes(types);
    return types;
  }, []);

  /** Select provider and reset package if provider changes */
  const selectProvider = useCallback((provider) => {
    setSelectedProvider(provider);
    // Reset dependent selections if provider cleared/changed
    if (!provider) {
      setSelectedPackage(null);
    }
  }, []);

  /** Select subscription type */
  const selectSubscriptionType = useCallback((subscriptionType) => {
    setSelectedSubscriptionType(subscriptionType);
  }, []);

  /** Select bouquet/package */
  const selectPackage = useCallback((pkg) => {
    setSelectedPackage(pkg);
  }, []);

  /**
   * Purchase cable TV package
   * Validates locally before making network request
   */
  const purchaseCableTV = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);

    try {
      const validation = cableTVService.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        const message = validation.errors?.[0] || 'Validation failed';
        setError(message);
        return {
          success: false,
          error: message, // Client-side validation error directly
          message: message,
          errors: validation.errors,
        };
      }

      const response = await cableTVService.purchaseCableTV(purchaseData);

      if (!response?.success) {
        // Set backend error message directly from service
        setError(response?.error || response?.message || 'Cable TV purchase failed');
      }

      return response;
    } catch (err) {
      console.error('❌ useCableTV: unexpected purchase error', err);
      const message = err?.message || 'Network request failed';
      setError(message);
      return {
        success: false,
        error: message, // Network error message directly
        message: message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /** Validation/format helpers passthrough */
  const validateCustomerId = useCallback((customerId) => cableTVService.validateCustomerId(customerId), []);
  const formatCustomerId = useCallback((customerId) => cableTVService.formatCustomerId(customerId), []);
  const getProviderDisplayName = useCallback(
    (providerId) => cableTVService.getProviderDisplayName(providerId),
    []
  );
  const formatAmount = useCallback((amount) => cableTVService.formatAmount(amount), []);

  /**
   * Quick form completeness check with optional overrides
   * NOTE: This is client-side validation only
   */
  const isFormComplete = useCallback(
    (overrides = {}) => {
      const {
        customerId,
        provider = selectedProvider,
        subscriptionType = selectedSubscriptionType,
        cablePackage = selectedPackage,
        amount = selectedPackage?.price,
        twoFactorCode,
        passwordpin,
      } = overrides;

      const hasValidCustomer = validateCustomerId(customerId ?? overrides?.smartcardNumber ?? '');
      const hasProvider = !!provider;
      const hasSubscriptionType = !!subscriptionType;
      const hasPackage = !!cablePackage;
      const hasAmount = !Number.isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
      const hasPin = passwordpin ? /^\d{6}$/.test(passwordpin) : true;
      const hasTwoFA = twoFactorCode ? /^\d{6}$/.test(twoFactorCode) : true;

      return hasValidCustomer && hasProvider && hasSubscriptionType && hasPackage && hasAmount && hasPin && hasTwoFA;
    },
    [selectedPackage, selectedProvider, selectedSubscriptionType, validateCustomerId]
  );

  /** Initialize hook state (providers + subscription types) */
  const initialize = useCallback(() => {
    getCableTVProviders();
    getSubscriptionTypes();
  }, [getCableTVProviders, getSubscriptionTypes]);

  return {
    loading,
    error, // This now holds the exact backend message (or client-side validation error)
    providers,
    selectedProvider,
    selectedSubscriptionType,
    selectedPackage,
    purchaseCableTV,
    getCableTVProviders,
    getSubscriptionTypes,
    selectProvider,
    selectSubscriptionType,
    selectPackage,
    clearErrors,
    validateCustomerId,
    formatCustomerId,
    getProviderDisplayName,
    formatAmount,
    isFormComplete,
    initialize,
  };
};

export default useCableTV;