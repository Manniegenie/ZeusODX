// hooks/useHistory.js
import { useState, useCallback, useEffect } from 'react';
import { transactionService } from '../services/historyService';

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

  // Helper function to convert month selection to startDate/endDate for service
  const getMonthDateRange = (monthYear) => {
    if (!monthYear) return { startDate: null, endDate: null };
    
    // Parse month and year from string like "Jul 2025"
    const [monthName, year] = monthYear.split(' ');
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const monthIndex = monthMap[monthName];
    const yearNum = parseInt(year);
    
    if (monthIndex === undefined || isNaN(yearNum)) {
      // Fallback to current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    }

    const startDate = new Date(yearNum, monthIndex, 1).toISOString().split('T')[0];
    const endDate = new Date(yearNum, monthIndex + 1, 0).toISOString().split('T')[0];
    
    return { startDate, endDate };
  };

  // Map UI categories to service transaction types
  const mapCategoryToType = (category) => {
    const categoryMap = {
      'Deposit': 'DEPOSIT',
      'Transfer': 'WITHDRAWAL',
      'Swap': 'SWAP',
      'Giftcard': 'GIFTCARD'
    };
    return categoryMap[category] || null;
  };

  // Map UI status to service status format
  const mapStatusToService = (status) => {
    const statusMap = {
      'Successful': 'SUCCESSFUL',
      'Pending': 'PENDING',
      'Failed': 'FAILED'
    };
    return statusMap[status] || null;
  };

  // Function to fetch gift card transactions
  const fetchGiftCardTransactions = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { 
        status,
        startDate: customStartDate,
        endDate: customEndDate,
        month,
        ...otherFilters 
      } = filterParams;
      
      let apiParams = {
        page: 1,
        limit: defaultPageSize,
        ...otherFilters
      };
      
      // Handle date range
      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const dateRange = getMonthDateRange(month);
        apiParams.startDate = dateRange.startDate;
        apiParams.endDate = dateRange.endDate;
      }

      // Map status
      if (status && status !== 'All Status') {
        const mappedStatus = mapStatusToService(status);
        if (mappedStatus) {
          apiParams.status = mappedStatus;
        }
      }

      const result = await transactionService.getGiftCardTransactions(apiParams);

      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
        setPagination(result.data.pagination || null);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch gift card transactions');
        setTransactions([]);
        setPagination(null);
      }

      return result;
    } catch (e) {
      console.error('Gift card fetch error:', e);
      const errorMessage = 'Failed to fetch gift card transactions.';
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
      return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [defaultPageSize]);

  // Function to fetch bill payments
  const fetchBillPayments = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { 
        category,
        status,
        startDate: customStartDate,
        endDate: customEndDate,
        month,
        ...otherFilters 
      } = filterParams;
      
      let apiParams = {
        page: 1,
        limit: defaultPageSize,
        ...otherFilters
      };
      
      // Handle date range
      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const dateRange = getMonthDateRange(month);
        apiParams.startDate = dateRange.startDate;
        apiParams.endDate = dateRange.endDate;
      }

      // Map category to bill type
      if (category && category !== 'All Categories') {
        const billCategories = ['Airtime', 'Data', 'Cable', 'Electricity'];
        if (billCategories.includes(category)) {
          apiParams.billType = category;
        }
      }

      // Map status
      if (status && status !== 'All Status') {
        const mappedStatus = mapStatusToService(status);
        if (mappedStatus) {
          apiParams.status = mappedStatus;
        }
      }

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
      const errorMessage = 'Failed to fetch bill payment transactions.';
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
      return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [defaultPageSize]);

  // Function to fetch complete history (tokens + utilities + gift cards)
  const fetchCompleteHistory = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { 
        status,
        startDate: customStartDate,
        endDate: customEndDate,
        month,
        ...otherFilters 
      } = filterParams;
      
      let apiParams = {
        page: 1,
        limit: defaultPageSize,
        transactionType: 'all', // This gets tokens, utilities, and gift cards
        ...otherFilters
      };
      
      // Handle date range
      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const dateRange = getMonthDateRange(month);
        apiParams.startDate = dateRange.startDate;
        apiParams.endDate = dateRange.endDate;
      }

      // Map status for complete history
      if (status && status !== 'All Status') {
        const mappedStatus = mapStatusToService(status);
        if (mappedStatus) {
          apiParams.status = mappedStatus;
        }
      }

      const result = await transactionService.getCompleteTransactionHistory(apiParams);

      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
        setPagination(result.data.pagination || null);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch complete transaction history');
        setTransactions([]);
        setPagination(null);
      }

      return result;
    } catch (e) {
      console.error('Complete history fetch error:', e);
      const errorMessage = 'Failed to fetch complete transaction history.';
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
      return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [defaultPageSize]);

  // Main fetch function with proper routing
  const fetchTransactions = useCallback(async (filterParams = {}) => {
    const { category } = filterParams;
    
    // Check what type of request this is
    const billCategories = ['Airtime', 'Data', 'Cable', 'Electricity'];
    
    // If gift card category selected → fetch only gift card transactions
    if (category === 'Giftcard') {
      return fetchGiftCardTransactions(filterParams);
    }
    
    // If specific bill category selected → fetch only that utility type
    if (category && billCategories.includes(category)) {
      return fetchBillPayments(filterParams);
    }
    
    // If "All Categories" selected → fetch complete history (tokens + utilities + gift cards)
    if (category === 'All Categories' || !category) {
      return fetchCompleteHistory(filterParams);
    }

    // Otherwise → fetch specific token transactions only
    setLoading(true);
    setError(null);

    try {
      const { 
        status,
        startDate: customStartDate,
        endDate: customEndDate,
        month,
        ...otherFilters 
      } = filterParams;
      
      let apiParams = {
        page: 1,
        limit: defaultPageSize,
        ...otherFilters
      };
      
      // Handle date range
      if (customStartDate && customEndDate) {
        apiParams.startDate = customStartDate;
        apiParams.endDate = customEndDate;
      } else if (month) {
        const dateRange = getMonthDateRange(month);
        apiParams.startDate = dateRange.startDate;
        apiParams.endDate = dateRange.endDate;
      }

      // Map category to transaction type
      if (category && category !== 'All Categories') {
        const mappedType = mapCategoryToType(category);
        if (mappedType) {
          apiParams.type = mappedType;
        }
      }

      // Map status
      if (status && status !== 'All Status') {
        const mappedStatus = mapStatusToService(status);
        if (mappedStatus) {
          apiParams.status = mappedStatus;
        }
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
      const errorMessage = `Failed to fetch ${normalizedCurrency} transactions.`;
      setError(errorMessage);
      setTransactions([]);
      setPagination(null);
      setSummary(null);
      return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [normalizedCurrency, defaultPageSize, fetchBillPayments, fetchCompleteHistory, fetchGiftCardTransactions]);

  const refreshTransactions = useCallback((filterParams = {}) => {
    return fetchTransactions(filterParams);
  }, [fetchTransactions]);

  // Load more transactions for pagination
  const loadMoreTransactions = useCallback(async (filterParams = {}) => {
    if (!pagination?.hasNextPage || loading) return;

    setLoading(true);
    try {
      const nextPageParams = {
        ...filterParams,
        page: pagination.currentPage + 1
      };

      // Handle date range
      const { month, startDate: customStartDate, endDate: customEndDate } = filterParams;
      if (customStartDate && customEndDate) {
        nextPageParams.startDate = customStartDate;
        nextPageParams.endDate = customEndDate;
      } else if (month) {
        const dateRange = getMonthDateRange(month);
        nextPageParams.startDate = dateRange.startDate;
        nextPageParams.endDate = dateRange.endDate;
      }

      const result = await transactionService.getTransactionHistory(normalizedCurrency, nextPageParams);

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
  }, [normalizedCurrency, pagination, loading]);

  // Get filtered transactions for specific categories
  const getFilteredByCategory = useCallback((category) => {
    if (!category || category === 'All Categories') return transactions;
    
    // For gift cards
    if (category === 'Giftcard') {
      return transactions.filter(tx => tx.type === 'GIFTCARD');
    }
    
    // For bill payment categories
    const billCategories = ['Airtime', 'Data', 'Cable', 'Electricity'];
    if (billCategories.includes(category)) {
      return transactions.filter(tx => {
        if (tx.type !== 'BILL_PAYMENT') return false;
        
        // Check if transaction details contain the bill type
        const details = tx.details || {};
        const billType = details.category || details.billType || '';
        
        return billType.toLowerCase().includes(category.toLowerCase());
      });
    }

    // For other categories
    const categoryMap = {
      'Deposit': 'DEPOSIT',
      'Transfer': 'WITHDRAWAL', 
      'Swap': 'SWAP'
    };
    
    const mappedType = categoryMap[category];
    if (mappedType) {
      return transactions.filter(tx => tx.type === mappedType);
    }

    return transactions;
  }, [transactions]);

  // Legacy method name for backward compatibility
  const getFilteredByBillType = getFilteredByCategory;

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [autoFetch, fetchTransactions]);

  return {
    // State
    loading,
    error,
    transactions,
    pagination,
    summary,
    
    // Computed
    hasTransactions: transactions.length > 0,
    hasNextPage: pagination?.hasNextPage || false,
    totalTransactions: pagination?.totalCount || 0,
    
    // Actions
    refreshTransactions,
    fetchTransactions,
    fetchBillPayments, // For bills only
    fetchGiftCardTransactions, // For gift cards only
    fetchCompleteHistory, // For all transactions
    loadMoreTransactions,
    getFilteredByCategory,
    getFilteredByBillType, // Legacy alias
    
    // Utilities
    getMonthDateRange,
    mapCategoryToType,
    mapStatusToService
  };
};