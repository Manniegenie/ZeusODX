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

  const balances = useMemo(() => balanceResponse?.data || {}, [balanceResponse]);

  // Raw on-chain balances & USD values
  const avaxBalance           = balances.avaxBalance           || 0;
  const avaxBalanceUSD        = balances.avaxBalanceUSD        || 0;
  const avaxPendingBalance    = balances.avaxPendingBalance    || 0;

  const bnbBalance            = balances.bnbBalance            || 0;
  const bnbBalanceUSD         = balances.bnbBalanceUSD         || 0;
  const bnbPendingBalance     = balances.bnbPendingBalance     || 0;

  const btcBalance            = balances.btcBalance            || 0;
  const btcBalanceUSD         = balances.btcBalanceUSD         || 0;
  const btcPendingBalance     = balances.btcPendingBalance     || 0;

  const ethBalance            = balances.ethBalance            || 0;
  const ethBalanceUSD         = balances.ethBalanceUSD         || 0;
  const ethPendingBalance     = balances.ethPendingBalance     || 0;

  const maticBalance          = balances.maticBalance          || 0;
  const maticBalanceUSD       = balances.maticBalanceUSD       || 0;
  const maticPendingBalance   = balances.maticPendingBalance   || 0;

  const ngnzBalance           = balances.ngnzBalance           || 0;
  const ngnzBalanceUSD        = balances.ngnzBalanceUSD        || 0;
  const ngnzPendingBalance    = balances.ngnzPendingBalance    || 0;

  const solBalance            = balances.solBalance            || 0;
  const solBalanceUSD         = balances.solBalanceUSD         || 0;
  const solPendingBalance     = balances.solPendingBalance     || 0;

  const usdcBalance           = balances.usdcBalance           || 0;
  const usdcBalanceUSD        = balances.usdcBalanceUSD        || 0;
  const usdcPendingBalance    = balances.usdcPendingBalance    || 0;

  const usdtBalance           = balances.usdtBalance           || 0;
  const usdtBalanceUSD        = balances.usdtBalanceUSD        || 0;
  const usdtPendingBalance    = balances.usdtPendingBalance    || 0;

  const totalPortfolioBalance = balances.totalPortfolioBalance   || 0;

  // Formatted token balances
  const formattedAvaxBalance  = useMemo(() => balanceService.formatTokenBalance(avaxBalance, 'AVAX'),  [avaxBalance]);
  const formattedBnbBalance   = useMemo(() => balanceService.formatTokenBalance(bnbBalance,  'BNB'),   [bnbBalance]);
  const formattedBtcBalance   = useMemo(() => balanceService.formatTokenBalance(btcBalance,  'BTC'),   [btcBalance]);
  const formattedEthBalance   = useMemo(() => balanceService.formatTokenBalance(ethBalance,  'ETH'),   [ethBalance]);
  const formattedMaticBalance = useMemo(() => balanceService.formatTokenBalance(maticBalance,'MATIC'), [maticBalance]);
  const formattedNgnzBalance  = useMemo(() => balanceService.formatTokenBalance(ngnzBalance, 'NGNZ'),  [ngnzBalance]);
  const formattedSolBalance   = useMemo(() => balanceService.formatTokenBalance(solBalance,  'SOL'),   [solBalance]);
  const formattedUsdcBalance  = useMemo(() => balanceService.formatTokenBalance(usdcBalance, 'USDC'),  [usdcBalance]);
  const formattedUsdtBalance  = useMemo(() => balanceService.formatTokenBalance(usdtBalance, 'USDT'),  [usdtBalance]);

  // Formatted USD amounts (directly from the service)
  const formattedAvaxBalanceUSD  = useMemo(() => balanceService.formatCurrency(avaxBalanceUSD),  [avaxBalanceUSD]);
  const formattedBnbBalanceUSD   = useMemo(() => balanceService.formatCurrency(bnbBalanceUSD),   [bnbBalanceUSD]);
  const formattedBtcBalanceUSD   = useMemo(() => balanceService.formatCurrency(btcBalanceUSD),   [btcBalanceUSD]);
  const formattedEthBalanceUSD   = useMemo(() => balanceService.formatCurrency(ethBalanceUSD),   [ethBalanceUSD]);
  const formattedMaticBalanceUSD = useMemo(() => balanceService.formatCurrency(maticBalanceUSD), [maticBalanceUSD]);
  const formattedNgnzBalanceUSD  = useMemo(() => balanceService.formatCurrency(ngnzBalanceUSD),  [ngnzBalanceUSD]);
  const formattedSolBalanceUSD   = useMemo(() => balanceService.formatCurrency(solBalanceUSD),   [solBalanceUSD]);
  const formattedUsdcBalanceUSD  = useMemo(() => balanceService.formatCurrency(usdcBalanceUSD),  [usdcBalanceUSD]);
  const formattedUsdtBalanceUSD  = useMemo(() => balanceService.formatCurrency(usdtBalanceUSD),  [usdtBalanceUSD]);

  // Total portfolio
  const formattedTotalPortfolio  = useMemo(() => balanceService.formatCurrency(totalPortfolioBalance), [totalPortfolioBalance]);
  const formattedTotalNaira      = useMemo(() => balanceService.formatNaira(totalPortfolioBalance * 1600), [totalPortfolioBalance]);

  // Token-by-token summary
  const tokenBalanceSummary = useMemo(() => ({
    avax: { balance: avaxBalance, balanceUSD: avaxBalanceUSD, pending: avaxPendingBalance },
    bnb:  { balance: bnbBalance,  balanceUSD: bnbBalanceUSD,  pending: bnbPendingBalance },
    btc:  { balance: btcBalance,  balanceUSD: btcBalanceUSD,  pending: btcPendingBalance },
    eth:  { balance: ethBalance,  balanceUSD: ethBalanceUSD,  pending: ethPendingBalance },
    matic:{ balance: maticBalance,balanceUSD: maticBalanceUSD,pending: maticPendingBalance },
    ngnz: { balance: ngnzBalance, balanceUSD: ngnzBalanceUSD, pending: ngnzPendingBalance },
    sol:  { balance: solBalance,  balanceUSD: solBalanceUSD,  pending: solPendingBalance },
    usdc:{ balance: usdcBalance,balanceUSD: usdcBalanceUSD,pending: usdcPendingBalance },
    usdt:{ balance: usdtBalance,balanceUSD: usdtBalanceUSD,pending: usdtPendingBalance },
  }), [
    avaxBalance,  avaxBalanceUSD,  avaxPendingBalance,
    bnbBalance,   bnbBalanceUSD,   bnbPendingBalance,
    btcBalance,   btcBalanceUSD,   btcPendingBalance,
    ethBalance,   ethBalanceUSD,   ethPendingBalance,
    maticBalance, maticBalanceUSD, maticPendingBalance,
    ngnzBalance,  ngnzBalanceUSD,  ngnzPendingBalance,
    solBalance,   solBalanceUSD,   solPendingBalance,
    usdcBalance,  usdcBalanceUSD,  usdcPendingBalance,
    usdtBalance,  usdtBalanceUSD,  usdtPendingBalance,
  ]);

  const getTokenBalance = (symbol) => tokenBalanceSummary[symbol.toLowerCase()] || null;
  const hasTokenBalance = (symbol)  => getTokenBalance(symbol)?.balance > 0;

  const refreshBalances      = () => refetch();
  const forceRefreshBalances = async () => {
    await balanceService.refreshBalances();
    await refetch();
  };

  return {
    // raw
    avaxBalance, bnbBalance, btcBalance, ethBalance,
    maticBalance, ngnzBalance, solBalance,
    usdcBalance, usdtBalance, totalPortfolioBalance,

    // pending
    avaxPendingBalance, bnbPendingBalance, btcPendingBalance,
    ethPendingBalance, maticPendingBalance, ngnzPendingBalance,
    solPendingBalance, usdcPendingBalance, usdtPendingBalance,

    // formatted balances
    formattedAvaxBalance,  formattedBnbBalance,   formattedBtcBalance,
    formattedEthBalance,   formattedMaticBalance, formattedNgnzBalance,
    formattedSolBalance,   formattedUsdcBalance,  formattedUsdtBalance,

    // formatted USD
    formattedAvaxBalanceUSD, formattedBnbBalanceUSD, formattedBtcBalanceUSD,
    formattedEthBalanceUSD,  formattedMaticBalanceUSD,formattedNgnzBalanceUSD,
    formattedSolBalanceUSD,  formattedUsdcBalanceUSD, formattedUsdtBalanceUSD,

    // total portfolio
    formattedTotalPortfolio, formattedTotalNaira,

    // helpers & state
    tokenBalanceSummary,
    getTokenBalance,
    hasTokenBalance,
    loading,
    error,
    refreshBalances,
    forceRefreshBalances,
    refetch,
  };
}
