// services/historyService.js
import { apiClient } from './apiClient';

export const transactionService = {
  /**
   * Fetch transaction history for a specific currency using /token-specific endpoint
   * @param {string} currency - Currency symbol (e.g., 'AVAX', 'BTC', 'ETH')
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Transaction history response
   */
  async getTransactionHistory(currency, params = {}) {
    try {
      if (!currency) {
        return {
          success: false,
          error: 'INVALID_CURRENCY',
          message: 'Currency is required'
        };
      }

      const requestBody = {
        currency: currency.toUpperCase(),
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      // Map type values (only include if valid)
      if (params.type && ['DEPOSIT', 'WITHDRAWAL', 'SWAP'].includes(params.type.toUpperCase())) {
        requestBody.type = params.type.toUpperCase();
      }

      // Map status values to backend format
      if (params.status) {
        const statusMap = {
          PENDING: 'pending',
          APPROVED: 'pending',
          PROCESSING: 'pending',
          SUCCESSFUL: 'successful',
          COMPLETED: 'successful',
          CONFIRMED: 'successful',
          FAILED: 'failed',
          REJECTED: 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      // Date range
      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      const response = await apiClient.post('/history/token-specific', requestBody);

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;

        return {
          success: true,
          data: {
            transactions: transactions.map(tx => this.formatTransaction(tx, currency)),
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            },
            filters: {
              currency: currency.toUpperCase(),
              type: params.type || 'all',
              status: params.status || 'all',
              network: 'all',
              dateRange: {
                start: params.startDate || null,
                end: params.endDate || null
              }
            },
            summary: this.generateSummaryFromTransactions(transactions, currency)
          },
          message: response.data.message || `${currency} transactions retrieved successfully`
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || response.data?.message || `Failed to fetch ${currency} transactions`,
        status: response.status || 400
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  async getAllTokenTransactions(params = {}) {
    try {
      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      if (params.type && ['DEPOSIT', 'WITHDRAWAL', 'SWAP'].includes(params.type.toUpperCase())) {
        requestBody.type = params.type.toUpperCase();
      }

      if (params.status) {
        const statusMap = {
          PENDING: 'pending',
          APPROVED: 'pending',
          PROCESSING: 'pending',
          SUCCESSFUL: 'successful',
          COMPLETED: 'successful',
          CONFIRMED: 'successful',
          FAILED: 'failed',
          REJECTED: 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      const response = await apiClient.post('/history/all-tokens', requestBody);

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;

        return {
          success: true,
          data: {
            transactions: transactions.map(tx => this.formatTransaction(tx)),
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            }
          },
          message: response.data.message || 'All token transactions retrieved successfully'
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || 'Failed to fetch all token transactions'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please try again.'
      };
    }
  },

  async getCompleteTransactionHistory(params = {}) {
    try {
      const requestBody = {
        transactionType: params.transactionType || 'all',
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      if (params.status) {
        const statusMap = {
          PENDING: 'pending',
          APPROVED: 'pending',
          PROCESSING: 'pending',
          SUCCESSFUL: 'successful',
          COMPLETED: 'successful',
          CONFIRMED: 'successful',
          FAILED: 'failed',
          REJECTED: 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      const response = await apiClient.post('/history/complete-history', requestBody);

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;

        return {
          success: true,
          data: {
            transactions: transactions.map(tx => this.formatMixedTransaction(tx)),
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            }
          },
          message: response.data.message || 'Complete transaction history retrieved successfully'
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || 'Failed to fetch complete transaction history'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please try again.'
      };
    }
  },

  // NEW: Fetch utility transactions
  async getBillTransactions(params = {}) {
    try {
      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      // Map bill categories to backend utilityType
      if (params.billType) {
        const billTypeMap = {
          'Airtime': 'airtime',
          'Data': 'data',
          'Cable': 'cable_tv',
          'Electricity': 'electricity'
        };
        const mappedType = billTypeMap[params.billType];
        if (mappedType) requestBody.utilityType = mappedType;
      }

      // Map status values to backend format
      if (params.status) {
        const statusMap = {
          'PENDING': 'pending',
          'SUCCESSFUL': 'successful',
          'FAILED': 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      // Date range
      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      const response = await apiClient.post('/history/all-utilities', requestBody);

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;

        return {
          success: true,
          data: {
            transactions: transactions.map(tx => this.formatBillTransaction(tx)),
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            }
          },
          message: response.data.message || 'Utility transactions retrieved successfully'
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || 'Failed to fetch utility transactions'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  // ---------- Helpers (updated) ----------

  formatTransaction(transaction, currency) {
    if (!transaction) return null;

    const txCurrency = currency || transaction.details?.currency || 'UNKNOWN';

    const statusMap = {
      Successful: 'SUCCESSFUL',
      Failed: 'FAILED',
      Pending: 'PENDING'
    };
    const mappedStatus = statusMap[transaction.status] || transaction.status;

    const typeMap = {
      Deposit: 'DEPOSIT',
      Withdrawal: 'WITHDRAWAL',
      Swap: 'SWAP'
    };
    const mappedType = typeMap[transaction.type] || transaction.type;

    // Prefer raw createdAt if backend provides it (some endpoints remove it)
    const createdAtRaw =
      transaction.details?.createdAt ||
      transaction.createdAt ||        // if backend included it
      null;

    // Attempt to parse raw first; if unavailable, fall back to the formatted `date` string
    const parsedISO =
      this.tryParseToISO(createdAtRaw) ||
      this.tryParseToISO(transaction.date) || // parse if backend formatted string is parseable
      null;                                   // IMPORTANT: do NOT default to "now"

    // For display, prefer server-provided formatted date; otherwise format parsed ISO
    const formattedDate =
      transaction.date ||
      (parsedISO ? this.formatDate(parsedISO) : 'N/A');

    return {
      id: transaction.id,
      type: mappedType,
      status: mappedStatus,

      // numeric/raws
      amount: this.extractAmountFromString(transaction.amount, txCurrency),
      fee: 0,
      obiexFee: 0,
      currency: txCurrency,

      // timing (no "now" fallback)
      createdAt: parsedISO,     // ISO or null
      updatedAt: parsedISO,     // ISO or null
      completedAt: null,

      // formatted
      formattedAmount: transaction.amount,
      formattedFee: this.formatAmount(0, txCurrency),
      formattedDate,            // 👈 use this on the UI
      formattedStatus: this.formatTransactionStatus(mappedStatus),

      netAmount: this.extractAmountFromString(transaction.amount, txCurrency),
      isConfirmed: mappedStatus === 'SUCCESSFUL',
      estimatedTime: mappedStatus === 'SUCCESSFUL' ? 'Completed' : 'Pending',

      blockExplorerUrl: this.getBlockExplorerUrl(
        transaction.details?.hash,
        transaction.details?.network,
        txCurrency
      ),

      details: transaction.details
    };
  },

  // NEW: Format bill transactions
  formatBillTransaction(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt);

    return {
      id: transaction.id,
      type: 'BILL_PAYMENT',
      status: this.mapBillStatus(transaction.status),
      amount: this.extractAmountFromString(transaction.amount, 'NGN'),
      currency: 'NGN',
      
      createdAt: parsedISO,
      updatedAt: parsedISO,
      
      formattedAmount: transaction.amount,
      formattedDate: transaction.date,
      formattedStatus: this.formatTransactionStatus(this.mapBillStatus(transaction.status)),
      
      billType: transaction.type, // This contains "Airtime", "Data", etc.
      utilityType: transaction.details?.billType,
      
      details: {
        ...transaction.details,
        category: 'utility',
        billCategory: transaction.type
      }
    };
  },

  // NEW: Format mixed transactions from complete-history
  formatMixedTransaction(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt);
    
    // Check if it's a utility transaction
    if (transaction.details?.category === 'utility') {
      return {
        id: transaction.id,
        type: 'BILL_PAYMENT',
        status: this.mapBillStatus(transaction.status),
        amount: this.extractAmountFromString(transaction.amount, 'NGN'),
        currency: 'NGN',
        
        createdAt: parsedISO,
        updatedAt: parsedISO,
        
        formattedAmount: transaction.amount,
        formattedDate: transaction.date,
        formattedStatus: this.formatTransactionStatus(this.mapBillStatus(transaction.status)),
        
        billType: transaction.type,
        details: transaction.details
      };
    }
    
    // It's a token transaction - use existing formatting
    return this.formatTransaction(transaction);
  },

  // NEW: Map bill statuses
  mapBillStatus(status) {
    const statusMap = {
      'Successful': 'SUCCESSFUL',
      'Failed': 'FAILED', 
      'Pending': 'PENDING',
      'Refunded': 'FAILED'
    };
    return statusMap[status] || 'PENDING';
  },

  tryParseToISO(dateLike) {
    if (!dateLike) return null;
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  },

  extractAmountFromString(amountString, currency) {
    if (!amountString) return 0;
    const cleanAmount = amountString
      .replace(/[+\-₦,\s]/g, '')
      .replace(currency || '', '')
      .trim();
    return parseFloat(cleanAmount) || 0;
  },

  generateSummaryFromTransactions(transactions, currency) {
    const summary = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      depositCount: 0,
      withdrawalCount: 0,
      totalFees: 0,
      totalObiexFees: 0,
      avgDepositAmount: 0,
      avgWithdrawalAmount: 0,
      statusBreakdown: {}
    };

    transactions.forEach(tx => {
      const amount = this.extractAmountFromString(tx.amount, currency);

      if (tx.type === 'Deposit') {
        summary.totalDeposits += amount;
        summary.depositCount += 1;
      } else if (tx.type === 'Withdrawal') {
        summary.totalWithdrawals += amount;
        summary.withdrawalCount += 1;
      }

      if (!summary.statusBreakdown[tx.status]) {
        summary.statusBreakdown[tx.status] = { count: 0, totalAmount: 0 };
      }
      summary.statusBreakdown[tx.status].count += 1;
      summary.statusBreakdown[tx.status].totalAmount += amount;
    });

    if (summary.depositCount > 0) {
      summary.avgDepositAmount = summary.totalDeposits / summary.depositCount;
    }
    if (summary.withdrawalCount > 0) {
      summary.avgWithdrawalAmount = summary.totalWithdrawals / summary.withdrawalCount;
    }

    return this.formatSummary(summary, currency);
  },

  formatSummary(summary, currency) {
    if (!summary) return this.getEmptySummary(currency);

    return {
      currency: currency,
      totalDeposits: parseFloat(summary.totalDeposits || 0),
      totalWithdrawals: parseFloat(summary.totalWithdrawals || 0),
      depositCount: summary.depositCount || 0,
      withdrawalCount: summary.withdrawalCount || 0,
      totalFees: parseFloat(summary.totalFees || 0),
      totalObiexFees: parseFloat(summary.totalObiexFees || 0),
      avgDepositAmount: parseFloat(summary.avgDepositAmount || 0),
      avgWithdrawalAmount: parseFloat(summary.avgWithdrawalAmount || 0),
      statusBreakdown: summary.statusBreakdown || {},

      formattedTotalDeposits: this.formatAmount(summary.totalDeposits, currency),
      formattedTotalWithdrawals: this.formatAmount(summary.totalWithdrawals, currency),
      formattedTotalFees: this.formatAmount(summary.totalFees, currency),
      formattedAvgDeposit: this.formatAmount(summary.avgDepositAmount, currency),
      formattedAvgWithdrawal: this.formatAmount(summary.avgWithdrawalAmount, currency),

      netBalance: this.calculateNetBalance(summary),
      totalTransactions: (summary.depositCount || 0) + (summary.withdrawalCount || 0),
      formattedNetBalance: this.formatAmount(this.calculateNetBalance(summary), currency)
    };
  },

  getEmptySummary(currency) {
    return {
      currency: currency,
      totalDeposits: 0,
      totalWithdrawals: 0,
      depositCount: 0,
      withdrawalCount: 0,
      totalFees: 0,
      totalObiexFees: 0,
      avgDepositAmount: 0,
      avgWithdrawalAmount: 0,
      statusBreakdown: {},
      formattedTotalDeposits: this.formatAmount(0, currency),
      formattedTotalWithdrawals: this.formatAmount(0, currency),
      formattedTotalFees: this.formatAmount(0, currency),
      formattedAvgDeposit: this.formatAmount(0, currency),
      formattedAvgWithdrawal: this.formatAmount(0, currency),
      netBalance: 0,
      formattedNetBalance: this.formatAmount(0, currency),
      totalTransactions: 0
    };
  },

  formatAmount(amount, currency) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return `0 ${currency || ''}`;
    const config = this.getCurrencyConfig(currency);
    const decimals = config.decimals;
    return `${numAmount.toFixed(decimals)} ${currency || ''}`;
  },

  formatDate(date) {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  },

  formatTransactionStatus(status) {
    const statusMap = {
      PENDING: { display: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏳', description: 'Transaction is waiting to be processed' },
      APPROVED: { display: 'Approved', color: '#3B82F6', bgColor: '#DBEAFE', icon: '✓', description: 'Transaction has been approved' },
      PROCESSING: { display: 'Processing', color: '#3B82F6', bgColor: '#DBEAFE', icon: '🔄', description: 'Transaction is being processed' },
      SUCCESSFUL: { display: 'Completed', color: '#10B981', bgColor: '#D1FAE5', icon: '✅', description: 'Transaction completed successfully' },
      CONFIRMED: { display: 'Confirmed', color: '#10B981', bgColor: '#D1FAE5', icon: '✅', description: 'Transaction confirmed on blockchain' },
      FAILED: { display: 'Failed', color: '#EF4444', bgColor: '#FEE2E2', icon: '❌', description: 'Transaction failed' },
      REJECTED: { display: 'Rejected', color: '#EF4444', bgColor: '#FEE2E2', icon: '🚫', description: 'Transaction was rejected' }
    };
    return statusMap[status] || { display: status || 'Unknown', color: '#6B7280', bgColor: '#F3F4F6', icon: '❓', description: 'Status unknown' };
  },

  getCurrencyConfig(currency) {
    const configs = {
      BTC: { decimals: 8, name: 'Bitcoin', networks: ['BITCOIN'], confirmations: 6 },
      ETH: { decimals: 8, name: 'Ethereum', networks: ['ETHEREUM'], confirmations: 12 },
      AVAX: { decimals: 8, name: 'Avalanche', networks: ['AVALANCHE_C', 'AVALANCHE_X', 'AVALANCHE_P'], confirmations: 12 },
      USDT: { decimals: 6, name: 'Tether', networks: ['ETHEREUM', 'TRON', 'BSC'], confirmations: 12 },
      USDC: { decimals: 6, name: 'USD Coin', networks: ['ETHEREUM', 'AVALANCHE_C', 'POLYGON'], confirmations: 12 },
      BNB: { decimals: 8, name: 'Binance Coin', networks: ['BSC', 'BINANCE'], confirmations: 15 },
      ADA: { decimals: 6, name: 'Cardano', networks: ['CARDANO'], confirmations: 15 },
      SOL: { decimals: 9, name: 'Solana', networks: ['SOLANA'], confirmations: 1 },
      DOT: { decimals: 10, name: 'Polkadot', networks: ['POLKADOT'], confirmations: 12 },
      MATIC: { decimals: 8, name: 'Polygon', networks: ['POLYGON', 'ETHEREUM'], confirmations: 20 }
    };
    return configs[currency?.toUpperCase()] || { decimals: 8, name: currency || 'Unknown', networks: [], confirmations: 12 };
  },

  calculateNetBalance(summary) {
    const deposits = parseFloat(summary.totalDeposits || 0);
    const withdrawals = parseFloat(summary.totalWithdrawals || 0);
    return deposits - withdrawals;
  },

  getBlockExplorerUrl(txHash, network, currency) {
    if (!txHash) return null;
    const explorers = {
      BTC: `https://blockstream.info/tx/${txHash}`,
      ETH: `https://etherscan.io/tx/${txHash}`,
      AVAX: `https://snowtrace.io/tx/${txHash}`,
      BNB: `https://bscscan.com/tx/${txHash}`,
      ADA: `https://cardanoscan.io/transaction/${txHash}`,
      SOL: `https://solscan.io/tx/${txHash}`,
      DOT: `https://polkadot.subscan.io/extrinsic/${txHash}`,
      MATIC: network === 'POLYGON' ? `https://polygonscan.com/tx/${txHash}` : `https://etherscan.io/tx/${txHash}`
    };
    return explorers[currency?.toUpperCase()] || null;
  }
};