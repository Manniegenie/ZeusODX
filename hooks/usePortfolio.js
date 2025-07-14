import { useMemo } from 'react';
import { useApi } from './useApi';
import { portfolioService } from '../services/portfolioService';

export function usePortfolio() {
  const {
    data: portfolio,
    loading,
    error,
    refetch,
  } = useApi(() => portfolioService.getPortfolio());

  const {
    data: balance,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useApi(() => portfolioService.getBalance());

  const {
    data: history,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useApi(() => portfolioService.getHistory());

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!balance) {
      console.log('💰 usePortfolio: No balance data, showing default');
      return { naira: '₦0.00', usd: '$0.00' };
    }
    
    console.log('💰 usePortfolio: Formatting balance', balance);
    return {
      naira: `₦${balance.naira.toLocaleString('en-NG', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`,
      usd: `$${balance.usd.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`,
    };
  }, [balance]);

  // Format portfolio assets
  const formattedAssets = useMemo(() => {
    if (!portfolio?.assets) {
      console.log('🏦 usePortfolio: No assets data');
      return [];
    }

    console.log('🏦 usePortfolio: Formatting assets', portfolio.assets.length);
    return portfolio.assets.map(asset => ({
      ...asset,
      formattedValue: {
        naira: `₦${asset.value.naira.toLocaleString('en-NG')}`,
        usd: `$${asset.value.usd.toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`,
      },
      formattedBalance: asset.balance.toLocaleString(),
    }));
  }, [portfolio]);

  // Calculate portfolio performance
  const performance = useMemo(() => {
    if (!history || !Array.isArray(history)) {
      return { change24h: 0, changePercent: 0, isPositive: true };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    if (!latest || !previous) {
      return { change24h: 0, changePercent: 0, isPositive: true };
    }

    const change = latest.value.usd - previous.value.usd;
    const changePercent = (change / previous.value.usd) * 100;

    return {
      change24h: change,
      changePercent: Math.abs(changePercent),
      changeFormatted: `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      isPositive: change >= 0,
    };
  }, [history]);

  // Refresh all portfolio data
  const refreshPortfolio = async () => {
    console.log('🔄 usePortfolio: Refreshing all portfolio data');
    await Promise.all([
      refetch(),
      refetchBalance(),
      refetchHistory(),
    ]);
  };

  return {
    portfolio,
    balance,
    history,
    formattedBalance,
    formattedAssets,
    performance,
    loading: loading || balanceLoading,
    historyLoading,
    error,
    refreshPortfolio,
    refetch,
    refetchBalance,
    refetchHistory,
  };
}