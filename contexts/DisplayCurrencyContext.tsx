import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getDisplayCurrency, setDisplayCurrency as setDisplayCurrencyApi } from '../services/displayCurrencyService';

type DisplayCurrency = 'USD' | 'NGN';

interface DisplayCurrencyContextValue {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

export function DisplayCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>('USD');

  useEffect(() => {
    getDisplayCurrency().then((c) => setDisplayCurrencyState(c));
  }, []);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    setDisplayCurrencyApi(currency);
  }, []);

  const value: DisplayCurrencyContextValue = {
    displayCurrency,
    setDisplayCurrency,
  };

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    return {
      displayCurrency: 'USD',
      setDisplayCurrency: () => {},
    };
  }
  return ctx;
}
