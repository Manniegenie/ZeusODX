/**
 * Network Normalization Utility
 * Maps frontend network names to backend-expected network identifiers
 * 
 * Backend expects:
 * - BSC (not BEP20)
 * - TRX (not TRON, not TRC20)
 * - ETH (not ERC20, not ETHEREUM)
 * - POLYGON (for USDC_POLYGON)
 * - SOL (not SOLANA)
 * - ARBITRUM
 * - BASE
 */

export function normalizeNetworkForBackend(network) {
  if (!network) return network;

  const normalized = network.toUpperCase().trim();

  // Network name mappings (frontend → backend)
  const networkMap = {
    // Tron variations
    'TRON': 'TRX',
    'TRC20': 'TRX',
    'TRC-20': 'TRX',
    
    // BSC variations
    'BEP20': 'BSC',
    'BEP-20': 'BSC',
    'BINANCE': 'BSC',
    'BINANCE SMART CHAIN': 'BSC',
    
    // Ethereum variations
    'ERC20': 'ETH',
    'ERC-20': 'ETH',
    'ETHEREUM': 'ETH',
    
    // Solana variations
    'SOLANA': 'SOL',
    
    // Polygon - keep as POLYGON for USDC, but note MATIC token uses POL
    // This normalization handles network names, not token names
    'MATIC': 'POLYGON', // For network references (e.g., USDC on Polygon network)
    
    // These should already be correct
    'BSC': 'BSC',
    'TRX': 'TRX',
    'ETH': 'ETH',
    'POLYGON': 'POLYGON',
    'ARBITRUM': 'ARBITRUM',
    'BASE': 'BASE',
    'SOL': 'SOL',
    'BTC': 'BTC',
  };

  return networkMap[normalized] || normalized;
}

/**
 * Normalize token symbol for backend
 * Some tokens have different names (e.g., MATIC → POL)
 */
export function normalizeTokenForBackend(token) {
  if (!token) return token;

  const normalized = token.toUpperCase().trim();

  const tokenMap = {
    'MATIC': 'POL', // MATIC token is stored as POL in backend
  };

  return tokenMap[normalized] || normalized;
}

/**
 * Normalize both token and network for backend API calls
 */
export function normalizeForBackend(token, network) {
  return {
    token: normalizeTokenForBackend(token),
    network: normalizeNetworkForBackend(network),
  };
}




