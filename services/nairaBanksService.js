import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const nairaBanksService = {
  /**
   * Get list of Nigerian banks/financial institutions
   * GET /api/naira-accounts
   */
  async getNairaBanks() {
    try {
      console.log('🏦 Fetching Nigerian banks list...');
      
      const response = await apiClient.get('/naira/naira-accounts');

      if (response.success && response.data) {
        // Handle nested data structure from your API response
        // Your response structure: { success: true, data: { data: [banks...], message: "Ok" } }
        const banksData = response.data.data?.data || response.data.data || [];
        
        console.log('✅ Nigerian banks retrieved successfully:', banksData.length, 'banks');
        
        if (Array.isArray(banksData)) {
          return { 
            success: true, 
            data: banksData,
            message: response.data.message || response.data.data?.message || 'Banks retrieved successfully'
          };
        } else {
          console.log('❌ Banks data is not an array:', typeof banksData, banksData);
          return { success: false, error: 'Invalid banks data format' };
        }
      } else {
        console.log('❌ Failed to fetch Nigerian banks:', response.error);
        return { success: false, error: response.error || 'Failed to fetch banks list' };
      }

    } catch (error) {
      console.log('❌ Nigerian banks service error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  /**
   * Find a bank by code (sortCode or uuid)
   * @param {Array} banks - List of banks
   * @param {string} bankCode - Bank sort code/UUID
   */
  findBankByCode(banks, bankCode) {
    try {
      if (!banks || !Array.isArray(banks) || !bankCode) {
        return null;
      }

      const code = bankCode.toString().trim();
      return banks.find(bank => 
        bank.sortCode === code || 
        bank.uuid === code ||
        bank.sortCode === bankCode ||
        bank.uuid === bankCode
      ) || null;

    } catch (error) {
      console.log('❌ Find bank by code error:', error);
      return null;
    }
  },

  /**
   * Find a bank by name (case insensitive partial match)
   * @param {Array} banks - List of banks
   * @param {string} bankName - Bank name to search
   */
  findBankByName(banks, bankName) {
    try {
      if (!banks || !Array.isArray(banks) || !bankName) {
        return null;
      }

      const searchName = bankName.toLowerCase().trim();
      
      // First try exact match
      let found = banks.find(bank => 
        bank.name.toLowerCase().trim() === searchName
      );
      
      // If not found, try partial match
      if (!found) {
        found = banks.find(bank => 
          bank.name.toLowerCase().includes(searchName) ||
          searchName.includes(bank.name.toLowerCase())
        );
      }
      
      return found || null;

    } catch (error) {
      console.log('❌ Find bank by name error:', error);
      return null;
    }
  },

  /**
   * Search banks by partial name match
   * @param {Array} banks - List of banks
   * @param {string} searchTerm - Search term
   */
  searchBanks(banks, searchTerm) {
    try {
      if (!banks || !Array.isArray(banks)) {
        return [];
      }
      
      if (!searchTerm || !searchTerm.trim()) {
        return banks;
      }

      const search = searchTerm.toLowerCase().trim();
      return banks.filter(bank => 
        bank.name && bank.name.toLowerCase().includes(search)
      );

    } catch (error) {
      console.log('❌ Search banks error:', error);
      return banks || [];
    }
  },

  /**
   * Validate bank account details
   * @param {Object} accountData - Account data to validate
   */
  validateBankAccount(accountData) {
    try {
      const { accountName, bankName, bankCode, accountNumber } = accountData || {};
      const errors = [];
      
      // Account name validation
      if (!accountName || typeof accountName !== 'string' || accountName.trim().length < 2) {
        errors.push('Account name must be at least 2 characters');
      }
      
      // Bank name validation
      if (!bankName || typeof bankName !== 'string' || bankName.trim().length < 2) {
        errors.push('Bank name is required');
      }
      
      // Bank code validation
      if (!bankCode || typeof bankCode !== 'string' || bankCode.trim().length < 3) {
        errors.push('Bank code is required');
      }
      
      // Account number validation (Nigerian accounts are typically 10 digits)
      if (!accountNumber) {
        errors.push('Account number is required');
      } else {
        const cleanNumber = accountNumber.toString().replace(/\s+/g, '');
        if (!/^\d{8,20}$/.test(cleanNumber)) {
          errors.push('Account number must be 8-20 digits');
        }
      }
      
      return {
        success: errors.length === 0,
        errors
      };

    } catch (error) {
      console.log('❌ Validate bank account error:', error);
      return {
        success: false,
        errors: ['Validation error occurred']
      };
    }
  },

  /**
   * Format bank display name (remove redundant words)
   * @param {Object} bank - Bank object
   */
  formatBankName(bank) {
    try {
      if (!bank || !bank.name) {
        return 'Unknown Bank';
      }
      
      let formattedName = bank.name.trim();
      
      // Remove redundant suffixes
      const suffixesToRemove = [
        /\s+(Bank)$/gi,
        /\s+(Plc)$/gi,
        /\s+(Limited)$/gi,
        /\s+(Ltd\.?)$/gi,
        /\s+(Microfinance\s+Bank)$/gi,
        /\s+(MFB)$/gi,
        /\s+(Micro-finance\s+Bank)$/gi
      ];
      
      suffixesToRemove.forEach(regex => {
        formattedName = formattedName.replace(regex, '').trim();
      });
      
      // If we removed everything, return original name
      return formattedName || bank.name;

    } catch (error) {
      console.log('❌ Format bank name error:', error);
      return bank?.name || 'Unknown Bank';
    }
  },

  /**
   * Get popular Nigerian banks (commonly used banks first)
   * @param {Array} banks - List of all banks
   */
  getPopularBanks(banks) {
    try {
      if (!banks || !Array.isArray(banks)) {
        return [];
      }

      // Popular bank codes based on usage and market share
      const popularCodes = [
        '044', // Access Bank Nigeria
        '058', // GTBank Plc
        '011', // First Bank of Nigeria
        '033', // United Bank for Africa
        '070', // Fidelity Bank
        '057', // Zenith Bank Plc
        '232', // Sterling Bank
        '035', // Wema Bank
        '214', // FCMB Plc
        '082', // Keystone Bank
        '032', // Union Bank
        '076', // Polaris Bank
        '030', // Heritage Bank
        '215', // Unity Bank
        '301', // JAIZ Bank
        '050', // Ecobank
        '221', // Stanbic IBTC Bank
        '068', // Standard Chartered Bank
        '023', // Citi Bank
        '101', // Providus Bank
        '103', // Globus Bank
        '102', // Titan Trust Bank
        '100'  // Suntrust Bank
      ];

      const popularBanks = [];
      const otherBanks = [];
      
      banks.forEach(bank => {
        const code = bank.sortCode || bank.uuid;
        if (popularCodes.includes(code)) {
          popularBanks.push(bank);
        } else {
          otherBanks.push(bank);
        }
      });
      
      // Sort popular banks by their position in popularCodes array
      popularBanks.sort((a, b) => {
        const aIndex = popularCodes.indexOf(a.sortCode || a.uuid);
        const bIndex = popularCodes.indexOf(b.sortCode || b.uuid);
        return aIndex - bIndex;
      });
      
      return popularBanks;

    } catch (error) {
      console.log('❌ Get popular banks error:', error);
      return [];
    }
  },

  /**
   * Categorize banks by type
   * @param {Array} banks - List of all banks
   */
  categorizeBanks(banks) {
    try {
      if (!banks || !Array.isArray(banks)) {
        return {
          commercial: [],
          microfinance: [],
          mortgage: [],
          mobile: [],
          popular: []
        };
      }

      const categories = {
        commercial: [],
        microfinance: [],
        mortgage: [],
        mobile: [],
        popular: this.getPopularBanks(banks)
      };

      banks.forEach(bank => {
        const name = bank.name.toLowerCase();
        
        if (name.includes('microfinance') || name.includes('mfb') || name.includes('micro-finance')) {
          categories.microfinance.push(bank);
        } else if (name.includes('mortgage')) {
          categories.mortgage.push(bank);
        } else if (name.includes('mobile') || name.includes('opay') || name.includes('palmpay')) {
          categories.mobile.push(bank);
        } else {
          categories.commercial.push(bank);
        }
      });

      return categories;

    } catch (error) {
      console.log('❌ Categorize banks error:', error);
      return {
        commercial: [],
        microfinance: [],
        mortgage: [],
        mobile: [],
        popular: []
      };
    }
  },

  /**
   * Prepare bank options for dropdown/picker components
   * @param {Array} banks - List of banks
   * @param {boolean} includePopularFirst - Whether to show popular banks first
   */
  getBankOptions(banks, includePopularFirst = false) {
    try {
      if (!banks || !Array.isArray(banks)) {
        return [];
      }

      let banksList = [...banks];
      
      if (includePopularFirst) {
        const popular = this.getPopularBanks(banks);
        const others = banks.filter(bank => {
          const code = bank.sortCode || bank.uuid;
          return !popular.find(pop => (pop.sortCode || pop.uuid) === code);
        });
        banksList = [...popular, ...others];
      }

      return banksList.map(bank => ({
        label: this.formatBankName(bank),
        value: bank.sortCode || bank.uuid,
        code: bank.sortCode || bank.uuid,
        name: bank.name,
        bank: bank,
        isPopular: includePopularFirst && this.getPopularBanks(banks).includes(bank)
      }));

    } catch (error) {
      console.log('❌ Get bank options error:', error);
      return [];
    }
  },

  /**
   * Cache management for banks list using AsyncStorage (React Native)
   */
  cache: {
    key: 'naira_banks_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours

    async get() {
      try {
        const cached = await AsyncStorage.getItem(this.key);
        if (!cached) {
          return null;
        }

        const parsed = JSON.parse(cached);
        const now = Date.now();

        // Check if cache has expired
        if (parsed.timestamp && (now - parsed.timestamp) > this.ttl) {
          await AsyncStorage.removeItem(this.key);
          return null;
        }

        return Array.isArray(parsed.data) ? parsed.data : null;
        
      } catch (error) {
        console.log('❌ Cache get error:', error);
        return null;
      }
    },

    async set(data) {
      try {
        if (!Array.isArray(data)) {
          console.log('❌ Cannot cache non-array data:', typeof data);
          return;
        }

        const cacheData = {
          data,
          timestamp: Date.now(),
          version: '1.0'
        };
        
        await AsyncStorage.setItem(this.key, JSON.stringify(cacheData));
        console.log('✅ Cached', data.length, 'banks successfully');
        
      } catch (error) {
        console.log('❌ Cache set error:', error);
      }
    },

    async clear() {
      try {
        await AsyncStorage.removeItem(this.key);
        console.log('✅ Banks cache cleared');
      } catch (error) {
        console.log('❌ Cache clear error:', error);
      }
    },

    async getInfo() {
      try {
        const cached = await AsyncStorage.getItem(this.key);
        if (!cached) {
          return { exists: false };
        }

        const parsed = JSON.parse(cached);
        const now = Date.now();
        const age = parsed.timestamp ? now - parsed.timestamp : 0;
        const isExpired = age > this.ttl;

        return {
          exists: true,
          timestamp: parsed.timestamp,
          age: age,
          isExpired: isExpired,
          dataLength: Array.isArray(parsed.data) ? parsed.data.length : 0,
          version: parsed.version || 'unknown'
        };

      } catch (error) {
        console.log('❌ Cache info error:', error);
        return { exists: false, error: error.message };
      }
    }
  }
};