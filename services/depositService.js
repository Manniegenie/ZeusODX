import { apiClient } from './apiClient';

export const depositService = {
  async getDepositAddress(tokenSymbol, network) {
    console.log(`💳 Fetching deposit address for ${tokenSymbol} on ${network} network`);
    return apiClient.post('/deposit/address', {
      tokenSymbol: tokenSymbol.toUpperCase(),
      network: network.toUpperCase()
    });
  },

  async getSupportedTokens() {
    console.log('📋 Fetching supported tokens and networks');
    try {
      return apiClient.get('/deposit/supported-tokens');
    } catch (error) {
      console.log('⚠️ Supported tokens endpoint may not be available, using static data');
      
      // Return data based on the actual backend WALLET_KEY_MAPPING
      return {
        success: true,
        data: {
          supportedTokens: {
            'BTC': ['BTC', 'BITCOIN'],
            'ETH': ['ETH', 'ETHEREUM'],
            'SOL': ['SOL', 'SOLANA'],
            'USDT': ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
            'USDC': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
            'BNB': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
            'DOGE': ['DOGE', 'DOGECOIN'],
            'MATIC': ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
            'AVAX': ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
            'NGNB': ['NGNB', '']
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
            { token: 'NGNB', network: 'NGNB', walletKey: 'NGNB' }
          ],
          walletKeyMapping: {
            'BTC_BTC': 'BTC_BTC',
            'BTC_BITCOIN': 'BTC_BTC',
            'ETH_ETH': 'ETH_ETH',
            'ETH_ETHEREUM': 'ETH_ETH',
            'SOL_SOL': 'SOL_SOL',
            'SOL_SOLANA': 'SOL_SOL',
            'USDT_ETH': 'USDT_ETH',
            'USDT_ETHEREUM': 'USDT_ETH',
            'USDT_ERC20': 'USDT_ETH',
            'USDT_TRX': 'USDT_TRX',
            'USDT_TRON': 'USDT_TRX',
            'USDT_TRC20': 'USDT_TRX',
            'USDT_BSC': 'USDT_BSC',
            'USDT_BEP20': 'USDT_BSC',
            'USDT_BINANCE': 'USDT_BSC',
            'USDC_ETH': 'USDC_ETH',
            'USDC_ETHEREUM': 'USDC_ETH',
            'USDC_ERC20': 'USDC_ETH',
            'USDC_BSC': 'USDC_BSC',
            'USDC_BEP20': 'USDC_BSC',
            'USDC_BINANCE': 'USDC_BSC',
            'BNB_ETH': 'BNB_ETH',
            'BNB_ETHEREUM': 'BNB_ETH',
            'BNB_ERC20': 'BNB_ETH',
            'BNB_BSC': 'BNB_BSC',
            'BNB_BEP20': 'BNB_BSC',
            'BNB_BINANCE': 'BNB_BSC',
            'DOGE_DOGE': 'DOGE_DOGE',
            'DOGE_DOGECOIN': 'DOGE_DOGE',
            'MATIC_ETH': 'MATIC_ETH',
            'MATIC_ETHEREUM': 'MATIC_ETH',
            'MATIC_ERC20': 'MATIC_ETH',
            'MATIC_POLYGON': 'MATIC_ETH',
            'AVAX_BSC': 'AVAX_BSC',
            'AVAX_BEP20': 'AVAX_BSC',
            'AVAX_BINANCE': 'AVAX_BSC',
            'AVAX_AVALANCHE': 'AVAX_BSC',
            'NGNB_NGNB': 'NGNB',
            'NGNB': 'NGNB'
          }
        }
      };
    }
  },

  async generateQRCode(address, size = 256) {
    console.log(`🔗 Generating QR code for address: ${address.slice(0, 8)}...${address.slice(-6)}`);
    return apiClient.post('/deposit/generate-qr', {
      address,
      size
    });
  },

  // Convenience method to get deposit info for Bitcoin
  async getBitcoinDepositAddress() {
    console.log('₿ Fetching Bitcoin deposit address');
    return this.getDepositAddress('BTC', 'BTC');
  },

  // Convenience method to get deposit info for Ethereum
  async getEthereumDepositAddress() {
    console.log('⟠ Fetching Ethereum deposit address');
    return this.getDepositAddress('ETH', 'ETH');
  },

  // Convenience method to get deposit info for Solana
  async getSolanaDepositAddress() {
    console.log('◎ Fetching Solana deposit address');
    return this.getDepositAddress('SOL', 'SOL');
  },

  // Get USDT deposit address for specific network
  async getUSDTDepositAddress(network = 'ETH') {
    const networkDisplay = network === 'ETH' ? 'Ethereum (ERC20)' : 
                          network === 'TRX' ? 'Tron (TRC20)' : 
                          network === 'BSC' ? 'BSC (BEP20)' : network;
    console.log(`💵 Fetching USDT deposit address on ${networkDisplay}`);
    return this.getDepositAddress('USDT', network);
  },

  // Get USDC deposit address for specific network
  async getUSDCDepositAddress(network = 'ETH') {
    const networkDisplay = network === 'ETH' ? 'Ethereum (ERC20)' : 
                          network === 'BSC' ? 'BSC (BEP20)' : network;
    console.log(`💵 Fetching USDC deposit address on ${networkDisplay}`);
    return this.getDepositAddress('USDC', network);
  },

  // Get BNB deposit address for specific network
  async getBNBDepositAddress(network = 'BSC') {
    const networkDisplay = network === 'BSC' ? 'BSC (BEP20)' : 
                          network === 'ETH' ? 'Ethereum (ERC20)' : network;
    console.log(`🟡 Fetching BNB deposit address on ${networkDisplay}`);
    return this.getDepositAddress('BNB', network);
  },

  // Convenience method for NGNB
  async getNGNBDepositAddress() {
    console.log('🇳🇬 Fetching NGNB deposit address');
    return this.getDepositAddress('NGNB', 'NGNB');
  },

  // Validate if token/network combination is supported (based on backend SUPPORTED_TOKENS)
  isTokenNetworkSupported(tokenSymbol, network) {
    const supportedTokens = {
      'BTC': ['BTC', 'BITCOIN'],
      'ETH': ['ETH', 'ETHEREUM'],
      'SOL': ['SOL', 'SOLANA'],
      'USDT': ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
      'USDC': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      'BNB': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      'DOGE': ['DOGE', 'DOGECOIN'],
      'MATIC': ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
      'AVAX': ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
      'NGNB': ['NGNB', '']
    };
    
    const supportedNetworks = supportedTokens[tokenSymbol.toUpperCase()];
    if (!supportedNetworks) return false;
    
    // Special case for NGNB
    if (tokenSymbol.toUpperCase() === 'NGNB') {
      return network.toUpperCase() === 'NGNB' || network === '';
    }
    
    return supportedNetworks.includes(network.toUpperCase());
  },

  // Get all supported networks for a specific token
  getSupportedNetworksForToken(tokenSymbol) {
    const supportedTokens = {
      'BTC': ['BTC', 'BITCOIN'],
      'ETH': ['ETH', 'ETHEREUM'],
      'SOL': ['SOL', 'SOLANA'],
      'USDT': ['ETH', 'ETHEREUM', 'ERC20', 'TRX', 'TRON', 'TRC20', 'BSC', 'BEP20', 'BINANCE'],
      'USDC': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      'BNB': ['ETH', 'ETHEREUM', 'ERC20', 'BSC', 'BEP20', 'BINANCE'],
      'DOGE': ['DOGE', 'DOGECOIN'],
      'MATIC': ['ETH', 'ETHEREUM', 'ERC20', 'POLYGON'],
      'AVAX': ['BSC', 'BEP20', 'BINANCE', 'AVALANCHE'],
      'NGNB': ['NGNB', '']
    };
    
    return supportedTokens[tokenSymbol.toUpperCase()] || [];
  }
};