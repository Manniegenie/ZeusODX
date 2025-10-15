import { useCallback, useState } from 'react';
import { ngnzDepositService } from '../services/ngnzDepositService';

export const useNGNZDeposit = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDeposit, setCurrentDeposit] = useState(null);

  // Initialize deposit
  const initializeDeposit = useCallback(async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ngnzDepositService.initializeDeposit(amount);
      if (result.success) {
        setCurrentDeposit(result.data);
      } else {
        setError(result.message || 'Failed to initialize deposit');
      }
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get deposit status
  const getDepositStatus = useCallback(async (reference) => {
    if (!reference) return null;
    try {
      const result = await ngnzDepositService.getDepositStatus(reference);
      if (result.success) {
        setCurrentDeposit(result.data);
      }
      return result;
    } catch (err) {
      console.error('Error fetching deposit status:', err);
      return {
        success: false,
        error: 'STATUS_ERROR',
        message: err.message || 'Failed to fetch status'
      };
    }
  }, []);

  // Clear current deposit
  const clearDeposit = useCallback(() => {
    setCurrentDeposit(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    currentDeposit,
    initializeDeposit,
    getDepositStatus,
    clearDeposit
  };
};
