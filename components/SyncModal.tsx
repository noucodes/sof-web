'use client';
import { useState } from 'react';
import { toast } from 'sonner';

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

  const inputClass = 'border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-frame">
          <p className="text-[0.9375rem] font-semibold text-ink">Manual sync</p>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-hover">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stores */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink">Stores</p>
            <div className="flex gap-2 flex-wrap">
              {STORES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleStore(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors duration-[120ms] ${
                    stores.includes(s)
                      ? 'bg-primary-wash text-primary border-primary/20 font-medium'
                      : 'border-frame-input text-muted hover:text-ink'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Financial status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink">Financial status</label>
            <select value={financialStatus} onChange={e => setFinancialStatus(e.target.value)} className={`${inputClass} w-full`}>
              {FINANCIAL_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Dry run */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="rounded border-frame-input" />
            <span className="text-sm text-ink">Dry run <span className="text-muted">(preview only, no enqueue)</span></span>
          </label>

          {/* Result */}
          {result && (
            <div className="bg-surface rounded-lg p-3 text-xs font-mono text-ink overflow-auto max-h-40">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-ink border border-frame-input rounded-lg hover:bg-surface-hover transition-colors duration-[120ms]">
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={loading || !stores.length}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Syncing…' : dryRun ? 'Preview' : 'Sync'}
          </button>
        </div>
      </div>
    </div>
  );
}
