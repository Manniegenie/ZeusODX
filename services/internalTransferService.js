// services/usernameTransferService.js
import { apiClient } from './apiClient';

function pick(obj, path, fallback = undefined) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
}

function normalizeResponse(raw) {
  // Support both axios responses and pre-unwrapped client responses
  const root = raw?.data ?? raw;

  // Some backends nest the payload inside data.data
  const payload = root?.data ?? root;

  const amount = pick(payload, 'amount', 0);
  const currency = pick(payload, 'currency', '');
  const recipient = pick(payload, 'recipient', null);
  const recipientUsername =
    recipient?.username ??
    pick(payload, 'recipientUsername', '') ??
    '';

  const normalized = {
    transactionId: pick(payload, 'transactionId') ?? pick(payload, '_id') ?? null,
    reference:
      pick(payload, 'transferReference') ??
      pick(payload, 'reference') ??
      pick(payload, 'transferRef') ??
      null,
    transferReference:
      pick(payload, 'transferReference') ??
      pick(payload, 'reference') ??
      null,
    recipient: recipient
      ? { username: recipient.username ?? '', fullName: recipient.fullName ?? '' }
      : { username: recipientUsername, fullName: pick(payload, 'recipient.fullName') ?? pick(payload, 'recipientFullName') ?? '' },
    amount,
    currency,
    status: pick(payload, 'status', null),
    memo: pick(payload, 'memo', null),
    completedAt: pick(payload, 'completedAt') ?? pick(payload, 'date') ?? null,
    securityInfo:
      pick(payload, 'security_info') ??
      pick(payload, 'securityInfo') ??
      null,
    message: pick(root, 'message') ?? 'Transfer completed successfully',
  };

  return normalized;
}

function isSuccess(raw) {
  const root = raw?.data ?? raw;
  // Accept truthy success OR presence of typical success fields
  return Boolean(root?.success ?? pick(root, 'data.status') ?? pick(root, 'status')) || false;
}

