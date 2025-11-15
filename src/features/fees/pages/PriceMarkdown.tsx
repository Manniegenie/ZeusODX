/* eslint-disable */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AppDispatch, RootState } from '@/core/store/store';
import { fetchGlobalMarkdown, setGlobalMarkdown, toggleGlobalMarkdown } from '@/features/fees/store/assetMarkdownSlice';
import { DashboardTitleContext } from '@/layouts/DashboardTitleContext';
import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

export function PriceMarkdown() {
  const dispatch = useDispatch<AppDispatch>();
  const titleCtx = useContext(DashboardTitleContext);
  const assetState = useSelector((state: RootState) => state.assetMarkdown);
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [percentageInput, setPercentageInput] = useState('');
  const [description, setDescription] = useState('');
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    titleCtx?.setTitle('Price Markdown');
    titleCtx?.setBreadcrumb(['Fees & Rates', 'Global Adjustments', 'Price markdown']);
    dispatch(fetchGlobalMarkdown());
  }, [dispatch, titleCtx]);

  useEffect(() => {
    if (assetState.global) {
      setDescription(assetState.global.description ?? '');
    }
  }, [assetState.global]);

  const handleUpdate = async () => {
    if (!percentageInput.trim()) {
      toast.error('Provide a markdown percentage');
      return;
    }
    const value = Number(percentageInput);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error('Enter a value between 0 and 100');
      return;
    }
    try {
      const payload = await dispatch(
        setGlobalMarkdown({
          markdownPercentage: value,
          description: description || undefined,
          updatedBy: authUser?.email || authUser?.adminName || authUser?.name,
        })
      ).unwrap();
      if (payload?.success) {
        toast.success(payload.message || 'Markdown updated');
        setPercentageInput('');
        dispatch(fetchGlobalMarkdown());
      } else {
        toast.error(payload?.message || 'Failed to update markdown');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Failed to update markdown');
    }
  };

  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      const payload = await dispatch(
        toggleGlobalMarkdown({
          updatedBy: authUser?.email || authUser?.adminName || authUser?.name,
        })
      ).unwrap();
      if (payload?.success) {
        toast.success(payload.message || 'Status updated');
        dispatch(fetchGlobalMarkdown());
      } else {
        toast.error(payload?.message || 'Failed to update status');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Failed to update status');
    } finally {
      setToggleLoading(false);
    }
  };

  const active = assetState.global?.isActive ?? false;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-none">
        <CardContent className="p-6 space-y-6">
          <section className="bg-primary rounded-xl text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs text-white/80 uppercase tracking-wide">Current markdown</p>
              <h2 className="text-4xl font-semibold">
                {assetState.global ? `${assetState.global.markdownPercentage?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 0}%` : '—'}
              </h2>
              <p className="text-xs text-white/80">{assetState.global?.description || 'Global price markdown applied across PayBeta integrations.'}</p>
              <p className="text-xs text-white/80">
                Last update: {assetState.global?.updatedAt ? new Date(assetState.global.updatedAt).toLocaleString() : '—'}
              </p>
              <p className="text-xs text-white/80">Updated by: {assetState.global?.updatedBy || '—'}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="uppercase tracking-wide text-xs">Status</span>
              <Switch checked={active} onCheckedChange={handleToggle} disabled={toggleLoading} />
              <span className="text-sm font-semibold">{active ? 'Active' : 'Inactive'}</span>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-gray-700">Markdown percentage (0 - 100)</Label>
              <NumberInput
                value={percentageInput}
                onChange={(event) => setPercentageInput(event.target.value)}
                allowDecimal
                placeholder="12.5"
                className="w-full h-11"
              />
              <span className="text-xs text-gray-500">Affects every new price computed with PayBeta.</span>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe why this adjustment is necessary"
                className="min-h-[96px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleUpdate} disabled={assetState.loading}>
                {assetState.loading ? 'Saving...' : 'Update markdown'}
              </Button>
              <Button variant="outline" disabled={toggleLoading} onClick={handleToggle}>
                {toggleLoading ? 'Updating...' : active ? 'Disable markdown' : 'Enable markdown'}
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm text-gray-600">
          <h3 className="text-base font-semibold text-gray-900">What this controls</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Applies a global markdown before PayBeta price calculations.</li>
            <li>Impacts the price calculator and any PayBeta purchase flows that rely on this setting.</li>
            <li>Disable the markdown temporarily if you want PayBeta to use raw provider rates.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default PriceMarkdown;

