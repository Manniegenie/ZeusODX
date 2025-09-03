// hooks/useAccountDeletion.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { accountDeletionService } from '../services/deleteaccountService';

/**
 * Account deletion flow without OTP/2FA:
 * - initiate() → schedules immediately if no funds, otherwise returns fundDetails
 * - finalize() → optional second call; server re-checks and schedules
 *
 * @param {{ auto?: boolean, onScheduled?: (d:any)=>void, onFundsBlock?: (d:{fundDetails:any})=>void, onError?: (e:{error:string,message:string,data?:any})=>void }} [opts]
 */
export function useAccountDeletion(opts = {}) {
  const { auto = false, onScheduled, onFundsBlock, onError } = opts;

  const abortRef = useRef(null);

  // Data
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState(null);
  const [fundsAvailable, setFundsAvailable] = useState(false);
  const [fundDetails, setFundDetails] = useState({});

  // Status
  const [loading, setLoading] = useState(Boolean(auto));
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState(null);

  const initiate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await accountDeletionService.initiate({ signal: controller.signal });
      if (!res.success) {
        setError({ error: res.error, message: res.message, data: res.data });
        // Funds present branch
        if (res.error === 'FUNDS_PRESENT' && res.data) {
          setFundsAvailable(true);
          setFundDetails(res.data.fundDetails || {});
          onFundsBlock?.({ fundDetails: res.data.fundDetails || {} });
        }
        onError?.({ error: res.error, message: res.message, data: res.data });
        return res;
      }

      setScheduledDeletionDate(res.data?.scheduledDeletionDate || null);
      setFundsAvailable(false);
      setFundDetails({});
      onScheduled?.(res.data);
      return res;
    } finally {
      setLoading(false);
    }
  }, [onScheduled, onFundsBlock, onError]);

  const finalize = useCallback(async () => {
    setFinalizing(true);
    setError(null);
    try {
      const res = await accountDeletionService.finalize();
      if (!res.success) {
        setError({ error: res.error, message: res.message, data: res.data });
        if (res.error === 'FUNDS_PRESENT' && res.data) {
          setFundsAvailable(true);
          setFundDetails(res.data.fundDetails || {});
          onFundsBlock?.({ fundDetails: res.data.fundDetails || {} });
        }
        onError?.({ error: res.error, message: res.message, data: res.data });
        return res;
      }

      setScheduledDeletionDate(res.data?.scheduledDeletionDate || null);
      setFundsAvailable(false);
      setFundDetails({});
      onScheduled?.(res.data);
      return res;
    } finally {
      setFinalizing(false);
    }
  }, [onScheduled, onFundsBlock, onError]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setScheduledDeletionDate(null);
    setFundsAvailable(false);
    setFundDetails({});
    setLoading(false);
    setFinalizing(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (auto) initiate();
    return () => abortRef.current?.abort();
  }, [auto, initiate]);

  const userMessage = useMemo(
    () => (error ? accountDeletionService.getUserFriendlyMessage(error.error, error.message) : null),
    [error]
  );

  const hasFunds = fundsAvailable && Object.keys(fundDetails || {}).length > 0;

  return {
    // data
    scheduledDeletionDate,
    fundsAvailable,
    fundDetails,
    hasFunds,

    // statuses
    loading,
    finalizing,
    error,
    userMessage,

    // actions
    initiate,
    finalize,
    reset,
  };
}
