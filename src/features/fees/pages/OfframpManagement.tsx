/* eslint-disable */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import type { AppDispatch, RootState } from '@/core/store/store';
import { fetchOfframp, setOfframp } from '@/features/fees/store/ngnMarkupSlice';
import { DashboardTitleContext } from '@/layouts/DashboardTitleContext';
import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

export function OfframpManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const titleCtx = useContext(DashboardTitleContext);
  const ngn = useSelector((state: RootState) => state.ngnMarkup);

  const [rateInput, setRateInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    titleCtx?.setTitle('Off-ramp Rate');
    titleCtx?.setBreadcrumb(['Fees & Rates', 'NGN Rates', 'Off-ramp management']);
    dispatch(fetchOfframp());
  }, [dispatch, titleCtx]);

  const handleUpdate = async () => {
    if (!rateInput.trim()) {
      toast.error('Provide a rate');
      return;
    }
    const value = Number(rateInput);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Invalid rate. Enter a positive number.');
      return;
    }
    setSaving(true);
    try {
      const response = await dispatch(setOfframp(value)).unwrap();
      if (response?.success) {
        toast.success(response.message || 'Off-ramp rate updated');
        setRateInput('');
        dispatch(fetchOfframp());
      } else {
        toast.error(response?.message || 'Failed to update off-ramp rate');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Failed to update off-ramp rate');
    } finally {
      setSaving(false);
    }
  };

  const currentRate = ngn.offramp?.rate ?? null;
  const lastUpdated = ngn.offramp?.updatedAt ? new Date(ngn.offramp.updatedAt).toLocaleString() : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-gray-900">Manage off-ramp rate</h2>
            <p className="text-sm text-gray-600">
              Update the NGN rate used when converting crypto balances into local currency.
            </p>
          </header>

          <section className="bg-primary rounded-xl text-white p-5 space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/80">Current rate</p>
            <h3 className="text-4xl font-semibold">
              {currentRate !== null ? `₦${Number(currentRate).toLocaleString()}` : '—'}
            </h3>
            <p className="text-xs text-white/80">Last updated: {lastUpdated}</p>
          </section>

  <section className="space-y-3">
    <div className="flex flex-col gap-2">
      <Label className="text-gray-700">New off-ramp rate (₦ per unit)</Label>
      <NumberInput
        allowDecimal
        placeholder="Enter a rate"
        value={rateInput}
        onChange={(event) => setRateInput(event.target.value)}
        className="h-11"
      />
      <span className="text-xs text-gray-500">Used whenever users withdraw to NGN.</span>
    </div>
    <div className="flex items-center gap-3">
      <Button onClick={handleUpdate} disabled={saving}>
        {saving ? 'Saving...' : 'Update rate'}
      </Button>
      <Button variant="outline" onClick={() => dispatch(fetchOfframp())} disabled={ngn.loading}>
        {ngn.loading ? 'Refreshing...' : 'Refresh current rate'}
      </Button>
    </div>
  </section>

  {ngn.error && (
    <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
      {ngn.error}
    </div>
  )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm text-gray-600">
          <h3 className="text-base font-semibold text-gray-900">Guidance</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Applies to outbound cashouts routed through the Zeus ODX off-ramp engine.</li>
            <li>Keep this aligned with prevailing FX rates to avoid large reconciliation differences.</li>
            <li>Rates take effect immediately for new requests.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfframpManagement;

