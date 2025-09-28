// hooks/usebankAccount.js
import { useState, useEffect, useCallback } from 'react';
import { bankService } from '../services/bankAccountService';

export const useBankAccounts = (options = {}) => {
  const { auto = false } = options;

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [accountsSummary, setAccountsSummary] = useState(null);

  const toErr = (code, message, extra = {}) => ({ code, message, ...extra });

  const getBankAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bankService.getBankAccounts();
      if (result.success) {
        setBankAccounts(result.data.bankAccounts);
        setAccountsSummary(result.data.summary);
      } else {
        setError(toErr(result.error, result.message));
      }
      return result;
    } catch {
      const fallback = toErr('UNEXPECTED_ERROR', 'An unexpected error occurred. Please try again.');
      setError(fallback);
      return { success: false, ...fallback, data: { bankAccounts: [], summary: null } };
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (data) => {
    setCreating(true);
    setError(null);
    try {
      const result = await bankService.addBankAccount(data);
      if (result.success) {
        setBankAccounts(prev => [result.data.bankAccount, ...prev]);
        setAccountsSummary(prev => {
          if (!prev) {
            const total = 1;
            return { totalAccounts: total, maxAllowed: 10, remainingSlots: 9, canAddMore: total < 10 };
          }
          const total = prev.totalAccounts + 1;
          return {
            ...prev,
            totalAccounts: total,
            remainingSlots: Math.max(prev.maxAllowed - total, 0),
            canAddMore: total < prev.maxAllowed
          };
        });
      } else {
        setError(toErr(result.error, result.message, { requiresAction: result.requiresAction }));
      }
      return result;
    } catch {
      const fallback = toErr('UNEXPECTED_ERROR', 'An unexpected error occurred. Please try again.', { requiresAction: 'RETRY' });
      setError(fallback);
      return { success: false, ...fallback };
    } finally {
      setCreating(false);
    }
  }, []);

  const deleteBankAccount = useCallback(async (accountNumber) => {
    if (!accountNumber) {
      return { success: false, error: 'INVALID_ACCOUNT_NUMBER', message: 'Account number is required' };
    }
    setLoading(true);
    setError(null);
    try {
      const result = await bankService.deleteBankAccount(accountNumber);
      if (result.success) {
        setBankAccounts(prev => prev.filter(a => a.accountNumber !== accountNumber));
        setAccountsSummary(prev => {
          if (!prev) return null;
          const total = Math.max(prev.totalAccounts - 1, 0);
          return {
            ...prev,
            totalAccounts: total,
            remainingSlots: Math.max(prev.maxAllowed - total, 0),
            canAddMore: total < prev.maxAllowed
          };
        });
      } else {
        setError(toErr(result.error, result.message));
      }
      return result;
    } catch {
      const fallback = toErr('UNEXPECTED_ERROR', 'An unexpected error occurred. Please try again.', { requiresAction: 'RETRY' });
      setError(fallback);
      return { success: false, ...fallback };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBankAccountById = useCallback(async (accountId) => {
    const account = bankAccounts.find(a => a.id === accountId);
    if (!account) {
      return { success: false, error: 'ACCOUNT_NOT_FOUND', message: 'Bank account not found' };
    }
    return deleteBankAccount(account.accountNumber);
  }, [bankAccounts, deleteBankAccount]);

  useEffect(() => {
    if (auto) getBankAccounts();
  }, [auto, getBankAccounts]);

  return {
    addAccount,
    creating,
    summary: accountsSummary,
    error,
    loading,
    bankAccounts,
    accountsSummary,
    getBankAccounts,
    deleteBankAccount,
    deleteBankAccountById,
    validateBankAccountData: bankService.validateBankAccountData,
    getUserFriendlyMessage: bankService.getUserFriendlyMessage,
  };
};