export const usernameTransferService = {
  /**
   * Transfer funds to another user by username
   */
  async transferToUsername(transferData) {
    try {
      console.log('💸 Starting username transfer:', {
        recipientUsername: transferData.recipientUsername,
        amount: transferData.amount,
        currency: transferData.currency,
        memo: transferData.memo ? 'Present' : 'None',
      });

      const body = {
        recipientUsername: transferData.recipientUsername.trim(),
        amount: Number(transferData.amount),
        currency: transferData.currency.toUpperCase(),
        twoFactorCode: transferData.twoFactorCode,
        passwordpin: transferData.passwordpin,
        memo: transferData.memo?.trim() || null,
      };

      const res = await apiClient.post('/username-withdraw/internal', body);

      if (isSuccess(res)) {
        const normalized = normalizeResponse(res);

        // Guard to avoid UI crash
        if (!normalized.recipient?.username) {
          console.warn('⚠️ Missing recipient.username in backend response. Sample:', res?.data ?? res);
        }

        console.log('✅ Username transfer successful:', {
          transactionId: normalized.transactionId,
          reference: normalized.reference,
          recipient: normalized.recipient.username,
          amount: normalized.amount,
          currency: normalized.currency,
          status: normalized.status,
        });

        return {
          success: true,
          data: normalized,
        };
      }

      // Standardize error from backend (non-2xx or success=false)
      const root = res?.data ?? res ?? {};
      const backendMessage = root.error || root.message || 'Transfer failed';
      const statusCode = root.status || root.statusCode || 400;
      const errorCode = this.generateErrorCode(backendMessage, root.error);
      const requiresAction = this.getRequiredAction(errorCode, backendMessage);

      console.log('❌ Username transfer failed:', {
        backend_message: backendMessage,
        error_code: errorCode,
        backend_error: root.error,
        requires_action: requiresAction,
        status: statusCode,
      });

      return {
        success: false,
        error: errorCode,
        message: this.getUserFriendlyMessage(errorCode, backendMessage),
        status: statusCode,
        requiresAction,
        details: root.details || root.kycDetails || null,
      };
    } catch (error) {
      // Axios style errors
      const hasResponse = !!error?.response;
      if (hasResponse) {
        const root = error.response?.data ?? {};
        const backendMessage = root.error || root.message || error.message || 'Transfer failed';
        const statusCode = error.response?.status || root.status || 400;
        const errorCode = this.generateErrorCode(backendMessage, root.error);
        const requiresAction = this.getRequiredAction(errorCode, backendMessage);

        console.error('❌ Username transfer HTTP error:', {
          status: statusCode,
          backend_message: backendMessage,
          error_code: errorCode,
        });

        return {
          success: false,
          error: errorCode,
          message: this.getUserFriendlyMessage(errorCode, backendMessage),
          status: statusCode,
          requiresAction,
          details: root.details || null,
        };
      }

      console.error('❌ Username transfer service network/error:', {
        error: error?.message || String(error),
        type: 'NETWORK_ERROR',
      });

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.',
      };
    }
  },

  /** Generate standardized error code */
  generateErrorCode(errorMessage, backendError) {
    if (backendError) {
      const standardErrors = [
        'RECIPIENT_NOT_FOUND',
        'INSUFFICIENT_BALANCE',
        'KYC_LIMIT_EXCEEDED',
        'DUPLICATE_TRANSFER',
        'TRANSFER_EXECUTION_FAILED',
        'UNSUPPORTED_CURRENCY',
        'INVALID_OTP',
        'INVALID_2FA_CODE',
        'INVALID_PASSWORDPIN',
        'SETUP_2FA_REQUIRED',
        'SETUP_PIN_REQUIRED',
      ];
      if (standardErrors.includes(backendError)) return backendError;
    }

    if (!errorMessage || typeof errorMessage !== 'string') return 'TRANSFER_FAILED';

    const msg = errorMessage.toLowerCase().trim();

    // Check for OTP invalid errors
    if (msg.includes('invalid otp') || msg.includes('otp invalid') || 
        msg.includes('incorrect otp') || msg.includes('otp is incorrect') ||
        msg.includes('invalid verification code') || msg.includes('verification code invalid')) {
      return 'INVALID_OTP';
    }
    // Check for 2FA invalid errors
    if (msg.includes('two-factor authentication') || msg.includes('2fa')) {
      if (msg.includes('not set up') || msg.includes('not enabled')) return 'SETUP_2FA_REQUIRED';
      if (msg.includes('invalid') || msg.includes('incorrect')) return 'INVALID_2FA_CODE';
    }
    // Check for PIN invalid errors
    if (msg.includes('password pin') || msg.includes('passwordpin') || msg.includes('pin')) {
      if (msg.includes('not set up') || msg.includes('not enabled')) return 'SETUP_PIN_REQUIRED';
      if (msg.includes('invalid') || msg.includes('incorrect')) return 'INVALID_PASSWORDPIN';
    }

    if (
      msg.includes('recipient user not found') ||
      msg.includes('user not found') ||
      msg.includes('cannot send to yourself')
    ) return 'RECIPIENT_NOT_FOUND';

    if (msg.includes('recipient account is inactive')) return 'RECIPIENT_INACTIVE';

    if (msg.includes('insufficient') && msg.includes('balance')) return 'INSUFFICIENT_BALANCE';

    if (
      msg.includes('kyc limit') ||
      msg.includes('transaction limit') ||
      msg.includes('limit exceeded') ||
      (msg.includes('exceeds') && msg.includes('limit'))
    ) return 'KYC_LIMIT_EXCEEDED';

    if (
      msg.includes('duplicate') ||
      msg.includes('similar transfer request') ||
      msg.includes('already pending') ||
      msg.includes('too many pending transfers')
    ) return 'DUPLICATE_TRANSFER';

    if (
      msg.includes('validation failed') ||
      msg.includes('invalid username') ||
      msg.includes('invalid amount') ||
      msg.includes('invalid currency') ||
      msg.includes('required field') ||
      msg.includes('minimum transfer amount')
    ) return 'VALIDATION_ERROR';

    if (msg.includes('currency') && msg.includes('not supported')) return 'UNSUPPORTED_CURRENCY';

    return 'TRANSFER_FAILED';
  },

  /** Map error -> user action */
  getRequiredAction(errorCode) {
    const actionMap = {
      SETUP_2FA_REQUIRED: 'SETUP_2FA',
      SETUP_PIN_REQUIRED: 'SETUP_PIN',
      INVALID_OTP: 'RETRY_OTP',
      INVALID_2FA_CODE: 'RETRY_2FA',
      INVALID_PASSWORDPIN: 'RETRY_PIN',
      RECIPIENT_NOT_FOUND: 'CHECK_USERNAME',
      RECIPIENT_INACTIVE: 'CONTACT_RECIPIENT',
      KYC_LIMIT_EXCEEDED: 'UPGRADE_KYC',
      INSUFFICIENT_BALANCE: 'ADD_FUNDS',
      DUPLICATE_TRANSFER: 'WAIT_PENDING',
      VALIDATION_ERROR: 'FIX_INPUT',
      UNSUPPORTED_CURRENCY: 'SELECT_CURRENCY',
      TRANSFER_EXECUTION_FAILED: 'RETRY_LATER',
    };
    return actionMap[errorCode] || null;
  },

  /** User-friendly messages */
  getUserFriendlyMessage(errorCode, originalMessage) {
    const friendly = {
      SETUP_2FA_REQUIRED: 'Two-factor authentication is required for transfers. Please set it up in your security settings.',
      SETUP_PIN_REQUIRED: 'A password PIN is required for transfers. Please set it up in your security settings.',
      INVALID_OTP: 'The OTP you entered is incorrect. Please try again.',
      INVALID_2FA_CODE: 'The 2FA code you entered is incorrect. Please check your authenticator app and try again.',
      INVALID_PASSWORDPIN: 'The password PIN you entered is incorrect. Please try again.',
      RECIPIENT_NOT_FOUND: 'The username you entered was not found or you cannot send to yourself.',
      RECIPIENT_INACTIVE: 'The recipient account is inactive and cannot receive transfers.',
      KYC_LIMIT_EXCEEDED: 'This transfer exceeds your account limit. Please upgrade your verification.',
      INSUFFICIENT_BALANCE: "You don't have enough balance for this transfer.",
      DUPLICATE_TRANSFER: 'You have a similar pending transfer. Please wait or try again later.',
      VALIDATION_ERROR: 'Please check your transfer details and try again.',
      UNSUPPORTED_CURRENCY: 'The selected currency is not supported.',
      TRANSFER_EXECUTION_FAILED: 'Transfer processing failed. Please try again later.',
      NETWORK_ERROR: 'Network connection failed. Please check your internet connection and try again.',
      TRANSFER_FAILED: 'Transfer failed. Please try again.',
    };
    return friendly[errorCode] || (originalMessage?.length > 10 ? originalMessage : 'Something went wrong. Please try again.');
  },

  /** Validation helpers (unchanged except for NGNZ code fix) */
  validateTransferData(data) {
    const errors = [];

    if (!data.recipientUsername?.trim()) {
      errors.push('Recipient username is required');
    } else {
      const username = data.recipientUsername.trim();
      if (username.length < 3) errors.push('Username must be at least 3 characters long');
      else if (username.length > 50) errors.push('Username is too long');
      else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) errors.push('Username contains invalid characters');
    }

    const amount = Number(data.amount);
    if (!data.amount || Number.isNaN(amount)) errors.push('Amount is required');
    else if (amount <= 0) errors.push('Amount must be greater than zero');
    else if (amount > 1000000) errors.push('Amount is too large');

    if (!data.currency?.trim()) {
      errors.push('Currency is required');
    } else {
      // NOTE: align with app (uses NGNZ)
      const valid = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'DOGE', 'MATIC', 'AVAX', 'NGNZ'];
      if (!valid.includes(data.currency.toUpperCase())) errors.push('Please select a valid currency');
    }

    if (!data.twoFactorCode?.trim()) errors.push('Two-factor authentication code is required');
    else if (!/^\d{6}$/.test(data.twoFactorCode.trim())) errors.push('2FA code must be exactly 6 digits');

    if (!data.passwordpin?.trim()) errors.push('Password PIN is required');
    else if (!/^\d{6}$/.test(data.passwordpin.trim())) errors.push('Password PIN must be exactly 6 digits');

    if (data.memo && data.memo.length > 200) errors.push('Memo cannot exceed 200 characters');

    return { isValid: errors.length === 0, errors };
  },

  formatAmount(amount, currency) {
    const num = Number(amount);
    if (Number.isNaN(num)) return `0 ${currency}`;
    if (['USDT', 'USDC', 'NGNZ'].includes(currency?.toUpperCase())) {
      return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    } else if (['BTC', 'ETH'].includes(currency?.toUpperCase())) {
      return `${num.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })} ${currency}`;
    }
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${currency}`;
  },

  getSupportedCurrencies() {
    return [
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 8, type: 'crypto' },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 18, type: 'crypto' },
      { code: 'SOL', name: 'Solana', symbol: 'SOL', decimals: 9, type: 'crypto' },
      { code: 'USDT', name: 'Tether USD', symbol: '$', decimals: 6, type: 'stablecoin' },
      { code: 'USDC', name: 'USD Coin', symbol: '$', decimals: 6, type: 'stablecoin' },
      { code: 'BNB', name: 'BNB', symbol: 'BNB', decimals: 18, type: 'crypto' },
      { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', decimals: 8, type: 'crypto' },
      { code: 'MATIC', name: 'Polygon', symbol: 'MATIC', decimals: 18, type: 'crypto' },
      { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', decimals: 18, type: 'crypto' },
      { code: 'NGNZ', name: 'Nigerian Naira Z', symbol: '₦', decimals: 2, type: 'fiat-bridge' }, // aligned
    ];
  },

  getCurrencyInfo(currencyCode) {
    const list = this.getSupportedCurrencies();
    return list.find(c => c.code === currencyCode?.toUpperCase()) || {
      code: currencyCode,
      name: currencyCode,
      symbol: currencyCode,
      decimals: 2,
      type: 'unknown',
    };
  },

  getMinimumTransferAmounts() {
    return {
      BTC: 0.00001,
      ETH: 0.001,
      SOL: 0.01,
      USDT: 1,
      USDC: 1,
      BNB: 0.001,
      DOGE: 1,
      MATIC: 1,
      AVAX: 0.01,
      NGNZ: 100,
    };
  },

  validateMinimumAmount(amount, currency) {
    const minimums = this.getMinimumTransferAmounts();
    const min = minimums[currency?.toUpperCase()] || 0;
    if (amount < min) {
      return {
        isValid: false,
        message: `Minimum transfer amount for ${currency} is ${this.formatAmount(min, currency)}`,
      };
    }
    return { isValid: true };
  },

  formatUsername(username) {
    if (!username) return '';
    return username.startsWith('@') ? username : `@${username}`;
  },

  generateReferencePreview() {
    return `INT_${Date.now()}_xxxxxxx`;
  },
};
