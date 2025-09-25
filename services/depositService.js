// services/depositService.ts
import { apiClient } from './apiClient';

function unwrap<T = any>(res: any) {
  // apiClient returns { success: true, data: <server json> }
  // server json is typically { success, message, data, user }
  if (!res?.success) return res;
  const server = res.data ?? {};
  const payload = server.data ?? server; // prefer server.data, else server itself
  return { success: true, data: payload, message: server.message, user: server.user };
}

export const depositService = {
  async getDepositAddress(tokenSymbol: string, network: string) {
    const res = await apiClient.post('/deposit/address', {
      tokenSymbol: tokenSymbol.toUpperCase(),
      network: network.toUpperCase(),
    });
    return unwrap(res);
  },

  async getSupportedTokens() {
    try {
      const res = await apiClient.get('/deposit/supported-tokens');
      // Expecting shape: { data: { supportedTokens, supportedCombinations, walletKeyMapping, ... } }
      return unwrap(res);
    } catch (error) {
      console.error('Failed to fetch supported tokens from API:', error);
      // Return error instead of fallback - this ensures we don't use outdated hardcoded data
      return {
        success: false,
        error: 'Failed to fetch supported tokens',
        message: 'Unable to load current supported tokens and networks. Please check your connection and try again.',
      };
    }
  },

  async generateQRCode(address: string, size = 256) {
    const res = await apiClient.post('/deposit/generate-qr', { address, size });
    return unwrap(res);
  },

  // Dynamic validation methods that work with any network combination
  async isTokenNetworkSupported(tokenSymbol: string, network: string): Promise<boolean> {
    try {
      const supportedData = await this.getSupportedTokens();
      if (!supportedData.success || !supportedData.data) {
        console.warn('Unable to validate token/network support - API unavailable');
        return false;
      }

      const { supportedTokens } = supportedData.data;
      const token = tokenSymbol.toUpperCase();
      const net = network.toUpperCase();
      
      const supportedNetworks = supportedTokens[token];
      return supportedNetworks ? supportedNetworks.includes(net) : false;
    } catch (error) {
      console.error('Error validating token/network support:', error);
      return false;
    }
  },

  async getSupportedNetworksForToken(tokenSymbol: string): Promise<string[]> {
    try {
      const supportedData = await this.getSupportedTokens();
      if (!supportedData.success || !supportedData.data) {
        console.warn('Unable to get supported networks - API unavailable');
        return [];
      }

      const { supportedTokens } = supportedData.data;
      const token = tokenSymbol.toUpperCase();
      return supportedTokens[token] || [];
    } catch (error) {
      console.error('Error getting supported networks:', error);
      return [];
    }
  },

  // Convenience methods - these will work with any networks supported by your backend
  async getBitcoinDepositAddress() { return this.getDepositAddress('BTC', 'BTC'); },
  async getEthereumDepositAddress() { return this.getDepositAddress('ETH', 'ETH'); },
  async getSolanaDepositAddress() { return this.getDepositAddress('SOL', 'SOL'); },
  async getUSDTDepositAddress(network = 'ETH') { return this.getDepositAddress('USDT', network); },
  async getUSDCDepositAddress(network = 'ETH') { return this.getDepositAddress('USDC', network); },
  async getBNBDepositAddress(network = 'BSC') { return this.getDepositAddress('BNB', network); },
  async getNGNBDepositAddress() { return this.getDepositAddress('NGNB', 'NGNB'); },

  // Keep original method names and behavior for compatibility
  isTokenNetworkSupported(tokenSymbol: string, network: string): boolean {
    console.warn('Using sync validation - consider implementing async validation for better accuracy');
    return true; // Let the backend validate during actual requests
  },

  getSupportedNetworksForToken(tokenSymbol: string): string[] {
    console.warn('Using sync method - consider implementing async version for live data');
    return []; // Return empty array, let backend handle validation
  },
};