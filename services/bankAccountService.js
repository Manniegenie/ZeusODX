// services/bankAccountService.js
import { apiClient } from './apiClient';

// Paths
const GET_BANK_ACCOUNTS_PATH = '/bank/bank-accounts';
const ADD_BANK_ACCOUNT_PATH  = '/bank/add-bank';
const DELETE_BANK_ACCOUNT_PATH = '/bank/delete-bank';

// Helper
function toDigits(value) {
  if (value === null || value === undefined) return '';
  try {
    return String(value).replace(/\D/g, '');
  } catch {
    return '';
  }
}

function normalizeResponse(res) {
  const isAxios = res && typeof res === 'object' && 'data' in res && 'status' in res;
  const body = isAxios ? res.data : res;

  return {
    success: typeof body?.success === 'boolean' ? body.success : null,
    data: body?.data ?? null,
    message: body?.message ?? null,
    error: body?.error ?? null,
    status: isAxios ? res.status : (body?.status ?? null),
    raw: body
  };
}

function generateErrorCode(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') return 'OPERATION_FAILED';
  const msg = errorMessage.toLowerCase().trim();

  if ((msg.includes('maximum number') || msg.includes('limit reached')) && msg.includes('bank')) return 'ACCOUNT_LIMIT_REACHED';
  if (msg.includes('account number already exists') || msg.includes('duplicate account') || msg.includes('already exists')) return 'DUPLICATE_ACCOUNT';
  if (msg.includes('bank account not found') || (msg.includes('account') && msg.includes('not found'))) return 'ACCOUNT_NOT_FOUND';
  if (msg.includes('account number') && (msg.includes('required') || msg.includes('invalid'))) return 'INVALID_ACCOUNT_NUMBER';
  if (msg.includes('bank name') && (msg.includes('required') || msg.includes('invalid'))) return 'INVALID_BANK_NAME';
  if (msg.includes('account name') && (msg.includes('required') || msg.includes('invalid'))) return 'INVALID_ACCOUNT_NAME';
  if (msg.includes('bank code') && (msg.includes('required') || msg.includes('invalid'))) return 'INVALID_BANK_CODE';
  if (msg.includes('user not found')) return 'USER_NOT_FOUND';
  if (msg.includes('unauthorized')) return 'UNAUTHORIZED';
  if (msg.includes('validation') || msg.includes('required') || msg.includes('invalid')) return 'VALIDATION_ERROR';
  if (msg.includes('server error') || msg.includes('internal error')) return 'SERVER_ERROR';
  return 'OPERATION_FAILED';
}

function getRequiredAction(errorCode) {
  const map = {
    ACCOUNT_LIMIT_REACHED: 'DELETE_OLD_ACCOUNT',
    DUPLICATE_ACCOUNT: 'USE_DIFFERENT_ACCOUNT',
    INVALID_ACCOUNT_NUMBER: 'FIX_ACCOUNT_NUMBER',
    INVALID_BANK_NAME: 'SELECT_BANK',
    INVALID_ACCOUNT_NAME: 'FIX_ACCOUNT_NAME',
    INVALID_BANK_CODE: 'SELECT_BANK',
    ACCOUNT_NOT_FOUND: 'REFRESH_LIST',
    USER_NOT_FOUND: 'LOGIN_AGAIN',
    UNAUTHORIZED: 'LOGIN_AGAIN',
    VALIDATION_ERROR: 'FIX_INPUT',
    SERVER_ERROR: 'RETRY_LATER'
  };
  return map[errorCode] || null;
}

function userFriendly(errorCode, originalMessage) {
  const map = {
    ACCOUNT_LIMIT_REACHED: 'You have reached the maximum number of bank accounts (10). Please delete an old account to add a new one.',
    DUPLICATE_ACCOUNT: 'This account number is already added to your profile. Please use a different account.',
    INVALID_ACCOUNT_NUMBER: 'Please enter a valid account number (8–20 digits).',
    INVALID_BANK_NAME: 'Please select a valid bank from the list.',
    INVALID_ACCOUNT_NAME: 'Please enter a valid account holder name.',
    INVALID_BANK_CODE: 'Please select a valid bank from the list.',
    ACCOUNT_NOT_FOUND: 'Bank account not found. Please refresh and try again.',
    USER_NOT_FOUND: 'User session expired. Please log in again.',
    UNAUTHORIZED: 'Session expired. Please log in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection and try again.',
    OPERATION_FAILED: 'Operation failed. Please try again.'
  };
  return map[errorCode] || (originalMessage && originalMessage.length > 10 ? originalMessage : 'Something went wrong. Please try again.');
}

function mapBankAccount(account) {
  return {
    id: account.id ?? account._id,
    accountName: account.accountName,
    bankName: account.bankName,
    bankCode: account.bankCode,
    accountNumber: account.accountNumber, // Keep original account number
    addedAt: account.addedAt,
    isVerified: Boolean(account.isVerified),
    isActive: Boolean(account.isActive)
  };
}

