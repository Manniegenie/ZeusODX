import { useState, useEffect, useMemo } from 'react';
import { nairaBanksService } from '../services/nairaBanksService';

export function useNairaBanks() {
  // Banks data state
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);

  // Load banks on mount (no authentication required)
  useEffect(() => {
    console.log('🏦 Initializing Naira banks service...');
    loadBanks();
  }, []);

  /**
   * Load banks from API with caching
   */
  const loadBanks = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = await nairaBanksService.cache.get();
        if (cached && Array.isArray(cached)) {
          setBanks(cached);
          setLastFetched(new Date());
          setLoading(false);
          console.log('✅ Loaded banks from cache:', cached.length, 'banks');
          return { success: true, data: cached };
        }
      }

      // Fetch from API
      const result = await nairaBanksService.getNairaBanks();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        setBanks(result.data);
        setLastFetched(new Date());
        
        // Cache the result
        await nairaBanksService.cache.set(result.data);
        
        console.log('✅ Loaded banks from API:', result.data.length, 'banks');
        return { success: true, data: result.data };
      } else {
        // Handle case where data is not an array or is undefined
        const errorMessage = result.error || 'Invalid banks data format';
        setError(errorMessage);
        console.log('❌ Failed to load banks:', errorMessage, 'Data:', result.data);
        setBanks([]); // Set empty array to prevent undefined errors
        return { success: false, error: errorMessage };
      }

    } catch (err) {
      const errorMessage = err.message || 'Failed to load banks';
      setError(errorMessage);
      setBanks([]); // Set empty array to prevent undefined errors
      console.log('❌ Load banks error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh banks data
   */
  const refreshBanks = async () => {
    return loadBanks(true);
  };

  /**
   * Clear banks cache
   */
  const clearCache = async () => {
    await nairaBanksService.cache.clear();
    console.log('🗑️ Naira banks cache cleared');
  };

  // Filtered banks based on search term
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    return nairaBanksService.searchBanks(banks, searchTerm);
  }, [banks, searchTerm]);

  // Popular banks (top commonly used banks)
  const popularBanks = useMemo(() => {
    return nairaBanksService.getPopularBanks(banks);
  }, [banks]);

  // Microfinance banks
  const microfinanceBanks = useMemo(() => {
    return banks.filter(bank => 
      bank.name.toLowerCase().includes('microfinance') ||
      bank.name.toLowerCase().includes('mfb')
    );
  }, [banks]);

  // Commercial banks (excluding microfinance)
  const commercialBanks = useMemo(() => {
    return banks.filter(bank => 
      !bank.name.toLowerCase().includes('microfinance') &&
      !bank.name.toLowerCase().includes('mfb')
    );
  }, [banks]);

  /**
   * Find bank by code
   */
  const findBankByCode = (bankCode) => {
    return nairaBanksService.findBankByCode(banks, bankCode);
  };

  /**
   * Find bank by name
   */
  const findBankByName = (bankName) => {
    return nairaBanksService.findBankByName(banks, bankName);
  };

  /**
   * Search banks
   */
  const searchBanks = (term) => {
    setSearchTerm(term);
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setSearchTerm('');
  };

  /**
   * Select a bank
   */
  const selectBank = (bank) => {
    setSelectedBank(bank);
  };

  /**
   * Clear selected bank
   */
  const clearSelectedBank = () => {
    setSelectedBank(null);
  };

  /**
   * Validate bank account
   */
  const validateBankAccount = (accountData) => {
    return nairaBanksService.validateBankAccount(accountData);
  };

  /**
   * Format bank name for display
   */
  const formatBankName = (bank) => {
    return nairaBanksService.formatBankName(bank);
  };

  /**
   * Get bank by account details
   */
  const getBankForAccount = (accountData) => {
    if (accountData.bankCode) {
      return findBankByCode(accountData.bankCode);
    } else if (accountData.bankName) {
      return findBankByName(accountData.bankName);
    }
    return null;
  };

  /**
   * Check if banks are loaded
   */
  const isBanksLoaded = () => {
    return banks.length > 0;
  };

  /**
   * Get cache status
   */
  const getCacheStatus = () => {
    return {
      isLoaded: isBanksLoaded(),
      lastFetched,
      totalBanks: banks.length,
      popularBanksCount: popularBanks.length,
      microfinanceBanksCount: microfinanceBanks.length,
      commercialBanksCount: commercialBanks.length
    };
  };

  /**
   * Prepare bank options for dropdown/picker
   */
  const getBankOptions = (includePopularFirst = false) => {
    const options = filteredBanks.map(bank => ({
      label: formatBankName(bank),
      value: bank.sortCode || bank.uuid,
      code: bank.sortCode || bank.uuid,
      name: bank.name,
      bank: bank
    }));

    if (includePopularFirst && !searchTerm) {
      const popularOptions = popularBanks.map(bank => ({
        label: formatBankName(bank),
        value: bank.sortCode || bank.uuid,
        code: bank.sortCode || bank.uuid,
        name: bank.name,
        bank: bank,
        isPopular: true
      }));

      const otherOptions = options.filter(option => 
        !popularOptions.find(pop => pop.value === option.value)
      );

      return [...popularOptions, ...otherOptions];
    }

    return options;
  };

  /**
   * Retry loading banks
   */
  const retryLoading = () => {
    if (!loading) {
      loadBanks();
    }
  };

  return {
    // Data
    banks,
    filteredBanks,
    popularBanks,
    microfinanceBanks,
    commercialBanks,
    
    // State
    loading,
    error,
    lastFetched,
    searchTerm,
    selectedBank,
    
    // Actions
    loadBanks,
    refreshBanks,
    clearCache,
    retryLoading,
    
    // Search and selection
    searchBanks,
    clearSearch,
    selectBank,
    clearSelectedBank,
    
    // Utilities
    findBankByCode,
    findBankByName,
    validateBankAccount,
    formatBankName,
    getBankForAccount,
    getBankOptions,
    
    // Status
    isBanksLoaded,
    getCacheStatus,
  };
}