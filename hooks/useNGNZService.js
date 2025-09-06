// hooks/useNGNZWithdrawal.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ngnzWithdrawalService } from '../services/NGNZWithdrawalService';

/**
 * Client-side validator matching backend rules (incl. 2FA & 6-digit PIN).
 */
function validatePayload(payload = {}) {
  const errors = [];

  const amt = payload?.amount;
  if (typeof amt !== 'number' || !Number.isFinite(amt) || amt <= 0) {
    errors.push('Amount must be a positive number');
  }

  const dest = payload?.destination || {};
  if (!dest.accountNumber) errors.push('Account number is required');
  if (!dest.accountName) errors.push('Account name is required');
  if (!dest.bankName) errors.push('Bank name is required');
  if (!dest.bankCode) errors.push('Bank code is required');

  if (amt && amt < 100) errors.push('Minimum withdrawal amount is ₦100');
  if (amt && amt > 1_000_000) errors.push('Maximum withdrawal amount is ₦1,000,000');

  const twoFA = String(payload?.twoFactorCode || '').trim();
  if (!twoFA) errors.push('Two-factor authentication code is required');

  const pin = String(payload?.passwordpin || '').trim();
  if (!pin) errors.push('Password PIN is required');
  else if (!/^\d{6}$/.test(pin)) errors.push('Password PIN must be exactly 6 digits');

  return errors;
}

/**
 * useNGNZWithdrawal
 *
 * Usage:
 * const {
 *   loading, error, message, withdrawal, status,
 *   isPending, isSuccessful, isFailed, statusText,
 *   submit, validate, reset,
 *   refreshStatus, startPolling, stopPolling
 * } = useNGNZWithdrawal({ autoPoll: true, pollMs: 8000 });
 */
export function useNGNZWithdrawal(options = {}) {
  const { autoPoll = false, pollMs = 10000 } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [message, setMessage] = useState(null);

  const [withdrawal, setWithdrawal] = useState(null); // normalized initiate response
  const [status, setStatus]         = useState(null); // normalized status response

  const pollRef = useRef(null);

  const submit = useCallback(async (payload, opts = {}) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setWithdrawal(null);
    setStatus(null);

    const vErrors = validatePayload(payload);
    if (vErrors.length > 0) {
      setLoading(false);
      const msg = vErrors.join('; ');
      setError(msg);
      return { success: false, error: 'VALIDATION_ERROR', message: msg, errors: vErrors };
    }

    const res = await ngnzWithdrawalService.initiateWithdrawal(payload, opts);

    if (res.success) {
      setWithdrawal(res.data || null);
      setMessage(res.message || null);

      // Auto-poll while pending
      if (autoPoll && (res.data?.status === 'PENDING' || !res.data?.status) && res.data?.withdrawalId) {
        startPolling(res.data.withdrawalId, pollMs);
      }
    } else {
      // Bubble up specific auth errors when present
      setError(res.message || 'Withdrawal failed');
    }

    setLoading(false);
    return res;
  }, [autoPoll, pollMs]);

  const refreshStatus = useCallback(async (withdrawalId) => {
    const id = withdrawalId || withdrawal?.withdrawalId || status?.withdrawalId;
    if (!id) {
      const msg = 'Missing withdrawalId';
      setError(msg);
      return { success: false, error: 'MISSING_ID', message: msg };
    }

    setLoading(true);
    setError(null);
    const res = await ngnzWithdrawalService.getWithdrawalStatus(id);
    if (res.success) {
      setStatus(res.data || null);
      setMessage(res.message || null);
    } else {
      setError(res.message || 'Failed to fetch withdrawal status');
    }
    setLoading(false);
    return res;
  }, [withdrawal, status]);

  const startPolling = useCallback((withdrawalId, intervalMs = pollMs) => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const res = await refreshStatus(withdrawalId);
      const st = res?.data?.status;
      if (st === 'SUCCESSFUL' || st === 'FAILED') {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, Math.max(3000, Number(intervalMs) || 10000));
  }, [pollMs, refreshStatus]);

  const stopPolling = useCallback(() => {
    if (!pollRef.current) return;
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setLoading(false);
    setError(null);
    setMessage(null);
    setWithdrawal(null);
    setStatus(null);
  }, [stopPolling]);

  const validate = useCallback((payload) => validatePayload(payload), []);

  const effectiveStatus = status?.status || withdrawal?.status || null;

  const isPending    = effectiveStatus === 'PENDING' || (!effectiveStatus && !!withdrawal?.withdrawalId);
  const isSuccessful = effectiveStatus === 'SUCCESSFUL';
  const isFailed     = effectiveStatus === 'FAILED';

  const statusText = useMemo(() => {
    if (isSuccessful) return 'Withdrawal successful';
    if (isFailed) return 'Withdrawal failed';
    if (isPending) return 'Withdrawal pending';
    return null;
  }, [isSuccessful, isFailed, isPending]);

  return {
    // state
    loading, error, message,
    withdrawal, // { withdrawalId, transactionId, authValidation, ... }
    status,     // normalized status payload (incl. authValidation)
    statusText,

    // flags
    isPending, isSuccessful, isFailed,

    // actions
    submit,         // submit(payload, { idempotencyKey? })
    refreshStatus,  // refreshStatus(withdrawalId?)
    startPolling,   // startPolling(withdrawalId, intervalMs?)
    stopPolling,    // stopPolling()
    validate,       // local pre-check
    reset,          // clear state
  };
}
