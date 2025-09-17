// hooks/useObiexResolve.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { obiexService } from '../services/accountnameService';

/**
 * Hook to resolve single account name
 * @param {{ auto?: boolean, sortCode?:string, accountNumber?:string, onSuccess?:Function, onError?:Function }} options
 */
export function useResolveAccount(options = {}) {
  const { auto = false, sortCode: initialSort, accountNumber: initialAcct, onSuccess, onError } = options;

  const abortRef = useRef(null);
  const [account, setAccount] = useState(null); // normalized result { bankId, accountName, accountNumber, raw }
  const [loading, setLoading] = useState(Boolean(auto));
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ sortCode: initialSort, accountNumber: initialAcct });

  const load = useCallback(async ({ sortCode, accountNumber, refreshing = false } = {}) => {
    // if caller didn't pass params, use stored ones
    const sc = (sortCode ?? params.sortCode);
    const an = (accountNumber ?? params.accountNumber);

    if (!sc || !an) {
      const err = { error: 'INVALID_PARAMS', message: 'sortCode and accountNumber are required' };
      setError(err);
      onError?.(err);
      return { success: false, error: err.error, message: err.message };
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      refreshing ? setLoading(true) : setLoading(true);
      setError(null);

      const res = await obiexService.resolveAccount({ sortCode: String(sc), accountNumber: String(an) }, { signal: controller.signal });

      if (res.success) {
        setAccount(res.data);
        onSuccess?.(res.data);
      } else {
        const err = { error: res.error || 'REQUEST_FAILED', message: res.message || 'Failed to resolve account' };
        setError(err);
        onError?.(err);
      }
      return res;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [params, onError, onSuccess]);

  const refetch = useCallback(async (overrides = {}) => {
    return load({ ...overrides, refreshing: true });
  }, [load]);

  useEffect(() => {
    if (auto && params.sortCode && params.accountNumber) {
      load();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [auto, load, params.sortCode, params.accountNumber]);

  const setInput = useCallback(({ sortCode, accountNumber }) => {
    setParams({ sortCode, accountNumber });
  }, []);

  return {
    account,
    loading,
    error,
    refetch,
    load,      // load({sortCode,accountNumber})
    setInput,  // setInput({sortCode,accountNumber})
  };
}

/**
 * Hook to resolve a batch of accounts
 * @param {{ auto?: boolean, accounts?: Array<{sortCode,accountNumber}>, onSuccess?:Function, onError?:Function }} options
 */
export function useResolveBatch(options = {}) {
  const { auto = false, accounts: initialAccounts = [], onSuccess, onError } = options;

  const abortRef = useRef(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(Boolean(auto));
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState(initialAccounts);

  const load = useCallback(async ({ accounts: _accounts } = {}) => {
    const toSend = Array.isArray(_accounts) && _accounts.length ? _accounts : accounts;
    if (!Array.isArray(toSend) || toSend.length === 0) {
      const err = { error: 'INVALID_PARAMS', message: 'accounts must be a non-empty array' };
      setError(err);
      onError?.(err);
      return { success: false, error: err.error, message: err.message };
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await obiexService.resolveBatch({ accounts: toSend }, { signal: controller.signal });

      if (res.success) {
        setResults(res.data);
        onSuccess?.(res.data);
      } else {
        const err = { error: res.error || 'REQUEST_FAILED', message: res.message || 'Batch resolution failed' };
        setError(err);
        onError?.(err);
      }
      return res;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [accounts, onError, onSuccess]);

  const refetch = useCallback(async (overrides = {}) => {
    return load(overrides);
  }, [load]);

  useEffect(() => {
    if (auto && Array.isArray(accounts) && accounts.length) {
      load();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [auto, load, accounts]);

  return {
    results,
    loading,
    error,
    refetch,
    load,         // load({ accounts: [...] })
    setAccounts,  // setAccounts([...])
  };
}
