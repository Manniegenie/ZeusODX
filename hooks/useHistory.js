// hooks/usespecificHistory.js
import { useState, useCallback, useEffect } from 'react';
import { transactionService } from '../services/historyService';

const BILL_CATEGORIES = ['Airtime', 'Data', 'Cable', 'Electricity'];

export const useHistory = (currency, options = {}) => {
  const { autoFetch = true, defaultPageSize = 20 } = options;
  if (!currency || typeof currency !== 'string') {
    throw new Error('useHistory: currency parameter is required and must be a string');
  }
  const normalizedCurrency = currency.toUpperCase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);

  const getMonthDateRange = (monthYear) => {
    if (!monthYear) return { startDate: null, endDate: null };
    const [monthName, year] = monthYear.split(' ');
    const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const mi = monthMap[monthName];
    const y = parseInt(year, 10);
    if (mi === undefined || Number.isNaN(y)) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    const start = new Date(y, mi, 1).toISOString().split('T')[0];
    const end = new Date(y, mi + 1, 0).toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  };

  const mapCategoryToType = (category) => {
    const map = { Deposit: 'DEPOSIT', Transfer: 'WITHDRAWAL', Swap: 'SWAP' };
    return map[category] || null;
  };

  const mapStatusToService = (status) => {
    const map = { Successful: 'SUCCESSFUL', Pending: 'PENDING', Failed: 'FAILED' };
    return map[status] || null;
  };

  const buildBillApiParams = (filterParams = {}) => {
    const { category, status, startDate: customStartDate, endDate: customEndDate, month, page, limit, ...otherFilters } = filterParams;
    const apiParams = { page: page || 1, limit: limit || defaultPageSize, ...otherFilters };

    if (customStartDate && customEndDate) {
      apiParams.startDate = customStartDate;
      apiParams.endDate = customEndDate;
    } else if (month) {
      const r = getMonthDateRange(month);
      apiParams.startDate = r.startDate;
      apiParams.endDate = r.endDate;
    }

    if (category && category !== 'All Categories' && BILL_CATEGORIES.includes(category)) {
      apiParams.billType = category;
    }

    if (status && status !== 'All Status') {
      const mapped = mapStatusToService(status);
      if (mapped) apiParams.status = mapped;
    }
    return apiParams;
  };

  const fetchBillPayments = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = buildBillApiParams(filterParams);
      const result = await transactionService.getBillTransactions(apiParams);
      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
        setPagination(result.data.pagination || null);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch bill transactions');
        setTransactions([]);
        setPagination(null);
      }
      return result;
    } catch (e) {
      console.error('Bill payment fetch error:', e);
      const msg = 'Failed to fetch bill payment transactions.';
      setError(msg);
      setTransactions([]);
      setPagination(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, [defaultPageSize]);

  // NEW: NGNZ Withdrawals fetch function
  const fetchNGNZWithdrawals = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { status, startDate: customStartDate, endDate: customEndDate, month, page, limit, ...otherFilters } = filterParams;
      const apiParams = { page: page || 1, limit: limit || defaultPageSize, ...otherFilters };

      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const r = getMonthDateRange(month);
        apiParams.startDate = r.startDate;
        apiParams.endDate = r.endDate;
      }

      if (status && status !== 'All Status') {
        const mapped = mapStatusToService(status);
        if (mapped) apiParams.status = mapped;
      }

      const result = await transactionService.getNGNZWithdrawals(apiParams);
      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
        setPagination(result.data.pagination || null);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch NGNZ withdrawals');
        setTransactions([]);
        setPagination(null);
      }
      return result;
    } catch (e) {
      console.error('NGNZ withdrawal fetch error:', e);
      const msg = 'Failed to fetch NGNZ withdrawal transactions.';
      setError(msg);
      setTransactions([]);
      setPagination(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, [defaultPageSize]);

  const fetchTransactions = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { category } = filterParams;
      
      // NEW: Check if this is specifically for NGNZ withdrawals
      if (normalizedCurrency === 'NGNZ' && category === 'Transfer') {
        return fetchNGNZWithdrawals(filterParams);
      }
      
      if (category && BILL_CATEGORIES.includes(category)) {
        return fetchBillPayments(filterParams);
      }

      const { month, status, startDate: customStartDate, endDate: customEndDate, page, limit, ...otherFilters } = filterParams;
      const apiParams = { page: page || 1, limit: limit || defaultPageSize, ...otherFilters };

      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const r = getMonthDateRange(month);
        apiParams.startDate = r.startDate;
        apiParams.endDate = r.endDate;
      }

      if (filterParams.category && filterParams.category !== 'All Categories') {
        const t = mapCategoryToType(filterParams.category);
        if (t) apiParams.type = t;
      }

      if (status && status !== 'All Status') {
        const mapped = mapStatusToService(status);
        if (mapped) apiParams.status = mapped;
      }

      const result = await transactionService.getTransactionHistory(normalizedCurrency, apiParams);
      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
        setPagination(result.data.pagination || null);
        setSummary(result.data.summary || null);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch transactions');
        setTransactions([]);
        setPagination(null);
        setSummary(null);
      }
      return result;
    } catch (e) {
      console.error('Transaction fetch error:', e);
      const msg = `Failed to fetch ${normalizedCurrency} transactions.`;
      setError(msg);
      setTransactions([]);
      setPagination(null);
      setSummary(null);
      return { success: false, error: 'NETWORK_ERROR', message: msg };
    } finally {
      setLoading(false);
    }
  }, [normalizedCurrency, defaultPageSize, fetchBillPayments, fetchNGNZWithdrawals]);

  const refreshTransactions = useCallback((filterParams = {}) => fetchTransactions(filterParams), [fetchTransactions]);

  const loadMoreTransactions = useCallback(async (filterParams = {}) => {
    if (!pagination?.hasNextPage || loading) return;
    setLoading(true);
    try {
      const isBill = filterParams?.category && BILL_CATEGORIES.includes(filterParams.category);
      const isNGNZWithdrawal = normalizedCurrency === 'NGNZ' && filterParams?.category === 'Transfer';
      const nextPage = (pagination.currentPage || 1) + 1;

      if (isBill) {
        const baseParams = buildBillApiParams(filterParams);
        const result = await transactionService.getBillTransactions({ ...baseParams, page: nextPage, limit: defaultPageSize });
        if (result.success && result.data) {
          setTransactions(prev => [...prev, ...(result.data.transactions || [])]);
          setPagination(result.data.pagination || null);
        }
        return result;
      }

      // NEW: Handle NGNZ withdrawal pagination
      if (isNGNZWithdrawal) {
        const { month, startDate: customStartDate, endDate: customEndDate, status } = filterParams;
        const nextParams = { ...filterParams, page: nextPage, limit: defaultPageSize };

        if (customStartDate && customEndDate) {
          nextParams.startDate = customStartDate;
          nextParams.endDate = customEndDate;
        } else if (month) {
          const r = getMonthDateRange(month);
          nextParams.startDate = r.startDate;
          nextParams.endDate = r.endDate;
        }

        if (status && status !== 'All Status') {
          const mapped = mapStatusToService(status);
          if (mapped) nextParams.status = mapped;
        }

        const result = await transactionService.getNGNZWithdrawals(nextParams);
        if (result.success && result.data) {
          setTransactions(prev => [...prev, ...(result.data.transactions || [])]);
          setPagination(result.data.pagination || null);
        }
        return result;
      }

      const { month, startDate: customStartDate, endDate: customEndDate, status } = filterParams;
      const nextParams = { ...filterParams, page: nextPage, limit: defaultPageSize };

      if (customStartDate && customEndDate) {
        nextParams.startDate = customStartDate;
        nextParams.endDate = customEndDate;
      } else if (month) {
        const r = getMonthDateRange(month);
        nextParams.startDate = r.startDate;
        nextParams.endDate = r.endDate;
      }

      if (status && status !== 'All Status') {
        const mapped = mapStatusToService(status);
        if (mapped) nextParams.status = mapped;
      }

      const result = await transactionService.getTransactionHistory(normalizedCurrency, nextParams);
      if (result.success && result.data) {
        setTransactions(prev => [...prev, ...(result.data.transactions || [])]);
        setPagination(result.data.pagination || null);
      }
      return result;
    } catch (e) {
      console.error('Load more transactions error:', e);
      return { success: false, error: 'NETWORK_ERROR', message: 'Failed to load more transactions' };
    } finally {
      setLoading(false);
    }
  }, [normalizedCurrency, pagination, loading, defaultPageSize]);

  const getFilteredByBillType = useCallback((billType) => {
    if (!billType || billType === 'All Categories') return transactions;
    if (!BILL_CATEGORIES.includes(billType)) return transactions;

    return transactions.filter(tx => {
      if (tx.type !== 'BILL_PAYMENT') return false;
      const d = tx.details || {};
      const candidates = [d.billCategory, d.billType, tx.billType, tx.utilityType]
        .filter(Boolean).map(String);
      return candidates.some(v => v.toLowerCase().includes(String(billType).toLowerCase()));
    });
  }, [transactions]);

  useEffect(() => { if (autoFetch) fetchTransactions(); }, [autoFetch, fetchTransactions]);

  return {
    loading, error, transactions, pagination, summary,
    hasTransactions: transactions.length > 0,
    hasNextPage: pagination?.hasNextPage || false,
    totalTransactions: pagination?.totalCount || 0,
    refreshTransactions, fetchTransactions, fetchBillPayments, 
    fetchNGNZWithdrawals, // NEW: Expose NGNZ withdrawals method
    loadMoreTransactions, getFilteredByBillType,
    getMonthDateRange, mapCategoryToType, mapStatusToService,
  };
};