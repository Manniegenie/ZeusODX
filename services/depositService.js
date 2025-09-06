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
      // Fallback static (unchanged)
      return {
        success: true,
        data: {
          supportedTokens: {
            BTC: ['BTC', 'BITCOIN'],
            ETH: ['ETH', 'ETHEREUM'],
            SOL: ['SOL', 'SOLANA'],
            USDT: ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
            USDC: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
            BNB: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
            DOGE: ['DOGE', 'DOGECOIN'],
            MATIC: ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
            AVAX: ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
            NGNB: ['NGNB', ''],
          },
          supportedCombinations: [
            { token: 'BTC', network: 'BTC', walletKey: 'BTC_BTC' },
            { token: 'BTC', network: 'BITCOIN', walletKey: 'BTC_BTC' },
            { token: 'ETH', network: 'ETH', walletKey: 'ETH_ETH' },
            { token: 'ETH', network: 'ETHEREUM', walletKey: 'ETH_ETH' },
            { token: 'SOL', network: 'SOL', walletKey: 'SOL_SOL' },
            { token: 'SOL', network: 'SOLANA', walletKey: 'SOL_SOL' },
            { token: 'USDT', network: 'ETH', walletKey: 'USDT_ETH' },
            { token: 'USDT', network: 'TRX', walletKey: 'USDT_TRX' },
            { token: 'USDT', network: 'BSC', walletKey: 'USDT_BSC' },
            { token: 'USDC', network: 'ETH', walletKey: 'USDC_ETH' },
            { token: 'USDC', network: 'BSC', walletKey: 'USDC_BSC' },
            { token: 'BNB', network: 'ETH', walletKey: 'BNB_ETH' },
            { token: 'BNB', network: 'BSC', walletKey: 'BNB_BSC' },
            { token: 'MATIC', network: 'ETH', walletKey: 'MATIC_ETH' },
            { token: 'AVAX', network: 'BSC', walletKey: 'AVAX_BSC' },
            { token: 'NGNB', network: 'NGNB', walletKey: 'NGNB' },
          ],
          walletKeyMapping: {
            BTC_BTC: 'BTC_BTC',
            BTC_BITCOIN: 'BTC_BTC',
            ETH_ETH: 'ETH_ETH',
            ETH_ETHEREUM: 'ETH_ETH',
            SOL_SOL: 'SOL_SOL',
            SOL_SOLANA: 'SOL_SOL',
            USDT_ETH: 'USDT_ETH',
            USDT_ETHEREUM: 'USDT_ETH',
            USDT_ERC20: 'USDT_ETH',
            USDT_TRX: 'USDT_TRX',
            USDT_TRON: 'USDT_TRX',
            USDT_TRC20: 'USDT_TRX',
            USDT_BSC: 'USDT_BSC',
            USDT_BEP20: 'USDT_BSC',
            USDT_BINANCE: 'USDT_BSC',
            USDC_ETH: 'USDC_ETH',
            USDC_ETHEREUM: 'USDC_ETH',
            USDC_ERC20: 'USDC_ETH',
            USDC_BSC: 'USDC_BSC',
            USDC_BEP20: 'USDC_BSC',
            USDC_BINANCE: 'USDC_BSC',
            BNB_ETH: 'BNB_ETH',
            BNB_ETHEREUM: 'BNB_ETH',
            BNB_ERC20: 'BNB_ETH',
            BNB_BSC: 'BNB_BSC',
            BNB_BEP20: 'BNB_BSC',
            BNB_BINANCE: 'BNB_BSC',
            DOGE_DOGE: 'DOGE_DOGE',
            DOGE_DOGECOIN: 'DOGE_DOGE',
            MATIC_ETH: 'MATIC_ETH',
            MATIC_ETHEREUM: 'MATIC_ETH',
            MATIC_ERC20: 'MATIC_ETH',
            MATIC_POLYGON: 'MATIC_ETH',
            AVAX_BSC: 'AVAX_BSC',
            AVAX_BEP20: 'AVAX_BSC',
            AVAX_BINANCE: 'AVAX_BSC',
            AVAX_AVALANCHE: 'AVAX_BSC',
            NGNB_NGNB: 'NGNB',
            NGNB: 'NGNB',
          },
        },
      };
    }
  },

  async generateQRCode(address: string, size = 256) {
    const res = await apiClient.post('/deposit/generate-qr', { address, size });
    return unwrap(res);
  },

  // Convenience methods (unchanged)
  async getBitcoinDepositAddress() { return this.getDepositAddress('BTC', 'BTC'); },
  async getEthereumDepositAddress() { return this.getDepositAddress('ETH', 'ETH'); },
  async getSolanaDepositAddress() { return this.getDepositAddress('SOL', 'SOL'); },
  async getUSDTDepositAddress(network = 'ETH') { return this.getDepositAddress('USDT', network); },
  async getUSDCDepositAddress(network = 'ETH') { return this.getDepositAddress('USDC', network); },
  async getBNBDepositAddress(network = 'BSC') { return this.getDepositAddress('BNB', network); },
  async getNGNBDepositAddress() { return this.getDepositAddress('NGNB', 'NGNB'); },

  isTokenNetworkSupported(tokenSymbol: string, network: string) {
    // … (unchanged)
    const supportedTokens = {
      BTC: ['BTC', 'BITCOIN'],
      ETH: ['ETH', 'ETHEREUM'],
      SOL: ['SOL', 'SOLANA'],
      USDT: ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
      USDC: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      BNB: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      DOGE: ['DOGE', 'DOGECOIN'],
      MATIC: ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
      AVAX: ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
      NGNB: ['NGNB', ''],
    };
    const nets = supportedTokens[tokenSymbol.toUpperCase()];
    if (!nets) return false;
    if (tokenSymbol.toUpperCase() === 'NGNB') {
      return network.toUpperCase() === 'NGNB' || network === '';
    }
    return nets.includes(network.toUpperCase());
  },

  getSupportedNetworksForToken(tokenSymbol: string) {
    // … (unchanged)
    const supportedTokens = {
      BTC: ['BTC', 'BITCOIN'],
      ETH: ['ETH', 'ETHEREUM'],
      SOL: ['SOL', 'SOLANA'],
      USDT: ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
      USDC: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      BNB: ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      DOGE: ['DOGE', 'DOGECOIN'],
      MATIC: ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
      AVAX: ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
      NGNB: ['NGNB', ''],
    };
    return supportedTokens[tokenSymbol.toUpperCase()] || [];
  },
};
