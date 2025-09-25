import { useMemo, useState, useCallback } from 'react';
import { useApi } from './useApi';
import { depositService } from '../services/depositService';

export function useDeposit() {
  const [depositAddresses, setDepositAddresses] = useState({});
  const [loadingAddresses, setLoadingAddresses] = useState({});
  const [addressErrors, setAddressErrors] = useState({});

  // Fetch supported tokens and networks - keeping your exact destructuring format
  const {
    data: supportedData,
    loading: supportedLoading,
    error: supportedError,
    refetch: refetchSupported,
  } = useApi(() => depositService.getSupportedTokens());

  // Extract supported tokens and networks from response
  const supportedTokens = useMemo(() => {
    if (!supportedData?.supportedTokens) {
      console.log('💳 useDeposit: No supported tokens data');
      return {};
    }
    
    console.log('💳 useDeposit: Processing supported tokens', Object.keys(supportedData.supportedTokens).length);
    return supportedData.supportedTokens;
  }, [supportedData]);

  // Extract supported combinations
  const supportedCombinations = useMemo(() => {
    if (!supportedData?.supportedCombinations) {
      console.log('🔗 useDeposit: No supported combinations data');
      return [];
    }
    
    console.log('🔗 useDeposit: Processing supported combinations', supportedData.supportedCombinations.length);
    return supportedData.supportedCombinations;
  }, [supportedData]);

  // Extract wallet key mapping
  const walletKeyMapping = useMemo(() => {
    if (!supportedData?.walletKeyMapping) {
      console.log('🗝️ useDeposit: No wallet key mapping data');
      return {};
    }
    
    console.log('🗝️ useDeposit: Processing wallet key mapping', Object.keys(supportedData.walletKeyMapping).length);
    return supportedData.walletKeyMapping;
  }, [supportedData]);

  // Format supported tokens for display
  const formattedSupportedTokens = useMemo(() => {
    if (!supportedTokens || Object.keys(supportedTokens).length === 0) return [];
    
    const formatted = Object.entries(supportedTokens).map(([token, networks]) => ({
      symbol: token,
      networks: networks,
      networkCount: networks.length,
      // Add popular network info
      hasEthereum: networks.includes('ETH') || networks.includes('ETHEREUM'),
      hasBSC: networks.includes('BSC') || networks.includes('BINANCE'),
      hasTron: networks.includes('TRX') || networks.includes('TRON'),
      // Add more network detection for new networks
      hasPolygon: networks.includes('POLYGON') || networks.includes('MATIC'),
      hasArbitrum: networks.includes('ARBITRUM') || networks.includes('ARB'),
      hasOptimism: networks.includes('OPTIMISM') || networks.includes('OP'),
      hasBase: networks.includes('BASE'),
      hasAvalanche: networks.includes('AVALANCHE') || networks.includes('AVAX'),
      // Add icons/display info
      displayName: token === 'BTC' ? 'Bitcoin' :
                  token === 'ETH' ? 'Ethereum' :
                  token === 'SOL' ? 'Solana' :
                  token === 'USDT' ? 'Tether USD' :
                  token === 'USDC' ? 'USD Coin' :
                  token === 'BNB' ? 'BNB' :
                  token === 'DOGE' ? 'Dogecoin' :
                  token === 'MATIC' ? 'Polygon' :
                  token === 'AVAX' ? 'Avalanche' :
                  token === 'NGNB' ? 'Nigerian Naira Blockchain' :
                  token,
    }));
    
    console.log('💎 useDeposit: Formatted supported tokens', formatted.length);
    return formatted;
  }, [supportedTokens]);

  // Get deposit address for token/network combination
  const getDepositAddress = useCallback(async (tokenSymbol, network) => {
    const addressKey = `${tokenSymbol}_${network}`;
    
    // Return cached address if available
    if (depositAddresses[addressKey]) {
      console.log(`💾 useDeposit: Using cached address for ${addressKey}`);
      return { success: true, data: depositAddresses[addressKey] };
    }

    // Check if already loading
    if (loadingAddresses[addressKey]) {
      console.log(`⏳ useDeposit: Already loading address for ${addressKey}`);
      return { success: false, error: 'Already loading' };
    }

    try {
      console.log(`💳 useDeposit: Fetching deposit address for ${tokenSymbol} on ${network}`);
      
      setLoadingAddresses(prev => ({ ...prev, [addressKey]: true }));
      setAddressErrors(prev => ({ ...prev, [addressKey]: null }));

      const response = await depositService.getDepositAddress(tokenSymbol, network);
      
      if (response.success) {
        console.log(`✅ useDeposit: Got deposit address for ${addressKey}`);
        const addressData = {
          ...response.data,
          tokenSymbol,
          network,
        };
        
        setDepositAddresses(prev => ({ ...prev, [addressKey]: addressData }));
        return { success: true, data: addressData };
      } else {
        console.log(`❌ useDeposit: Failed to get address for ${addressKey}`, response);
        
        // Handle specific error cases
        let errorMessage = response.error || response.message || 'Unknown error';
        
        // Check if it's a wallet not found error with available wallets
        if (response.message && response.message.includes('not found')) {
          console.log('📋 Available wallets from API:', response.availableWallets);
          console.log('📋 Requested wallet key:', response.requestedWalletKey);
          
          if (response.availableWallets && Array.isArray(response.availableWallets)) {
            // Handle both formats: array of strings or array of objects
            let walletsList = [];
            if (response.availableWallets.length > 0) {
              if (typeof response.availableWallets[0] === 'string') {
                // Format: ["BTC_BTC", "ETH_ETH", ...]
                walletsList = response.availableWallets;
              } else if (typeof response.availableWallets[0] === 'object' && response.availableWallets[0].key) {
                // Format: [{key: "BTC_BTC", network: "BTC", hasAddress: true}, ...]
                walletsList = response.availableWallets.map(wallet => wallet.key);
              }
            }
            
            const userHasWallets = walletsList.length > 0;
            
            if (userHasWallets) {
              // User has some wallets but not the requested one
              errorMessage = `Your ${tokenSymbol} wallet needs to be set up. You currently have: ${walletsList.join(', ')}. Please contact support to activate your ${tokenSymbol} wallet.`;
            } else {
              // User has no wallets at all
              errorMessage = `No wallets have been set up for your account. Please contact support to activate your crypto wallets.`;
            }
          } else {
            errorMessage = `${tokenSymbol} wallet not set up for ${network} network. Please contact support.`;
          }
        }
        
        setAddressErrors(prev => ({ ...prev, [addressKey]: errorMessage }));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error(`💥 useDeposit: Error getting address for ${addressKey}`, error);
      
      let errorMessage = 'Network error occurred';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAddressErrors(prev => ({ ...prev, [addressKey]: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setLoadingAddresses(prev => ({ ...prev, [addressKey]: false }));
    }
  }, [depositAddresses, loadingAddresses]);

  // Generate QR code for any address
  const generateQRCode = useCallback(async (address, size = 256) => {
    try {
      console.log(`🔗 useDeposit: Generating QR code for address: ${address.slice(0, 8)}...${address.slice(-6)}`);
      const response = await depositService.generateQRCode(address, size);
      
      if (response.success) {
        console.log('✅ useDeposit: QR code generated successfully');
        return { success: true, data: response.data };
      } else {
        console.log('❌ useDeposit: Failed to generate QR code');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('💥 useDeposit: QR code generation error', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Convenience methods for popular tokens
  const getBitcoinAddress = useCallback(() => getDepositAddress('BTC', 'BTC'), [getDepositAddress]);
  const getEthereumAddress = useCallback(() => getDepositAddress('ETH', 'ETH'), [getDepositAddress]);
  const getSolanaAddress = useCallback(() => getDepositAddress('SOL', 'SOL'), [getDepositAddress]);
  const getNGNBAddress = useCallback(() => getDepositAddress('NGNB', 'NGNB'), [getDepositAddress]);
  
  const getUSDTAddress = useCallback((network = 'ETH') => 
    getDepositAddress('USDT', network), [getDepositAddress]);
  const getUSDCAddress = useCallback((network = 'ETH') => 
    getDepositAddress('USDC', network), [getDepositAddress]);
  const getBNBAddress = useCallback((network = 'BSC') => 
    getDepositAddress('BNB', network), [getDepositAddress]);

  // Validate token/network combination using live API data
  const isTokenNetworkSupported = useCallback((tokenSymbol, network) => {
    if (!supportedTokens || Object.keys(supportedTokens).length === 0) {
      console.warn('No supported tokens loaded - validation may be inaccurate');
      return true; // Let backend validate during actual request
    }

    const token = tokenSymbol.toUpperCase();
    const net = network.toUpperCase();
    const supportedNetworks = supportedTokens[token];
    
    return supportedNetworks ? supportedNetworks.includes(net) : false;
  }, [supportedTokens]);

  // Get supported networks for a token using live API data
  const getSupportedNetworksForToken = useCallback((tokenSymbol) => {
    if (!supportedTokens || Object.keys(supportedTokens).length === 0) {
      console.warn('No supported tokens loaded');
      return [];
    }

    const token = tokenSymbol.toUpperCase();
    return supportedTokens[token] || [];
  }, [supportedTokens]);

  // Get cached address for token/network
  const getCachedAddress = useCallback((tokenSymbol, network) => {
    const addressKey = `${tokenSymbol}_${network}`;
    return depositAddresses[addressKey] || null;
  }, [depositAddresses]);

  // Check if address is loading
  const isAddressLoading = useCallback((tokenSymbol, network) => {
    const addressKey = `${tokenSymbol}_${network}`;
    return !!loadingAddresses[addressKey];
  }, [loadingAddresses]);

  // Get address error
  const getAddressError = useCallback((tokenSymbol, network) => {
    const addressKey = `${tokenSymbol}_${network}`;
    return addressErrors[addressKey] || null;
  }, [addressErrors]);

  // Clear cached addresses
  const clearCache = useCallback(() => {
    console.log('🗑️ useDeposit: Clearing address cache');
    setDepositAddresses({});
    setLoadingAddresses({});
    setAddressErrors({});
  }, []);

  // Refresh supported tokens
  const refreshSupportedTokens = useCallback(async () => {
    console.log('🔄 useDeposit: Refreshing supported tokens');
    await refetchSupported();
  }, [refetchSupported]);

  // Get all cached addresses
  const getAllCachedAddresses = useMemo(() => {
    return Object.values(depositAddresses);
  }, [depositAddresses]);

  return {
    // Supported tokens data
    supportedTokens,
    formattedSupportedTokens,
    supportedCombinations,
    walletKeyMapping,
    
    // Loading states
    supportedLoading,
    supportedError,
    
    // Address management
    getDepositAddress,
    getCachedAddress,
    isAddressLoading,
    getAddressError,
    getAllCachedAddresses,
    
    // QR code generation
    generateQRCode,
    
    // Convenience methods
    getBitcoinAddress,
    getEthereumAddress,
    getSolanaAddress,
    getNGNBAddress,
    getUSDTAddress,
    getUSDCAddress,
    getBNBAddress,
    
    // Validation utilities
    isTokenNetworkSupported,
    getSupportedNetworksForToken,
    
    // Cache management
    clearCache,
    refreshSupportedTokens,
    refetchSupported,
  };
}