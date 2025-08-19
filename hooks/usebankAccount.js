// hooks/useBankAccounts.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bankAccountsService } from '../services/bankAccountService';

/**
 * Manage user's bank accounts (list/add/delete)
 * @param {{ auto?: boolean, onLoaded?: (data:any)=>void, onError?: (e:{error:string,message:string})=>void }} [opts]
 */
export function useBankAccounts(opts = {}) {
  const { auto = true, onLoaded, onError } = opts;

  const abortRef = useRef(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalAccounts: 0, maxAllowed: 10, canAddMore: true, remainingSlots: 10 });

  const [loading, setLoading] = useState(Boolean(auto));
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ refreshingRun = false } = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      refreshingRun ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await bankAccountsService.list({ signal: controller.signal });
      if (res.success) {
        setBankAccounts(res.data.bankAccounts);
        setSummary(res.data.summary);
        onLoaded?.(res.data);
      } else {
        const err = { error: res.error || 'FETCH_FAILED', message: res.message || 'Failed to load bank accounts' };
        setError(err);
        onError?.(err);
      }
    } finally {
      refreshingRun ? setRefreshing(false) : setLoading(false);
    }
  }, [onLoaded, onError]);

  const refetch = useCallback(() => load({ refreshingRun: true }), [load]);

  useEffect(() => {
    if (auto) load();
    return () => abortRef.current?.abort();
  }, [auto, load]);

  const addAccount = useCallback(async ({ accountNumber, bankName, accountName }) => {
    setCreating(true);
    try {
      const res = await bankAccountsService.add({ accountNumber, bankName, accountName });
      if (!res.success) {
        const err = { error: res.error || 'FETCH_FAILED', message: res.message || 'Failed to add bank account' };
        setError(err);
        onError?.(err);
        return res;
      }

      // Update list + summary locally
      setBankAccounts(prev => [res.data, ...prev]);
      setSummary(prev => {
        const total = (prev.totalAccounts ?? 0) + 1;
        const max = prev.maxAllowed ?? 10;
        return {
          totalAccounts: total,
          maxAllowed: max,
          canAddMore: total < max,
          remainingSlots: Math.max(0, max - total),
        };
      });

      return res;
    } finally {
      setCreating(false);
    }
  }, [onError]);

  const deleteAccount = useCallback(async (accountId) => {
    setDeletingId(accountId);
    try {
      const res = await bankAccountsService.remove({ accountId });
      if (!res.success) {
        const err = { error: res.error || 'FETCH_FAILED', message: res.message || 'Failed to delete bank account' };
        setError(err);
        onError?.(err);
        return res;
      }

      setBankAccounts(prev => prev.filter(a => a.id !== accountId));
      setSummary(prev => {
        const total = Math.max(0, (prev.totalAccounts ?? 1) - 1);
        const max = prev.maxAllowed ?? 10;
        return {
          totalAccounts: total,
          maxAllowed: max,
          canAddMore: total < max,
          remainingSlots: Math.max(0, max - total),
        };
      });

      return res;
    } finally {
      setDeletingId(null);
    }
  }, [onError]);

  const canAddMore = summary?.canAddMore === true;
  const maskedAccounts = useMemo(
    () =>
      bankAccounts.map(a => ({
        ...a,
        maskedNumber: bankAccountsService.maskAccountNumber(a.accountNumber),
      })),
    [bankAccounts]
  );

  return {
    // data
    bankAccounts,
    maskedAccounts, // convenience for UI
    summary,
    canAddMore,

    // statuses
    loading,
    refreshing,
    creating,
    deletingId,
    error,

    // actions
    refetch,
    addAccount,
    deleteAccount,
  };
}
