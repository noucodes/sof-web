'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STORES = ['burdens', 'bathroomhq', 'plumbershq', 'aspire'];
const FINANCIAL_STATUSES = ['any', 'paid', 'pending', 'refunded'];

function today() {
  return new Date().toISOString().slice(0, 10);
}
function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function SyncModal({ onClose }: { onClose: () => void }) {
  const [stores, setStores] = useState<string[]>(['burdens']);
  const [startDate, setStartDate] = useState(weekAgo());
  const [endDate, setEndDate] = useState(today());
  const [financialStatus, setFinancialStatus] = useState('any');
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function toggleStore(s: string) {
    setStores(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSync() {
    if (!stores.length) return toast.error('Select at least one store');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stores, startDate: `${startDate}T00:00:00Z`, endDate: `${endDate}T23:59:59Z`, financialStatus, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Sync failed');
      setResult(data);
      toast.success(dryRun ? 'Dry run complete' : 'Sync complete');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-frame">
          <p className="text-[0.9375rem] font-semibold text-ink">Manual sync</p>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted" onClick={onClose} aria-label="Close">
            <X className="!size-5" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stores */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink">Stores</p>
            <div className="flex gap-2 flex-wrap">
              {STORES.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  aria-pressed={stores.includes(s)}
                  onClick={() => toggleStore(s)}
                  className={stores.includes(s) ? 'border-primary bg-primary-wash text-primary hover:bg-primary-wash' : 'text-muted hover:text-ink'}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sync-start" className="text-xs font-medium text-ink">Start date</label>
              <Input id="sync-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sync-end" className="text-xs font-medium text-ink">End date</label>
              <Input id="sync-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Financial status */}
          <div className="space-y-1.5">
            <label htmlFor="sync-financial" className="text-xs font-medium text-ink">Financial status</label>
            <Select value={financialStatus} onValueChange={setFinancialStatus}>
              <SelectTrigger id="sync-financial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dry run */}
          <div className="flex items-center gap-2.5">
            <Checkbox id="sync-dry-run" checked={dryRun} onCheckedChange={c => setDryRun(c === true)} />
            <label htmlFor="sync-dry-run" className="cursor-pointer text-sm text-ink">
              Dry run <span className="text-muted">(preview only, no enqueue)</span>
            </label>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-surface rounded-lg p-3 text-xs font-mono text-ink overflow-auto max-h-40">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={loading || !stores.length}>
            {loading ? 'Syncing…' : dryRun ? 'Preview' : 'Sync'}
          </Button>
        </div>
      </div>
    </div>
  );
}
