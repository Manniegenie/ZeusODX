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
          error: 'VALIDATION_ERROR',
          message,
          errors: validation.errors,
        };
      }

      const response = await cableTVService.purchaseCableTV(purchaseData);

      if (!response?.success) {
        setError(response?.message || 'Cable TV purchase failed');
      }

      return response;
    } catch (err) {
      console.error('❌ useCableTV: unexpected purchase error', err);
      const message = err?.message || 'Network request failed';
      setError(message);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message,
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

  /** Friendly error message passthrough */
  const getUserFriendlyMessage = useCallback(
    (errorCode, originalMessage) => cableTVService.getUserFriendlyMessage(errorCode, originalMessage),
    []
  );

  /**
   * Provide UI metadata for corrective actions
   * `requiresAction` comes from cableTVService.getRequiredAction result
   */
  const getErrorAction = useCallback((requiresAction) => {
    if (!requiresAction) return null;

    const map = {
      RETRY_2FA: {
        title: 'Invalid 2FA Code',
        message: 'The two-factor authentication code you entered is incorrect. Please try again.',
        actionText: 'Retry 2FA',
        priority: 'high',
      },
      RETRY_PIN: {
        title: 'Invalid Password PIN',
        message: 'The password PIN you entered is incorrect. Please re-enter your PIN.',
        actionText: 'Retry PIN',
        priority: 'high',
      },
      SETUP_2FA: {
        title: 'Set Up 2FA',
        message: 'Two-factor authentication is required to complete this transaction.',
        actionText: 'Set Up 2FA',
        route: '/profile/2FA',
        priority: 'high',
      },
      SETUP_PIN: {
        title: 'Set Up PIN',
        message: 'A password PIN is required to complete this transaction.',
        actionText: 'Set Up PIN',
        route: '/profile/new-pin',
        priority: 'high',
      },
      ADD_FUNDS: {
        title: 'Insufficient Balance',
        message: "You don't have enough balance to complete this purchase.",
        actionText: 'Add Funds',
        route: '/wallet',
        priority: 'high',
      },
      UPGRADE_KYC: {
        title: 'Upgrade Verification',
        message: 'This transaction exceeds your current account limits. Please upgrade your verification.',
        actionText: 'Upgrade KYC',
        route: '/kyc/upgrade',
        priority: 'high',
      },
      CHECK_CUSTOMER_ID: {
        title: 'Check Smartcard Number',
        message: 'The smartcard/IUC number appears to be invalid. Please confirm and try again.',
        actionText: 'Review Number',
        priority: 'medium',
      },
      SELECT_PROVIDER: {
        title: 'Select Provider',
        message: 'Please choose a cable TV provider to continue.',
        actionText: 'Choose Provider',
        priority: 'medium',
      },
      SELECT_PACKAGE: {
        title: 'Select Package',
        message: 'Please choose a cable TV package to continue.',
        actionText: 'Choose Package',
        priority: 'medium',
      },
      INCREASE_AMOUNT: {
        title: 'Amount Too Low',
        message: 'The amount entered is below the minimum allowed for this service.',
        actionText: 'Increase Amount',
        priority: 'medium',
      },
      REDUCE_AMOUNT: {
        title: 'Amount Too High',
        message: 'The amount entered exceeds the maximum allowed for this service.',
        actionText: 'Reduce Amount',
        priority: 'medium',
      },
      VERIFY_AMOUNT: {
        title: 'Verify Amount',
        message: 'Please ensure the amount matches the selected package price.',
        actionText: 'Verify Amount',
        priority: 'medium',
      },
      WAIT_PENDING: {
        title: 'Pending Transaction',
        message: 'You already have a pending cable TV transaction. Please wait for it to complete.',
        actionText: 'Try Again Later',
        priority: 'medium',
      },
      FIX_INPUT: {
        title: 'Check Details',
        message: 'Some details are incorrect or missing. Please review and try again.',
        actionText: 'Review Details',
        priority: 'medium',
      },
      RETRY_LATER: {
        title: 'Service Unavailable',
        message: 'The cable TV service is temporarily unavailable. Please try again later.',
        actionText: 'Try Later',
        priority: 'medium',
      },
      CONTACT_SUPPORT: {
        title: 'Contact Support',
        message: 'We could not complete your request. Please reach out to support for assistance.',
        actionText: 'Contact Support',
        route: '/support',
        priority: 'high',
      },
    };

    return map[requiresAction] || null;
  }, []);

  /** Quick form completeness check with optional overrides */
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
    error,
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
    getErrorAction,
    getUserFriendlyMessage,
    initialize,
  };
};

export default useCableTV;