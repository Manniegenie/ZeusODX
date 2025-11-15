/* eslint-disable */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AppDispatch } from '@/core/store/store';
import { DashboardTitleContext } from '@/layouts/DashboardTitleContext';
import { Search, Trash2 } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { DEPOSIT_NETWORK_OPTIONS } from '../constants/networks';
import { deleteCryptoFee } from '../store/cryptoFeeSlice';
import type { CryptoFee } from '../type/fee';

export function SearchFee({ initialFee, loading = false, error, viewOnly = false }: { initialFee?: CryptoFee; loading?: boolean; error?: string | null; viewOnly?: boolean } = {}) {
  const titleCtx = useContext(DashboardTitleContext);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialFee?.currency ?? '');
  const [selectedNetwork, setSelectedNetwork] = useState<string>(initialFee?.network ?? '');
  const [searchResult, setSearchResult] = useState<CryptoFee | null>(initialFee ?? null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    titleCtx?.setTitle('View Specific Fee');
    titleCtx?.setBreadcrumb([
      'Fees & Rates',
      'Crypto Fees',
      'View specific fee',
    ]);
  }, [titleCtx]);

  useEffect(() => {
    if (initialFee) {
      setSelectedCurrency(initialFee.currency ?? '');
      setSelectedNetwork(initialFee.network ?? '');
      setSearchResult(initialFee);
    }
  }, [initialFee]);

  const currencies = ['BTC', 'ETH', 'USDT'];
  const networks = DEPOSIT_NETWORK_OPTIONS;

  const handleSearch = () => {
    if (selectedCurrency && selectedNetwork) {
      const mockResult: CryptoFee = {
        currency: selectedCurrency,
        network: selectedNetwork,
        networkName: `${selectedNetwork} Network`,
        networkFee: 0.001,
      };
      setSearchResult(mockResult);
    }
  };

  const handleDelete = async () => {
    if (!searchResult) return;
    if (!confirm(`Delete ${searchResult.currency} - ${searchResult.network} fee?`)) {
      return;
    }

    try {
      setDeleting(true);
      await dispatch(deleteCryptoFee({
        currency: searchResult.currency,
        network: searchResult.network,
      })).unwrap();
      toast.success('Crypto fee deleted successfully');
      setSearchResult(null);
    } catch (err) {
      console.error('Failed to delete crypto fee', err);
      toast.error('Failed to delete crypto fee');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-6">
      <Card className="border border-gray-200 shadow-none">
        <CardContent className="py-6 px-4">
          <div className="w-full py-8 flex flex-col justify-center items-start gap-8">
            {viewOnly ? (
              <div className="w-full py-6 border border-gray-200 rounded px-3">{selectedCurrency || '-'}</div>
            ) : (
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full border border-gray-300 py-6">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="w-full border border-gray-300 bg-white">
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {viewOnly ? (
              <div className="w-full py-6 border border-gray-200 rounded px-3">{selectedNetwork || '-'}</div>
            ) : (
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="w-full border border-gray-300 py-6 text-slate-900">
                  <SelectValue placeholder="Select Network" className="text-slate-900" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white border border-gray-300 text-slate-900">
                  {networks.map((network) => (
                    <SelectItem key={network} value={network} className="text-slate-900">
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!viewOnly && (
              <Button onClick={handleSearch} className="flex h-12 w-full text-white items-center gap-2" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? 'Loading…' : 'Search Fee'}
              </Button>
            )}
            {viewOnly && loading && (
              <div className="text-sm text-gray-500">Loading fee…</div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200 shadow-none">
          <CardContent className="pt-4">
            <div className="text-sm text-red-700">{error}</div>
          </CardContent>
        </Card>
      )}

      {searchResult && (
        <Card className="bg-green-100 border-green-300 shadow-none">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fee Details</h3>
              {!viewOnly && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2 bg-red-600 text-black hover:bg-red-700 disabled:bg-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Currency:</span>
                <span>{searchResult.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Network:</span>
                <span>{searchResult.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Network Name:</span>
                <span>{searchResult.networkName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fee (Token):</span>
                <span>{searchResult.networkFee}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