export const bankService = {
  async getBankAccounts() {
    try {
      const raw = await apiClient.get(GET_BANK_ACCOUNTS_PATH);
      const { success, data, message, error } = normalizeResponse(raw);
      
      const bankAccountsFromAPI = data?.bankAccounts || raw.data?.data?.bankAccounts;
      
      const isOk = (success === true) || Array.isArray(bankAccountsFromAPI);
      if (!isOk) {
        const backendMessage = error || message || 'Failed to load bank accounts';
        const errorCode = generateErrorCode(backendMessage);
        return {
          success: false,
          error: errorCode,
          message: userFriendly(errorCode, backendMessage),
          data: { bankAccounts: [], summary: null }
        };
      }

      let bankAccountsRaw = Array.isArray(bankAccountsFromAPI) ? bankAccountsFromAPI : [];
      
      const summary = data?.summary || raw.data?.data?.summary || {
        totalAccounts: bankAccountsRaw.length,
        maxAllowed: 10,
        canAddMore: bankAccountsRaw.length < 10,
        remainingSlots: Math.max(10 - bankAccountsRaw.length, 0)
      };

      const mappedAccounts = bankAccountsRaw.map(mapBankAccount);

      return {
        success: true,
        data: {
          bankAccounts: mappedAccounts,
          summary
        },
        message: message || 'Bank accounts loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: userFriendly('NETWORK_ERROR'),
        data: { bankAccounts: [], summary: null }
      };
    }
  },

  async addBankAccount(bankData) {
    try {
      const validation = this.validateBankAccountData(bankData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.errors[0],
          errors: validation.errors
        };
      }

      const payload = {
        accountNumber: toDigits(bankData?.accountNumber),
        bankName: bankData?.bankName,
        accountName: bankData?.accountName,
        bankCode: bankData?.bankCode
      };

      const raw = await apiClient.post(ADD_BANK_ACCOUNT_PATH, payload);
      const norm = normalizeResponse(raw);

      const bankAccountFromAPI = norm.data?.bankAccount || raw.data?.data?.bankAccount;
      
      const isOk = (norm.success === true) || Boolean(bankAccountFromAPI);
      if (!isOk) {
        const backendMessage = norm.error || norm.message || 'Failed to add bank account';
        const errorCode = generateErrorCode(backendMessage);
        const requiresAction = getRequiredAction(errorCode);
        return {
          success: false,
          error: errorCode,
          message: userFriendly(errorCode, backendMessage),
          status: norm.status || 400,
          requiresAction
        };
      }

      return {
        success: true,
        data: { bankAccount: mapBankAccount(bankAccountFromAPI) },
        message: norm.message || raw.data?.message || 'Bank account added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: userFriendly('NETWORK_ERROR')
      };
    }
  },

  async deleteBankAccount(accountNumber) {
    try {
      if (!accountNumber) {
        return {
          success: false,
          error: 'INVALID_ACCOUNT_NUMBER',
          message: 'Account number is required'
        };
      }

      const cleanAccountNumber = String(accountNumber).trim();
      
      // Try query parameter first (most reliable for DELETE)
      let raw;
      try {
        const url = `${DELETE_BANK_ACCOUNT_PATH}?accountNumber=${encodeURIComponent(cleanAccountNumber)}`;
        raw = await apiClient.delete(url);
      } catch (queryError) {
        // Fallback to body
        raw = await apiClient.delete(DELETE_BANK_ACCOUNT_PATH, {
          data: { accountNumber: cleanAccountNumber },
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const norm = normalizeResponse(raw);
      
      const deleted = norm.raw?.deletedAccount || norm.data?.deletedAccount || raw.data?.deletedAccount;
      const isOk = (norm.success === true) || Boolean(deleted);
      if (!isOk) {
        const backendMessage = norm.error || norm.message || 'Failed to delete bank account';
        const errorCode = generateErrorCode(backendMessage);
        return {
          success: false,
          error: errorCode,
          message: userFriendly(errorCode, backendMessage)
        };
      }

      return {
        success: true,
        data: { deletedAccount: deleted ?? { accountNumber: cleanAccountNumber } },
        message: norm.message || raw.data?.message || 'Bank account deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: userFriendly('NETWORK_ERROR')
      };
    }
  },

  validateBankAccountData(data) {
    const errors = [];

    const acc = toDigits(data?.accountNumber ?? '');
    if (!acc) errors.push('Account number is required');
    else if (acc.length < 8 || acc.length > 20) errors.push('Account number must be between 8 and 20 characters');
    else if (!/^[0-9]+$/.test(acc)) errors.push('Account number must contain only numbers');

    if (!data?.bankName?.trim()) errors.push('Bank name is required');
    else if (data.bankName.trim().length < 2) errors.push('Bank name is too short');

    if (!data?.accountName?.trim()) errors.push('Account holder name is required');
    else if (data.accountName.trim().length < 2) errors.push('Account holder name is too short');
    else if (data.accountName.trim().length > 100) errors.push('Account holder name is too long');

    const code = data?.bankCode?.trim?.() ?? '';
    if (!code) errors.push('Bank code is required');
    else if (code.length < 2 || code.length > 10) errors.push('Bank code must be between 2 and 10 characters');

    return { isValid: errors.length === 0, errors };
  },

  getUserFriendlyMessage(code, original) {
    return userFriendly(code, original);
  }
};