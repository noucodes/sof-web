'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, startOfMonth, subDays, differenceInCalendarDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarDays, CheckCircle2, CircleAlert, CloudDownload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STORES = [
  { id: 'burdens', label: 'Burdens' },
  { id: 'bathroomhq', label: 'Bathroom HQ' },
  { id: 'plumbershq', label: 'Plumbers HQ' },
  { id: 'aspire', label: 'Aspire' },
];
const FINANCIAL_STATUSES = ['any', 'paid', 'pending', 'refunded'];

const PRESETS: { id: string; label: string; range: () => DateRange }[] = [
  { id: 'today', label: 'Today', range: () => ({ from: new Date(), to: new Date() }) },
  { id: '7d', label: 'Last 7 days', range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { id: '30d', label: 'Last 30 days', range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { id: 'month', label: 'This month', range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
];

type StoreResult = {
  store: string; label: string; seen: number; enqueued: number;
  dryRun?: boolean; alreadyInDb?: number; wouldEnqueue?: number; skipped?: boolean; error?: string;
};

// A preview reports wouldEnqueue; a real sync reports enqueued, and everything else it saw was already stored.
const newCount = (r: StoreResult) => (r.dryRun ? r.wouldEnqueue ?? 0 : r.enqueued);
const inDbCount = (r: StoreResult) => r.alreadyInDb ?? r.seen - r.enqueued;
const fmtDate = (d: Date) => format(d, 'd MMM yyyy');

export default function SyncModal({ onClose }: { onClose: () => void }) {
  const [stores, setStores] = useState<string[]>(['burdens']);
  const [preset, setPreset] = useState('7d');
  const [range, setRange] = useState<DateRange | undefined>(PRESETS[1].range());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [financialStatus, setFinancialStatus] = useState('any');
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StoreResult[] | null>(null);

  const previewed = results?.every(r => r.skipped || r.error || r.dryRun) ?? false;
  const totals = (results ?? []).reduce(
    (t, r) => (r.skipped || r.error ? t : { seen: t.seen + r.seen, inDb: t.inDb + inDbCount(r), new: t.new + newCount(r) }),
    { seen: 0, inDb: 0, new: 0 },
  );
  // After a preview with new orders, the main button commits exactly that preview.
  const commitsPreview = previewed && totals.new > 0;

  // Any change to the inputs makes the shown result stale.
  function change<T>(set: (v: T) => void) {
    return (v: T) => { set(v); setResults(null); };
  }
  const toggleStore = change((s: string) => setStores(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])));

  async function run(asDryRun: boolean) {
    if (!stores.length || !range?.from) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stores,
          startDate: `${format(range.from, 'yyyy-MM-dd')}T00:00:00Z`,
          endDate: `${format(range.to ?? range.from, 'yyyy-MM-dd')}T23:59:59Z`,
          financialStatus,
          dryRun: asDryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Sync failed');
      setResults(data.results);
      toast.success(asDryRun ? 'Preview ready' : 'Sync complete');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const days = range?.from ? differenceInCalendarDays(range.to ?? range.from, range.from) + 1 : 0;
  const buttonLabel = loading
    ? (dryRun && !commitsPreview ? 'Checking…' : 'Syncing…')
    : commitsPreview ? `Sync ${totals.new} new order${totals.new === 1 ? '' : 's'}`
    : previewed ? 'Nothing new to sync'
    : dryRun ? 'Preview' : 'Sync now';

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manual sync</DialogTitle>
          <DialogDescription>Pull orders from Shopify that the webhook may have missed.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:overflow-visible">
          {/* Settings */}
          <div className="space-y-5 p-6">
            <fieldset className="space-y-2">
              <div className="flex items-baseline justify-between">
                <legend className="text-xs font-medium text-ink">Stores</legend>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setStores(STORES.map(s => s.id)); setResults(null); }}>
                  Select all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STORES.map(s => {
                  const on = stores.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                        on ? 'border-primary bg-primary-wash text-ink' : 'border-frame text-muted hover:bg-surface-hover hover:text-ink',
                      )}
                    >
                      <Checkbox checked={on} onCheckedChange={() => toggleStore(s.id)} />
                      {s.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <p className="text-xs font-medium text-ink">Order date</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={preset === p.id}
                    className={cn('h-7 rounded-full px-3 text-xs', preset === p.id ? 'border-ink bg-ink text-white hover:bg-ink' : 'border-frame text-muted')}
                    onClick={() => {
                      setPreset(p.id);
                      setRange(p.range());
                      setResults(null);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2.5 font-normal">
                    <CalendarDays className="text-muted" />
                    {range?.from ? (
                      <span className="tabular-nums">
                        {fmtDate(range.from)} <span className="text-muted">→</span> {range.to ? fmtDate(range.to) : '…'}
                      </span>
                    ) : (
                      <span className="text-muted">Pick a date range</span>
                    )}
                    {days > 0 && <span className="ml-auto text-xs tabular-nums text-muted">{days} {days === 1 ? 'day' : 'days'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    weekStartsOn={1}
                    defaultMonth={range?.from}
                    endMonth={new Date()}
                    disabled={{ after: new Date() }}
                    selected={range}
                    onSelect={r => { setRange(r); setPreset('custom'); setResults(null); }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-ink" id="sync-financial">Payment status</p>
              <div role="radiogroup" aria-labelledby="sync-financial" className="grid grid-cols-4 gap-1 rounded-lg border border-frame bg-surface p-1">
                {FINANCIAL_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={financialStatus === s}
                    onClick={() => change(setFinancialStatus)(s)}
                    className={cn(
                      'rounded-md py-1.5 text-[0.8125rem] capitalize transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none',
                      financialStatus === s ? 'bg-white font-medium text-ink shadow-card' : 'text-muted hover:text-ink',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor="sync-dry-run" className="flex cursor-pointer items-start gap-3 rounded-lg border border-frame bg-surface p-3">
              <Checkbox id="sync-dry-run" className="mt-0.5" checked={dryRun} onCheckedChange={c => change(setDryRun)(c === true)} />
              <span>
                <span className="block text-sm font-medium text-ink">Preview first</span>
                <span className="block text-xs text-muted">
                  {dryRun
                    ? 'Compares Shopify with the database. Nothing is queued until you confirm.'
                    : 'New orders are queued immediately and sent to Frameworks.'}
                </span>
              </span>
            </label>
          </div>

          {/* Results */}
          <section aria-live="polite" className="flex min-w-0 flex-col border-t border-frame bg-surface/60 p-6 md:border-l md:border-t-0">
            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
              {results && !previewed ? 'Sync result' : 'Preview'}
            </p>

            {!results && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-frame-input/50 px-6 py-10 text-center">
                <CloudDownload className="size-6 text-muted" />
                <p className="text-sm font-medium text-ink">No preview yet</p>
                <p className="max-w-[32ch] text-xs text-muted">Run a preview to see how many orders are already stored and how many are new for each store.</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                {stores.map(s => <Skeleton key={s} className="h-10 w-full" />)}
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <dl className="grid grid-cols-3 divide-x divide-frame rounded-lg border border-frame bg-white">
                  {[
                    ['From Shopify', totals.seen, 'text-ink'],
                    ['Already stored', totals.inDb, 'text-ink'],
                    [previewed ? 'New' : 'Queued', totals.new, 'text-primary'],
                  ].map(([k, v, c]) => (
                    <div key={k as string} className="px-3 py-2.5">
                      <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{k}</dt>
                      <dd className={cn('text-xl font-semibold tabular-nums', c as string)}>{(v as number).toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>

                <ul className="divide-y divide-frame rounded-lg border border-frame bg-white">
                  {results.map(r => <StoreRow key={r.store} r={r} max={Math.max(1, ...results.map(x => x.seen))} previewed={previewed} />)}
                </ul>

                <div className="flex items-center gap-4 text-[0.6875rem] text-muted">
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-frame-input/45" />Already stored</span>
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-primary" />{previewed ? 'New, would be queued' : 'Queued'}</span>
                  <Popover>
                    <PopoverTrigger className="ml-auto text-primary hover:underline">Raw response</PopoverTrigger>
                    <PopoverContent align="end" className="max-h-72 w-96 overflow-auto p-3">
                      <pre className="font-mono text-[0.6875rem] text-ink">{JSON.stringify({ results }, null, 2)}</pre>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <p className="min-w-0 text-xs text-muted">
            {!stores.length ? 'Pick at least one store'
              : `${stores.length} ${stores.length === 1 ? 'store' : 'stores'} · ${days} ${days === 1 ? 'day' : 'days'} · ${financialStatus === 'any' ? 'any payment status' : financialStatus}`}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>{results && !previewed ? 'Done' : 'Cancel'}</Button>
            <Button
              onClick={() => run(commitsPreview ? false : dryRun)}
              disabled={loading || !stores.length || !range?.from || (previewed && !commitsPreview) || (!!results && !previewed)}
            >
              {buttonLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreRow({ r, max, previewed }: { r: StoreResult; max: number; previewed: boolean }) {
  if (r.skipped || r.error) {
    return (
      <li className="flex items-center justify-between gap-3 px-3 py-2.5">
        <span className="text-sm font-medium text-ink">{r.label}</span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium', r.error ? 'bg-failed-bg text-failed' : 'bg-pending-bg text-pending')}>
          <CircleAlert className="size-3" />
          {r.error ? `Shopify request failed: ${r.error}` : 'Skipped · no Shopify credentials'}
        </span>
      </li>
    );
  }
  const fresh = newCount(r);
  const stored = inDbCount(r);
  return (
    <li className="space-y-1.5 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {r.label}
          {fresh === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[0.6875rem] font-medium text-success">
              <CheckCircle2 className="size-3" />Up to date
            </span>
          ) : (
            <span className="rounded-full bg-primary-wash px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums text-primary-deep">
              {fresh.toLocaleString()} {previewed ? 'new' : 'queued'}
            </span>
          )}
        </span>
        <span className="text-xs tabular-nums text-muted">{stored.toLocaleString()} of {r.seen.toLocaleString()} stored</span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-surface"
        role="img"
        aria-label={`${stored} already stored, ${fresh} ${previewed ? 'new' : 'queued'}, out of ${r.seen}`}
      >
        <i className="h-full bg-frame-input/45" style={{ width: `${(stored / max) * 100}%` }} />
        {/* ponytail: min 2% so a handful of new orders among hundreds stays visible */}
        <i className="h-full bg-primary" style={{ width: `${fresh ? Math.max(2, (fresh / max) * 100) : 0}%` }} />
      </div>
    </li>
  );
}
