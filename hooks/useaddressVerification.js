// hooks/useDigitalAddressVerification.js
import { useCallback, useMemo, useState } from 'react';
import { kycService } from '../services/enhanced-kycService';

const DEBUG_HOOK = true;
const dbg = (...args) => { if (DEBUG_HOOK) console.log('[useDigitalAddressVerification]', ...args); };

/**
 * Address-only KYC hook (Digital Address Verification via your /kyc/address/verify-digital route).
 *
 * Usage:
 * const { loading, error, result, statusText, submit, reset, validate } = useDigitalAddressVerification();
 * await submit({
 *   country: 'NG',
 *   idType: 'ADDRESS',
 *   addressLine1: '12A Montgomery Rd',
 *   addressLine2: 'Yaba',
 *   city: 'Lagos',
 *   state: 'LA',
 *   postalCode: '100001',
 *   phoneNumber: '+2348012345678'
 * });
 *
 * Returns:
 *  - loading: boolean
 *  - error: string | null
 *  - result: { kycId, partnerJobId, smileJobId, status, jobComplete } | null
 *  - statusText: string | null  // e.g., "Submitted • PROVISIONAL" or "COMPLETED"
 *  - submit(payload, { skipValidate }?): Promise<{ success: boolean, data?, raw?, error?, message?, details?, errors? }>
 *  - reset(): void
 *  - validate(payload): string[] // array of field-level validation errors
 */
export const useDigitalAddressVerification = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  // --- Helpers ---
  const normalize = (payload = {}) => {
    const b = { ...payload };

    if (b.country)     b.country     = String(b.country).trim().toUpperCase();
    if (b.idType)      b.idType      = String(b.idType).trim();
    if (b.addressLine1) b.addressLine1 = String(b.addressLine1).trim();
    if (b.addressLine2) b.addressLine2 = String(b.addressLine2).trim();
    if (b.city)        b.city        = String(b.city).trim();
    if (b.state)       b.state       = String(b.state).trim();
    if (b.postalCode)  b.postalCode  = String(b.postalCode).trim();
    if (b.phoneNumber) b.phoneNumber = String(b.phoneNumber).trim();

    // sensible defaults
    if (!b.country) b.country = 'NG';
    if (!b.idType)  b.idType  = 'ADDRESS';

    // remove blank optionals so your API sees undefined instead of ""
    if (!b.addressLine2) delete b.addressLine2;
    if (!b.city) delete b.city;
    if (!b.state) delete b.state;
    if (!b.postalCode) delete b.postalCode;
    if (!b.phoneNumber) delete b.phoneNumber;

    return b;
  };

  const validate = (payload = {}) => {
    const b = normalize(payload);
    const errs = [];
    if (!b.country || b.country.length < 2) errs.push('country is required');
    if (!b.idType) errs.push('idType is required');
    if (!b.addressLine1 || b.addressLine1.length < 5) errs.push('addressLine1 must be at least 5 characters');
    return errs;
  };

  // --- Actions ---
  const submit = useCallback(async (payload, { skipValidate = false } = {}) => {
    setLoading(true);
    setError(null);

    const body = normalize(payload);
    if (!skipValidate) {
      const errs = validate(body);
      if (errs.length) {
        const message = errs[0];
        setError(message);
        setLoading(false);
        dbg('❌ validation', errs);
        return { success: false, error: 'VALIDATION_ERROR', message, errors: errs };
      }
    }

    dbg('POST /kyc/address/verify-digital', body);

    try {
      const res = await kycService.verifyDigitalAddress(body);
      if (res.success) {
        setResult(res.data);
        dbg('✓ submitted', res.data);
        return { success: true, data: res.data, raw: res.raw };
      } else {
        const msg = res.message || 'Digital address verification failed';
        setError(msg);
        dbg('❌ failed', res);
        return { success: false, error: res.error, message: msg, details: res.details };
      }
    } catch (e) {
      const msg = e?.message || 'Network error';
      setError(msg);
      dbg('❌ exception', msg);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const statusText = useMemo(() => {
    if (!result) return null;
    const { status, jobComplete } = result;
    if (jobComplete === true) return status || 'COMPLETED';
    return status ? `Submitted • ${status}` : 'Submitted';
  }, [result]);

  return { loading, error, result, statusText, submit, reset, validate };
};

export default useDigitalAddressVerification;
