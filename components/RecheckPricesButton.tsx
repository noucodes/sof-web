'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STORES } from './SyncModal';

type Reason = 'mismatch' | 'missing' | 'error';
type Counts = Record<Reason, number>;
type Preview = { dryRun: true; total: number; batchLimit: number; stores: Record<string, Counts> };
type RunResult = {
  dryRun: false; total: number; checked: number; resolved: number; failed: number;
  stillMismatched: number; remaining: number; stores: Record<string, Counts>;
};

const REASONS: { id: Reason; label: string; detail: string; bar: string }[] = [
  { id: 'mismatch', label: 'Amount differs', detail: 'What the customer paid does not match the Frameworks total.', bar: 'bg-pending' },
  { id: 'missing', label: 'No price yet', detail: 'Order is in Frameworks but its total was never stored.', bar: 'bg-primary' },
  { id: 'error', label: 'Lookup failed', detail: 'The last Frameworks price lookup returned an error.', bar: 'bg-failed' },
];
const storeLabel = (id: string) => STORES.find(s => s.id === id)?.label ?? id;
const sum = (c: Counts) => c.mismatch + c.missing + c.error;

export default function RecheckPricesButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw />
        Recheck prices
      </Button>
      {open && <RecheckPricesDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function RecheckPricesDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'preview' | 'run' | null>('preview');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);

  async function call(dryRun: boolean) {
    setLoading(dryRun ? 'preview' : 'run');
    try {
      const res = await fetch('/api/orders/recheck-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Price recheck failed');
      if (dryRun) setPreview(data);
      else {
        setRun(data);
        toast.success(`Rechecked ${data.checked} order${data.checked === 1 ? '' : 's'}`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  // The preview only reads the database, so load it as soon as the dialog opens.
  useEffect(() => { call(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = REASONS.reduce(
    (t, r) => ({ ...t, [r.id]: Object.values(preview?.stores ?? {}).reduce((n, c) => n + c[r.id], 0) }),
    {} as Counts,
  );
  const outstanding = run ? run.remaining : preview?.total ?? 0;
  const nextBatch = Math.min(outstanding, preview?.batchLimit ?? 50);
  const stores = Object.entries(preview?.stores ?? {}).sort((a, b) => sum(b[1]) - sum(a[1]));
  const max = Math.max(1, ...stores.map(([, c]) => sum(c)));

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Recheck Frameworks prices</DialogTitle>
          <DialogDescription>Fetch the latest total from Frameworks for payments that don’t reconcile.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:overflow-visible">
          {/* What gets rechecked */}
          <div className="space-y-4 p-6">
            <p className="text-xs font-medium text-ink">{run ? 'Needed a recheck when this dialog opened' : 'Orders that need a recheck'}</p>
            <ul className="divide-y divide-frame rounded-lg border border-frame">
              {REASONS.map(r => (
                <li key={r.id} className="flex items-start gap-3 px-3 py-3">
                  <i className={cn('mt-1.5 size-2 shrink-0 rounded-sm', r.bar)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.label}</p>
                    <p className="text-xs text-muted">{r.detail}</p>
                  </div>
                  {preview ? (
                    <span className="text-lg font-semibold tabular-nums text-ink">{totals[r.id].toLocaleString()}</span>
                  ) : (
                    <Skeleton className="h-6 w-8" />
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Only orders already synced to Frameworks are checked, oldest first, up to {preview?.batchLimit ?? 50} per run.
              sof-main also runs this check automatically every 15 minutes.
            </p>
          </div>

          {/* Preview / outcome */}
          <section aria-live="polite" className="flex min-w-0 flex-col border-t border-frame bg-surface/60 p-6 md:border-l md:border-t-0">
            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
              {run ? 'Recheck result' : 'By store'}
            </p>

            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {!loading && preview && preview.total === 0 && !run && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-frame-input/50 px-6 py-10 text-center">
                <CheckCircle2 className="size-6 text-success" />
                <p className="text-sm font-medium text-ink">Everything reconciles</p>
                <p className="max-w-[32ch] text-xs text-muted">Every synced order has a Frameworks total that matches its payment.</p>
              </div>
            )}

            {!loading && run && (
              <div className="space-y-4">
                <dl className="grid grid-cols-3 divide-x divide-frame rounded-lg border border-frame bg-white">
                  {[
                    ['Now match', run.resolved, 'text-success'],
                    ['Still differ', run.stillMismatched, 'text-pending'],
                    ['Lookup failed', run.failed, 'text-failed'],
                  ].map(([k, v, c]) => (
                    <div key={k as string} className="px-3 py-2.5">
                      <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{k}</dt>
                      <dd className={cn('text-xl font-semibold tabular-nums', c as string)}>{(v as number).toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
                <p className="flex items-center gap-2 text-xs text-muted">
                  {run.remaining > 0
                    ? <><CircleAlert className="size-3.5 text-pending" />{run.remaining.toLocaleString()} more waiting. Run again to check the next batch.</>
                    : <><CheckCircle2 className="size-3.5 text-success" />All {run.checked} outstanding orders were checked.</>}
                </p>
                {run.stillMismatched > 0 && (
                  <p className="text-xs text-muted">
                    Orders that still differ are Frameworks disagreeing with Shopify. Use “Show mismatches only” on this page to review them.
                  </p>
                )}
              </div>
            )}

            {!loading && preview && preview.total > 0 && !run && (
              <div className="space-y-4">
                <ul className="divide-y divide-frame rounded-lg border border-frame bg-white">
                  {stores.map(([id, c]) => (
                    <li key={id} className="space-y-1.5 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ink">{storeLabel(id)}</span>
                        <span className="text-xs tabular-nums text-muted">{sum(c).toLocaleString()} orders</span>
                      </div>
                      <div
                        className="flex h-2 overflow-hidden rounded-full bg-surface"
                        role="img"
                        aria-label={REASONS.map(r => `${c[r.id]} ${r.label.toLowerCase()}`).join(', ')}
                      >
                        {REASONS.map(r => (
                          <i key={r.id} className={cn('h-full', r.bar)} style={{ width: `${(c[r.id] / max) * 100}%` }} />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-4 text-[0.6875rem] text-muted">
                  {REASONS.map(r => (
                    <span key={r.id} className="flex items-center gap-1.5"><i className={cn('size-2 rounded-sm', r.bar)} />{r.label}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <p className="min-w-0 text-xs text-muted">
            {loading === 'run' ? `Checking ${nextBatch} orders against Frameworks…`
              : preview ? `${outstanding.toLocaleString()} order${outstanding === 1 ? '' : 's'} outstanding` : 'Counting orders…'}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>{run ? 'Done' : 'Cancel'}</Button>
            <Button onClick={() => call(false)} disabled={!!loading || nextBatch === 0}>
              {loading === 'run' ? 'Rechecking…'
                : nextBatch === 0 ? 'Nothing to recheck'
                : outstanding > nextBatch ? `Recheck ${run ? 'next ' : ''}${nextBatch} of ${outstanding.toLocaleString()}`
                : `Recheck ${nextBatch} order${nextBatch === 1 ? '' : 's'}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
