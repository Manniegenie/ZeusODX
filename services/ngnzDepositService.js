import { apiClient } from './apiClient';

// Helper function to fetch bank details from Glyde URL
async function fetchBankDetailsFromUrl(paymentUrl) {
  try {
    // Make a GET request to the payment URL
    const response = await fetch(paymentUrl);
    const html = await response.text();

    // Extract bank details using regex patterns
    const bankNameMatch = html.match(/Bank Name:\s*([^<\n]+)/i);
    const accountNumberMatch = html.match(/Account Number:\s*([^<\n]+)/i);
    const accountNameMatch = html.match(/Account Name:\s*([^<\n]+)/i);

    return {
      bankName: bankNameMatch?.[1]?.trim(),
      accountNumber: accountNumberMatch?.[1]?.trim(),
      accountName: accountNameMatch?.[1]?.trim()
    };
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return null;
  }
}

export const ngnzDepositService = {
  /**
   * Initialize NGNZ deposit collection
   */
  async initializeDeposit(amount) {
    try {
      console.log('🔄 Initializing NGNZ deposit:', { amount });

      // Client-side validation
      if (!amount || amount < 1000) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Minimum deposit amount is 1,000 NGNZ'
        };
      }

      // Prepare request payload
      const payload = {
        currency: 'NGN',
        amount: Number(amount),
        customer_name: 'NGNZ Deposit', // Generic name since we don't need user details
        customer_email: 'deposit@zeusodx.com', // Generic email
        channels: ['bank_transfer'], // Only bank transfer for NGNZ deposits
        default_channel: 'bank_transfer'
      };

      // Make API request
      const response = await apiClient.post('/collection/initialize', payload);

      if (response.success) {
        console.log('✅ NGNZ deposit initialized:', {
          reference: response.data.reference,
          transactionId: response.data.transactionId,
          paymentUrl: response.data.paymentUrl,
          timestamp: response.data.timestamp
        });

        // Fetch bank details from the payment URL
        let bankDetails = null;
        if (response.data.paymentUrl) {
          console.log('🔄 Fetching bank details from URL...');
          bankDetails = await fetchBankDetailsFromUrl(response.data.paymentUrl);
          if (bankDetails) {
            console.log('✅ Bank details extracted:', bankDetails);
          } else {
            console.log('⚠️ Could not extract bank details from URL');
          }
        }

        return {
          success: true,
          message: response.message || 'Deposit initialized successfully',
          data: {
            reference: response.data.reference,
            amount: response.data.amount,
            transactionId: response.data.transactionId,
            timestamp: response.data.timestamp,
            paymentUrl: response.data.paymentUrl,
            bankDetails: bankDetails
          }
        };
      } else {
        console.log('❌ NGNZ deposit initialization failed:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to initialize deposit',
          message: response.message || 'Failed to initialize deposit'
        };
      }
    } catch (error) {
      console.error('❌ NGNZ deposit service error:', error);
      return {
        success: false,
        error: 'SERVICE_ERROR',
        message: error.message || 'An error occurred while initializing deposit'
      };
    }
  },

  /**
   * Get deposit status
   */
  async getDepositStatus(reference) {
    try {
      if (!reference) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Reference is required'
        };
      }

      const response = await apiClient.get(`/collection/status/${reference}`);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Status retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch status',
          message: response.message || 'Failed to fetch status'
        };
      }
    } catch (error) {
      console.error('❌ NGNZ deposit status error:', error);
      return {
        success: false,
        error: 'SERVICE_ERROR',
        message: error.message || 'An error occurred while fetching status'
      };
    }
  }
};
