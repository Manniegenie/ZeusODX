// hooks/useBalance.js
import { useMemo } from 'react';
import { useApi } from './useApi';
import { balanceService } from '../services/walletService';

export function useBalance() {
  const {
    data: balanceResponse,
    loading,
    error,
    refetch,
  } = useApi(() => balanceService.getAllBalances());

  const balances = useMemo(() => {
    return balanceResponse?.data || null;
  }, [balanceResponse]);

  // Destructure all balances
  const avaxBalance = balances?.avaxBalance || 0;
  const avaxBalanceUSD = balances?.avaxBalanceUSD || 0;
  const avaxPendingBalance = balances?.avaxPendingBalance || 0;

  const bnbBalance = balances?.bnbBalance || 0;
  const bnbBalanceUSD = balances?.bnbBalanceUSD || 0;
  const bnbPendingBalance = balances?.bnbPendingBalance || 0;

  const btcBalance = balances?.btcBalance || 0;
  const btcBalanceUSD = balances?.btcBalanceUSD || 0;
  const btcPendingBalance = balances?.btcPendingBalance || 0;

  const ethBalance = balances?.ethBalance || 0;
  const ethBalanceUSD = balances?.ethBalanceUSD || 0;
  const ethPendingBalance = balances?.ethPendingBalance || 0;

  const maticBalance = balances?.maticBalance || 0;
  const maticBalanceUSD = balances?.maticBalanceUSD || 0;
  const maticPendingBalance = balances?.maticPendingBalance || 0;

  const ngnbBalance = balances?.ngnbBalance || 0;
  const ngnbBalanceUSD = balances?.ngnbBalanceUSD || 0;
  const ngnbPendingBalance = balances?.ngnbPendingBalance || 0;

  const solBalance = balances?.solBalance || 0;
  const solBalanceUSD = balances?.solBalanceUSD || 0;
  const solPendingBalance = balances?.solPendingBalance || 0;

  const usdcBalance = balances?.usdcBalance || 0;
  const usdcBalanceUSD = balances?.usdcBalanceUSD || 0;
  const usdcPendingBalance = balances?.usdcPendingBalance || 0;

  const usdtBalance = balances?.usdtBalance || 0;
  const usdtBalanceUSD = balances?.usdtBalanceUSD || 0;
  const usdtPendingBalance = balances?.usdtPendingBalance || 0;

  const totalPortfolioBalance = balances?.totalPortfolioBalance || 0;

  // ADD FORMATTED VALUES FOR ALL TOKENS
  const formattedEthBalance = useMemo(() => 
    balanceService.formatTokenBalance(ethBalance, 'ETH'), [ethBalance]
  );
  
  const formattedEthBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(ethBalanceUSD), [ethBalanceUSD]
  );

  const formattedBtcBalance = useMemo(() => 
    balanceService.formatTokenBalance(btcBalance, 'BTC'), [btcBalance]
  );
  
  const formattedBtcBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(btcBalanceUSD), [btcBalanceUSD]
  );

  const formattedSolBalance = useMemo(() => 
    balanceService.formatTokenBalance(solBalance, 'SOL'), [solBalance]
  );
  
  const formattedSolBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(solBalanceUSD), [solBalanceUSD]
  );

  const formattedUsdtBalance = useMemo(() => 
    balanceService.formatTokenBalance(usdtBalance, 'USDT'), [usdtBalance]
  );
  
  const formattedUsdtBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(usdtBalanceUSD), [usdtBalanceUSD]
  );

  const formattedUsdcBalance = useMemo(() => 
    balanceService.formatTokenBalance(usdcBalance, 'USDC'), [usdcBalance]
  );
  
  const formattedUsdcBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(usdcBalanceUSD), [usdcBalanceUSD]
  );

  const formattedAvaxBalance = useMemo(() => 
    balanceService.formatTokenBalance(avaxBalance, 'AVAX'), [avaxBalance]
  );
  
  const formattedAvaxBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(avaxBalanceUSD), [avaxBalanceUSD]
  );

  const formattedBnbBalance = useMemo(() => 
    balanceService.formatTokenBalance(bnbBalance, 'BNB'), [bnbBalance]
  );
  
  const formattedBnbBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(bnbBalanceUSD), [bnbBalanceUSD]
  );

  const formattedMaticBalance = useMemo(() => 
    balanceService.formatTokenBalance(maticBalance, 'MATIC'), [maticBalance]
  );
  
  const formattedMaticBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(maticBalanceUSD), [maticBalanceUSD]
  );

  const formattedNgnbBalance = useMemo(() => 
    balanceService.formatTokenBalance(ngnbBalance, 'NGNB'), [ngnbBalance]
  );
  
  const formattedNgnbBalanceUSD = useMemo(() => 
    balanceService.formatCurrency(ngnbBalanceUSD), [ngnbBalanceUSD]
  );

  const formattedTotalPortfolioBalance = useMemo(() => 
    balanceService.formatCurrency(totalPortfolioBalance), [totalPortfolioBalance]
  );

  const formattedTotalPortfolioNaira = useMemo(() => 
    balanceService.formatNaira(totalPortfolioBalance * 1600), [totalPortfolioBalance]
  );

  const tokenBalanceSummary = useMemo(() => ({
    avax: { balance: avaxBalance, balanceUSD: avaxBalanceUSD, pending: avaxPendingBalance },
    bnb: { balance: bnbBalance, balanceUSD: bnbBalanceUSD, pending: bnbPendingBalance },
    btc: { balance: btcBalance, balanceUSD: btcBalanceUSD, pending: btcPendingBalance },
    eth: { balance: ethBalance, balanceUSD: ethBalanceUSD, pending: ethPendingBalance },
    matic: { balance: maticBalance, balanceUSD: maticBalanceUSD, pending: maticPendingBalance },
    ngnb: { balance: ngnbBalance, balanceUSD: ngnbBalanceUSD, pending: ngnbPendingBalance },
    sol: { balance: solBalance, balanceUSD: solBalanceUSD, pending: solPendingBalance },
    usdc: { balance: usdcBalance, balanceUSD: usdcBalanceUSD, pending: usdcPendingBalance },
    usdt: { balance: usdtBalance, balanceUSD: usdtBalanceUSD, pending: usdtPendingBalance },
  }), [
    avaxBalance, avaxBalanceUSD, avaxPendingBalance,
    bnbBalance, bnbBalanceUSD, bnbPendingBalance,
    btcBalance, btcBalanceUSD, btcPendingBalance,
    ethBalance, ethBalanceUSD, ethPendingBalance,
    maticBalance, maticBalanceUSD, maticPendingBalance,
    ngnbBalance, ngnbBalanceUSD, ngnbPendingBalance,
    solBalance, solBalanceUSD, solPendingBalance,
    usdcBalance, usdcBalanceUSD, usdcPendingBalance,
    usdtBalance, usdtBalanceUSD, usdtPendingBalance
  ]);

  const getTokenBalance = (symbol) => tokenBalanceSummary[symbol.toLowerCase()] || null;
  const hasTokenBalance = (symbol) => getTokenBalance(symbol)?.balance > 0;

  const refreshBalances = async () => await refetch();
  const forceRefreshBalances = async () => {
    await balanceService.refreshBalances();
    await refetch();
  };

  return {
    balances,
    // Raw balances
    avaxBalance, avaxBalanceUSD, avaxPendingBalance,
    bnbBalance, bnbBalanceUSD, bnbPendingBalance,
    btcBalance, btcBalanceUSD, btcPendingBalance,
    ethBalance, ethBalanceUSD, ethPendingBalance,
    maticBalance, maticBalanceUSD, maticPendingBalance,
    ngnbBalance, ngnbBalanceUSD, ngnbPendingBalance,
    solBalance, solBalanceUSD, solPendingBalance,
    usdcBalance, usdcBalanceUSD, usdcPendingBalance,
    usdtBalance, usdtBalanceUSD, usdtPendingBalance,
    totalPortfolioBalance,
    
    // Formatted balances - ADD THESE TO THE RETURN
    formattedEthBalance,
    formattedEthBalanceUSD,
    formattedBtcBalance,
    formattedBtcBalanceUSD,
    formattedSolBalance,
    formattedSolBalanceUSD,
    formattedUsdtBalance,
    formattedUsdtBalanceUSD,
    formattedUsdcBalance,
    formattedUsdcBalanceUSD,
    formattedAvaxBalance,
    formattedAvaxBalanceUSD,
    formattedBnbBalance,
    formattedBnbBalanceUSD,
    formattedMaticBalance,
    formattedMaticBalanceUSD,
    formattedNgnbBalance,
    formattedNgnbBalanceUSD,
    formattedTotalPortfolioBalance,
    formattedTotalPortfolioNaira,
    
    tokenBalanceSummary,
    getTokenBalance,
    hasTokenBalance,
    loading,
    error,
    refreshBalances,
    forceRefreshBalances,
    refetch
  };
}