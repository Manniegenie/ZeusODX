// services/historyService.js
import { apiClient } from './apiClient';

const DEBUG_HISTORY = true;
const dbg = (...args) => { if (DEBUG_HISTORY) console.log('[historyService]', ...args); };

export const transactionService = {
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

      if (params.type && ['DEPOSIT', 'WITHDRAWAL', 'SWAP', 'GIFTCARD'].includes(params.type.toUpperCase())) {
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

      dbg('getTransactionHistory → POST /history/token-specific', { requestBody });
      const response = await apiClient.post('/history/token-specific', requestBody);
      dbg('getTransactionHistory ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatTransaction(tx, currency));
        dbg('getTransactionHistory → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
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
      console.warn('getTransactionHistory error:', error?.message || error);
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

      if (params.type && ['DEPOSIT', 'WITHDRAWAL', 'SWAP', 'GIFTCARD'].includes(params.type.toUpperCase())) {
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

      dbg('getAllTokenTransactions → POST /history/all-tokens', { requestBody });
      const response = await apiClient.post('/history/all-tokens', requestBody);
      dbg('getAllTokenTransactions ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatTransaction(tx));
        dbg('getAllTokenTransactions → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
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
      console.warn('getAllTokenTransactions error:', error?.message || error);
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

      if (params.type && ['DEPOSIT', 'WITHDRAWAL', 'SWAP', 'GIFTCARD'].includes(params.type.toUpperCase())) {
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

      dbg('getCompleteTransactionHistory → POST /history/complete-history', { requestBody });
      const response = await apiClient.post('/history/complete-history', requestBody);
      dbg('getCompleteTransactionHistory ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatMixedTransaction(tx));
        dbg('getCompleteTransactionHistory → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
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
      console.warn('getCompleteTransactionHistory error:', error?.message || error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please try again.'
      };
    }
  },

  async getBillTransactions(params = {}) {
    try {
      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

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

      if (params.status) {
        const statusMap = {
          'PENDING': 'pending',
          'SUCCESSFUL': 'successful',
          'FAILED': 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      dbg('getBillTransactions → POST /history/all-utilities', { requestBody });
      const response = await apiClient.post('/history/all-utilities', requestBody);
      dbg('getBillTransactions ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatBillTransaction(tx));
        dbg('getBillTransactions → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
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
      console.warn('getBillTransactions error:', error?.message || error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  async getGiftCardTransactions(params = {}) {
    try {
      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      if (params.status) {
        const statusMap = {
          'PENDING': 'pending',
          'SUCCESSFUL': 'successful',
          'FAILED': 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      dbg('getGiftCardTransactions → POST /history/gift-cards', { requestBody });
      const response = await apiClient.post('/history/gift-cards', requestBody);
      dbg('getGiftCardTransactions ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatGiftCardTransaction(tx));
        dbg('getGiftCardTransactions → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            }
          },
          message: response.data.message || 'Gift card transactions retrieved successfully'
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || 'Failed to fetch gift card transactions'
      };
    } catch (error) {
      console.warn('getGiftCardTransactions error:', error?.message || error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  async getNGNZWithdrawals(params = {}) {
    try {
      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc'
      };

      if (params.status) {
        const statusMap = {
          'PENDING': 'pending',
          'SUCCESSFUL': 'successful',
          'FAILED': 'failed'
        };
        const mappedStatus = statusMap[params.status.toUpperCase()];
        if (mappedStatus) requestBody.status = mappedStatus;
      }

      if (params.startDate) requestBody.dateFrom = params.startDate.split('T')[0];
      if (params.endDate) requestBody.dateTo = params.endDate.split('T')[0];

      dbg('getNGNZWithdrawals → POST /history/ngnz-withdrawals', { requestBody });
      const response = await apiClient.post('/history/ngnz-withdrawals', requestBody);
      dbg('getNGNZWithdrawals ← response', { status: response.status, data: response.data });

      if (response.data?.success && response.data?.data) {
        const { transactions, pagination } = response.data.data;
        const mapped = transactions.map(tx => this.formatNGNZWithdrawal(tx));
        dbg('getNGNZWithdrawals → mapped sample', mapped?.[0]);

        return {
          success: true,
          data: {
            transactions: mapped,
            pagination: {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalCount: pagination.totalCount,
              limit: pagination.limit,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1
            }
          },
          message: response.data.message || 'NGNZ withdrawal history retrieved successfully'
        };
      }

      return {
        success: false,
        error: 'FETCH_FAILED',
        message: response.data?.error || 'Failed to fetch NGNZ withdrawals'
      };
    } catch (error) {
      console.warn('getNGNZWithdrawals error:', error?.message || error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.'
      };
    }
  },

  // ✅ NEW: Detect if transaction is an NGNZ withdrawal
  detectNGNZWithdrawal(transaction) {
    if (!transaction) return false;

    const details = transaction.details || {};

    // Check multiple indicators
    const indicators = [
      details.isNGNZWithdrawal === true,
      details.category === 'withdrawal' && details.currency === 'NGNZ',
      details.address === 'NGNZ_WITHDRAWAL',
      !!(details.destination?.bankName || details.bankName),
      !!(details.withdrawalReference || details.reference?.includes('NGNZ_WD')),
      details.provider === 'OBIEX' && !!details.providerStatus,
      details.hasReceiptData === true,
      details.receiptDetails?.category === 'withdrawal'
    ];

    const trueCount = indicators.filter(Boolean).length;
    const isNGNZ = trueCount >= 2;

    if (isNGNZ) {
      dbg('detectNGNZWithdrawal: NGNZ withdrawal detected', { id: transaction.id, indicators: trueCount });
    }

    return isNGNZ;
  },


  // ✅ UPDATED: formatTransaction now detects and delegates NGNZ withdrawals
  formatTransaction(transaction, currency) {
    if (!transaction) return null;

    // CRITICAL: Detect NGNZ withdrawals early
    const isNGNZWithdrawal = this.detectNGNZWithdrawal(transaction);

    if (isNGNZWithdrawal) {
      dbg('formatTransaction: Detected NGNZ withdrawal, delegating to formatNGNZWithdrawal');
      return this.formatNGNZWithdrawal(transaction);
    }

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
      Swap: 'SWAP',
      'Gift Card': 'GIFTCARD'
    };
    const mappedType = typeMap[transaction.type] || transaction.type;

    const createdAtRaw = transaction.details?.createdAt || transaction.createdAt || null;
    const parsedISO = this.tryParseToISO(createdAtRaw) || this.tryParseToISO(transaction.date) || null;
    const formattedDate = transaction.date || (parsedISO ? this.formatDate(parsedISO) : 'N/A');

    const baseTransaction = {
      id: transaction.id,
      type: mappedType,
      status: mappedStatus,
      amount: this.extractAmountFromString(transaction.amount, txCurrency),
      fee: 0,
      obiexFee: 0,
      currency: txCurrency,
      createdAt: parsedISO,
      updatedAt: parsedISO,
      completedAt: null,
      formattedAmount: transaction.amount,
      formattedFee: this.formatAmount(0, txCurrency),
      formattedDate,
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

    if (mappedType === 'GIFTCARD') {
      baseTransaction.cardType = transaction.cardType;
      baseTransaction.cardFormat = transaction.cardFormat;
      baseTransaction.cardRange = transaction.cardRange;
      baseTransaction.country = transaction.country;
    }

    return baseTransaction;
  },

  // ✅ UPDATED: Enhanced to extract from all possible locations
  formatNGNZWithdrawal(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt || transaction.details?.createdAt);
    const details = transaction.details || {};
    const destination = details.destination || {};
    const receiptDetails = details.receiptDetails || {};
    const obiexDetails = details.obiexDetails || {};

    // Extract from multiple locations with priority
    const withdrawalReference = transaction.withdrawalReference || 
                                details.withdrawalReference || 
                                details.reference || 
                                details.transactionId ||
                                receiptDetails.reference ||
                                obiexDetails.reference;

    const bankName = transaction.bankName || 
                    details.bankName || 
                    destination.bankName || 
                    receiptDetails.bankName;

    const accountName = transaction.accountName || 
                       details.accountName || 
                       destination.accountName || 
                       receiptDetails.accountName;

    const accountNumber = transaction.accountNumber || 
                         details.accountNumber || 
                         destination.accountNumberMasked || 
                         destination.accountNumberLast4 ||
                         receiptDetails.accountNumber;

    const amountSentToBank = transaction.amountSentToBank || 
                            details.amountSentToBank || 
                            details.bankAmount || 
                            receiptDetails.bankAmount;

    const withdrawalFee = transaction.withdrawalFee || 
                         details.withdrawalFee || 
                         details.fee ||
                         receiptDetails.withdrawalFee;

    const provider = transaction.provider || details.provider || obiexDetails.provider;
    const providerStatus = transaction.providerStatus || details.providerStatus || obiexDetails.status;

    return {
      id: transaction.id,
      type: 'WITHDRAWAL',
      status: this.mapNGNZWithdrawalStatus(transaction.status),
      amount: this.extractAmountFromString(transaction.amount, 'NGNZ'),
      currency: details.currency || transaction.currency || 'NGNZ',
      
      createdAt: parsedISO,
      updatedAt: parsedISO,
      
      formattedAmount: transaction.amount,
      formattedDate: transaction.date,
      formattedStatus: this.formatTransactionStatus(this.mapNGNZWithdrawalStatus(transaction.status)),
      
      // Promote all fields to top level
      isNGNZWithdrawal: true,
      withdrawalReference,
      bankName,
      accountName,
      accountNumber,
      amountSentToBank,
      withdrawalFee,
      provider,
      providerStatus,
      receiptData: transaction.receiptData || details.receiptDetails,
      
      details: {
        ...details,
        category: 'withdrawal',
        isNGNZWithdrawal: true,
        hasReceiptData: true,
        withdrawalReference,
        bankName,
        accountName,
        accountNumber,
        amountSentToBank,
        withdrawalFee,
        provider,
        providerStatus
      }
    };
  },

  formatBillTransaction(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt);

    // Debug: Log the transaction details to see what's available
    console.log('🔍 HistoryService formatBillTransaction Debug:', {
      transactionId: transaction.id,
      type: transaction.type,
      details: transaction.details,
      metaData: transaction.metaData,
      hasToken: !!(transaction.details?.token || transaction.metaData?.token)
    });

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
      utilityType: transaction.details?.billType,
      details: {
        ...transaction.details,
        ...(transaction.metaData && {
          token: transaction.metaData.token || transaction.details?.token,
          units: transaction.metaData.units || transaction.details?.units,
          band: transaction.metaData.band || transaction.details?.band,
          customerName: transaction.metaData.customer_name || transaction.details?.customerName,
          customerAddress: transaction.metaData.customer_address || transaction.details?.customerAddress
        }),
        category: 'utility',
        billCategory: transaction.type
      }
    };
  },

  formatGiftCardTransaction(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt);

    return {
      id: transaction.id,
      type: 'GIFTCARD',
      status: this.mapGiftCardStatus(transaction.status),
      amount: this.extractAmountFromString(transaction.amount, transaction.currency),
      currency: transaction.currency || 'USD',
      createdAt: parsedISO,
      updatedAt: parsedISO,
      formattedAmount: transaction.amount,
      formattedDate: transaction.date,
      formattedStatus: this.formatTransactionStatus(this.mapGiftCardStatus(transaction.status)),
      cardType: transaction.cardType,
      cardFormat: transaction.cardFormat,
      cardRange: transaction.cardRange,
      country: transaction.country,
      details: {
        ...transaction.details,
        category: 'giftcard',
        giftCardId: transaction.giftCardId,
        cardType: transaction.cardType,
        cardFormat: transaction.cardFormat,
        cardRange: transaction.cardRange,
        country: transaction.country,
        description: transaction.description,
        expectedRate: transaction.expectedRate,
        expectedRateDisplay: transaction.expectedRateDisplay,
        expectedAmountToReceive: transaction.expectedAmountToReceive,
        expectedSourceCurrency: transaction.expectedSourceCurrency,
        expectedTargetCurrency: transaction.expectedTargetCurrency,
        eCode: transaction.eCode,
        totalImages: transaction.totalImages
      }
    };
  },

  formatMixedTransaction(transaction) {
    if (!transaction) return null;

    const parsedISO = this.tryParseToISO(transaction.createdAt);

    // Check for NGNZ withdrawal using detection method
    if (this.detectNGNZWithdrawal(transaction)) {
      return this.formatNGNZWithdrawal(transaction);
    }

    if (transaction.details?.category === 'utility') {
      return this.formatBillTransaction(transaction);
    }

    if (transaction.details?.category === 'giftcard') {
      return this.formatGiftCardTransaction(transaction);
    }

    return this.formatTransaction(transaction);
  },

  mapBillStatus(status) {
    const statusMap = {
      'Successful': 'SUCCESSFUL',
      'successful': 'SUCCESSFUL',  // PayBeta airtime uses 'successful'
      'Failed': 'FAILED', 
      'Pending': 'PENDING',
      'completed': 'SUCCESSFUL',  // PayBeta electricity uses 'completed'
      'Completed': 'SUCCESSFUL',
      'Refunded': 'FAILED'
    };
    return statusMap[status] || 'PENDING';
  },

  mapGiftCardStatus(status) {
    const statusMap = {
      'Successful': 'SUCCESSFUL',
      'Failed': 'FAILED', 
      'Pending': 'PENDING',
      'Completed': 'SUCCESSFUL',
      'Rejected': 'FAILED'
    };
    return statusMap[status] || 'PENDING';
  },

  mapNGNZWithdrawalStatus(status) {
    const statusMap = {
      'Successful': 'SUCCESSFUL',
      'Failed': 'FAILED', 
      'Pending': 'PENDING',
      'Completed': 'SUCCESSFUL',
      'Rejected': 'FAILED'
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

    // Simple extraction - remove currency and symbols, parse as number
    const cleanAmount = String(amountString)
      .replace(currency || '', '')
      .replace(/[₦,\s]/g, '')
      .replace(/^[+\-]/, '') // Remove leading sign only
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
      USDT: { decimals: 6, name: 'Tether', networks: ['ETHEREUM', 'TRON', 'BSC'], confirmations: 12 },
      USDC: { decimals: 6, name: 'USD Coin', networks: ['ETHEREUM', 'POLYGON'], confirmations: 12 },
      BNB: { decimals: 8, name: 'Binance Coin', networks: ['BSC', 'BINANCE'], confirmations: 15 },
      SOL: { decimals: 9, name: 'Solana', networks: ['SOLANA'], confirmations: 1 },
      MATIC: { decimals: 8, name: 'Polygon', networks: ['POLYGON', 'ETHEREUM'], confirmations: 20 },
      TRX: { decimals: 6, name: 'Tron', networks: ['TRON', 'TRC20'], confirmations: 1 },
      NGNZ: { decimals: 2, name: 'NGNZ', networks: ['OBIEX'], confirmations: 1 }
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
      BNB: `https://bscscan.com/tx/${txHash}`,
      SOL: `https://solscan.io/tx/${txHash}`,
      MATIC: network === 'POLYGON' ? `https://polygonscan.com/tx/${txHash}` : `https://etherscan.io/tx/${txHash}`,
      TRX: `https://tronscan.org/#/transaction/${txHash}`
    };
    return explorers[currency?.toUpperCase()] || null;
  }
};