// hooks/useDashboard.js
import { useMemo } from 'react';
import { useApi } from './useApi';
import { dashboardService } from '../services/dashboardService';

export function useDashboard() {
  const {
    data: dashboard,
    loading,
    error,
    refetch,
  } = useApi(() => dashboardService.getDashboardData());

  // Raw profile data
  const profile = useMemo(() => {
    return dashboard?.data?.profile || null;
  }, [dashboard]);

  // Individual profile fields
  const avatarLastUpdated = profile?.avatarLastUpdated || null;
  const avatarUrl = profile?.avatarUrl || null;
  const email = profile?.email || '';
  const firstname = profile?.firstname || '';
  const id = profile?.id || '';
  const is2FAEnabled = profile?.is2FAEnabled || false;
  const lastname = profile?.lastname || '';
  const phonenumber = profile?.phonenumber || '';
  const username = profile?.username || '';

  // Raw KYC data
  const kyc = useMemo(() => {
    return dashboard?.data?.kyc || null;
  }, [dashboard]);

  // Individual KYC fields
  const completionPercentage = kyc?.completionPercentage || 0;
  const kycLevel = kyc?.level || 0;
  const kycLimits = kyc?.limits || {};
  const kycStatus = kyc?.status || '';
  const dailyLimit = kycLimits?.daily || 0;
  const monthlyLimit = kycLimits?.monthly || 0;
  const limitsDescription = kycLimits?.description || '';

  // Raw security data
  const security = useMemo(() => {
    return dashboard?.data?.security || null;
  }, [dashboard]);

  // Individual security fields
  const failedLoginAttempts = security?.failedLoginAttempts || 0;
  const securityIs2FAEnabled = security?.is2FAEnabled || false;
  const lastFailedLogin = security?.lastFailedLogin || null;

  // Raw market data
  const market = useMemo(() => {
    return dashboard?.data?.market || null;
  }, [dashboard]);

  // Individual market fields - FIXED: Access the rate property correctly
  const ngnzExchangeRate = market?.ngnzExchangeRate?.rate || null;
  const ngnzExchangeRateData = market?.ngnzExchangeRate || null; // Full object if needed
  const pricesLastUpdated = market?.pricesLastUpdated || null;
  const prices = market?.prices || {};
  const priceChanges12h = market?.priceChanges12h || {};

  // Individual price fields
  const btcPrice = prices?.BTC || 0;
  const ethPrice = prices?.ETH || 0;
  const solPrice = prices?.SOL || 0;
  const usdcPrice = prices?.USDC || 0;
  const usdtPrice = prices?.USDT || 0;
  const trxPrice = prices?.TRX || 0;
  const bnbPrice = prices?.BNB || 0;
  const maticPrice = prices?.MATIC || 0;
  const dogePrice = prices?.DOGE || 0;

  // Individual price change fields
  const btcPriceChange = priceChanges12h?.BTC || {};
  const ethPriceChange = priceChanges12h?.ETH || {};
  const solPriceChange = priceChanges12h?.SOL || {};
  const trxPriceChange = priceChanges12h?.TRX || {};
  const bnbPriceChange = priceChanges12h?.BNB || {};
  const maticPriceChange = priceChanges12h?.MATIC || {};

  // BTC price change details
  const btcDataAvailable = btcPriceChange?.dataAvailable || false;
  const btcNewPrice = btcPriceChange?.newPrice || 0;
  const btcOldPrice = btcPriceChange?.oldPrice || 0;
  const btcPercentageChange = btcPriceChange?.percentageChange || 0;
  const btcPriceChangeAmount = btcPriceChange?.priceChange || 0;
  const btcTimeframe = btcPriceChange?.timeframe || '';

  // ETH price change details
  const ethDataAvailable = ethPriceChange?.dataAvailable || false;
  const ethNewPrice = ethPriceChange?.newPrice || 0;
  const ethOldPrice = ethPriceChange?.oldPrice || 0;
  const ethPercentageChange = ethPriceChange?.percentageChange || 0;
  const ethPriceChangeAmount = ethPriceChange?.priceChange || 0;
  const ethTimeframe = ethPriceChange?.timeframe || '';

  // SOL price change details
  const solDataAvailable = solPriceChange?.dataAvailable || false;
  const solNewPrice = solPriceChange?.newPrice || 0;
  const solOldPrice = solPriceChange?.oldPrice || 0;
  const solPercentageChange = solPriceChange?.percentageChange || 0;
  const solPriceChangeAmount = solPriceChange?.priceChange || 0;
  const solTimeframe = solPriceChange?.timeframe || '';

  // TRX price change details
  const trxDataAvailable = trxPriceChange?.dataAvailable || false;
  const trxNewPrice = trxPriceChange?.newPrice || 0;
  const trxOldPrice = trxPriceChange?.oldPrice || 0;
  const trxPercentageChange = trxPriceChange?.percentageChange || 0;
  const trxPriceChangeAmount = trxPriceChange?.priceChange || 0;
  const trxTimeframe = trxPriceChange?.timeframe || '';

  // BNB price change details
  const bnbDataAvailable = bnbPriceChange?.dataAvailable || false;
  const bnbNewPrice = bnbPriceChange?.newPrice || 0;
  const bnbOldPrice = bnbPriceChange?.oldPrice || 0;
  const bnbPercentageChange = bnbPriceChange?.percentageChange || 0;
  const bnbPriceChangeAmount = bnbPriceChange?.priceChange || 0;
  const bnbTimeframe = bnbPriceChange?.timeframe || '';

  // MATIC price change details
  const maticDataAvailable = maticPriceChange?.dataAvailable || false;
  const maticNewPrice = maticPriceChange?.newPrice || 0;
  const maticOldPrice = maticPriceChange?.oldPrice || 0;
  const maticPercentageChange = maticPriceChange?.percentageChange || 0;
  const maticPriceChangeAmount = maticPriceChange?.priceChange || 0;
  const maticTimeframe = maticPriceChange?.timeframe || '';

  // Raw portfolio data
  const portfolio = useMemo(() => {
    return dashboard?.data?.portfolio || null;
  }, [dashboard]);

  const totalPortfolioBalance = portfolio?.totalPortfolioBalance || 0;
  const balances = portfolio?.balances || {};

  // Individual portfolio balances
  const btcBalance = balances?.BTC || {};
  const ethBalance = balances?.ETH || {};
  const solBalance = balances?.SOL || {};
  const usdcBalance = balances?.USDC || {};
  const usdtBalance = balances?.USDT || {};
  const trxBalance = balances?.TRX || {};
  const bnbBalance = balances?.BNB || {};
  const maticBalance = balances?.MATIC || {};
  const ngnzBalance = balances?.NGNZ || {};

  // Raw wallets data
  const wallets = useMemo(() => {
    return dashboard?.data?.wallets || null;
  }, [dashboard]);

  // Individual wallet data
  const btcWallet = wallets?.BTC_BTC || {};
  const ethWallet = wallets?.ETH_ETH || {};
  const solWallet = wallets?.SOL_SOL || {};
  const usdcBscWallet = wallets?.USDC_BSC || {};
  const usdcEthWallet = wallets?.USDC_ETH || {};
  const usdtBscWallet = wallets?.USDT_BSC || {};
  const usdtEthWallet = wallets?.USDT_ETH || {};
  const usdtTrxWallet = wallets?.USDT_TRX || {};
  const ngnzWallet = wallets?.NGNZ || {};
  const trxWallet = wallets?.TRX_TRX || {};
  const bnbBscWallet = wallets?.BNB_BSC || {};
  const bnbEthWallet = wallets?.BNB_ETH || {};
  const dogeWallet = wallets?.DOGE_DOGE || {};
  const maticEthWallet = wallets?.MATIC_ETH || {};

  // Individual wallet addresses
  const btcWalletAddress = btcWallet?.address || '';
  const ethWalletAddress = ethWallet?.address || '';
  const solWalletAddress = solWallet?.address || '';
  const usdcBscWalletAddress = usdcBscWallet?.address || '';
  const usdcEthWalletAddress = usdcEthWallet?.address || '';
  const usdtBscWalletAddress = usdtBscWallet?.address || '';
  const usdtEthWalletAddress = usdtEthWallet?.address || '';
  const usdtTrxWalletAddress = usdtTrxWallet?.address || '';
  const ngnzWalletAddress = ngnzWallet?.address || '';
  const trxWalletAddress = trxWallet?.address || '';

  // Individual wallet reference IDs
  const btcWalletReferenceId = btcWallet?.walletReferenceId || '';
  const ethWalletReferenceId = ethWallet?.walletReferenceId || '';
  const solWalletReferenceId = solWallet?.walletReferenceId || '';
  const usdcBscWalletReferenceId = usdcBscWallet?.walletReferenceId || '';
  const usdcEthWalletReferenceId = usdcEthWallet?.walletReferenceId || '';
  const usdtBscWalletReferenceId = usdtBscWallet?.walletReferenceId || '';
  const usdtEthWalletReferenceId = usdtEthWallet?.walletReferenceId || '';
  const usdtTrxWalletReferenceId = usdtTrxWallet?.walletReferenceId || '';
  const ngnzWalletReferenceId = ngnzWallet?.walletReferenceId || '';
  const trxWalletReferenceId = trxWallet?.walletReferenceId || '';

  // Individual wallet networks
  const btcWalletNetwork = btcWallet?.network || '';
  const ethWalletNetwork = ethWallet?.network || '';
  const solWalletNetwork = solWallet?.network || '';
  const usdcBscWalletNetwork = usdcBscWallet?.network || '';
  const usdcEthWalletNetwork = usdcEthWallet?.network || '';
  const usdtBscWalletNetwork = usdtBscWallet?.network || '';
  const usdtEthWalletNetwork = usdtEthWallet?.network || '';
  const usdtTrxWalletNetwork = usdtTrxWallet?.network || '';
  const ngnzWalletNetwork = ngnzWallet?.network || '';
  const trxWalletNetwork = trxWallet?.network || '';

  // FIXED: Refresh dashboard data - Clear cache before refetching
  const refreshDashboard = async () => {
    console.log('🔄 useDashboard: Refreshing dashboard data');
    
    // First clear the dashboard service cache
    await dashboardService.refreshDashboard();
    
    // Then call refetch to get fresh data
    await refetch();
  };

  return {
    // Raw objects
    dashboard: dashboard?.data,
    profile,
    kyc,
    security,
    market,
    portfolio,
    wallets,
    
    // Profile fields
    avatarLastUpdated,
    avatarUrl,
    email,
    firstname,
    id,
    is2FAEnabled,
    lastname,
    phonenumber,
    username,
    
    // KYC fields
    completionPercentage,
    kycLevel,
    kycLimits,
    kycStatus,
    dailyLimit,
    monthlyLimit,
    limitsDescription,
    
    // Security fields
    failedLoginAttempts,
    securityIs2FAEnabled,
    lastFailedLogin,
    
    // Market fields - FIXED: Now correctly exports the rate number
    ngnzExchangeRate, // This is now the rate number, not the object
    ngnzExchangeRateData, // Full object with rate, lastUpdated, source
    pricesLastUpdated,
    prices,
    priceChanges12h,
    
    // Price fields
    btcPrice,
    ethPrice,
    solPrice,
    usdcPrice,
    usdtPrice,
    trxPrice,
    bnbPrice,
    maticPrice,
    dogePrice,
    
    // BTC price change fields
    btcPriceChange,
    btcDataAvailable,
    btcNewPrice,
    btcOldPrice,
    btcPercentageChange,
    btcPriceChangeAmount,
    btcTimeframe,
    
    // ETH price change fields
    ethPriceChange,
    ethDataAvailable,
    ethNewPrice,
    ethOldPrice,
    ethPercentageChange,
    ethPriceChangeAmount,
    ethTimeframe,
    
    // SOL price change fields
    solPriceChange,
    solDataAvailable,
    solNewPrice,
    solOldPrice,
    solPercentageChange,
    solPriceChangeAmount,
    solTimeframe,
    
    // TRX price change fields
    trxPriceChange,
    trxDataAvailable,
    trxNewPrice,
    trxOldPrice,
    trxPercentageChange,
    trxPriceChangeAmount,
    trxTimeframe,
    
    // BNB price change fields
    bnbPriceChange,
    bnbDataAvailable,
    bnbNewPrice,
    bnbOldPrice,
    bnbPercentageChange,
    bnbPriceChangeAmount,
    bnbTimeframe,
    
    // MATIC price change fields
    maticPriceChange,
    maticDataAvailable,
    maticNewPrice,
    maticOldPrice,
    maticPercentageChange,
    maticPriceChangeAmount,
    maticTimeframe,
    
    // Portfolio fields
    totalPortfolioBalance,
    balances,
    
    // Individual portfolio balances
    btcBalance,
    ethBalance,
    solBalance,
    usdcBalance,
    usdtBalance,
    trxBalance,
    bnbBalance,
    maticBalance,
    ngnzBalance,
    
    // Wallet objects
    btcWallet,
    ethWallet,
    solWallet,
    usdcBscWallet,
    usdcEthWallet,
    usdtBscWallet,
    usdtEthWallet,
    usdtTrxWallet,
    ngnzWallet,
    trxWallet,
    bnbBscWallet,
    bnbEthWallet,
    dogeWallet,
    maticEthWallet,
    
    // Wallet addresses
    btcWalletAddress,
    ethWalletAddress,
    solWalletAddress,
    usdcBscWalletAddress,
    usdcEthWalletAddress,
    usdtBscWalletAddress,
    usdtEthWalletAddress,
    usdtTrxWalletAddress,
    ngnzWalletAddress,
    trxWalletAddress,
    
    // Wallet reference IDs
    btcWalletReferenceId,
    ethWalletReferenceId,
    solWalletReferenceId,
    usdcBscWalletReferenceId,
    usdcEthWalletReferenceId,
    usdtBscWalletReferenceId,
    usdtEthWalletReferenceId,
    usdtTrxWalletReferenceId,
    ngnzWalletReferenceId,
    trxWalletReferenceId,
    
    // Wallet networks
    btcWalletNetwork,
    ethWalletNetwork,
    solWalletNetwork,
    usdcBscWalletNetwork,
    usdcEthWalletNetwork,
    usdtBscWalletNetwork,
    usdtEthWalletNetwork,
    usdtTrxWalletNetwork,
    ngnzWalletNetwork,
    trxWalletNetwork,
    
    // API state
    loading,
    error,
    refreshDashboard,
    refetch,
  };
}