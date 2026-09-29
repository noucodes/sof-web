'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STORES } from './SyncModal';

type Readiness = 'ready' | 'no_frameworks' | 'no_order' | 'voided';
type Missing = {
  shipmentId: string; orderNumber: string | null; trackingNumber: string | null;
  carrierCode: string | null; shipDate: string | null; store: string | null; readiness: Readiness;
};
type Preview = { daysBack: number; checked: number; missing: Missing[] };
type FixResult = { found: number; queued: number; skippedVoided: number; unmatched: number };

const WINDOWS = [1, 3, 7, 14, 30];
const READINESS: { id: Readiness; label: string; detail: string; dot: string; pill: string }[] = [
  { id: 'ready', label: 'Ready to release', detail: 'Order is synced to Frameworks.', dot: 'bg-success', pill: 'bg-success-bg text-success' },
  { id: 'no_frameworks', label: 'No Frameworks number', detail: 'Order is here but not in Frameworks yet.', dot: 'bg-pending', pill: 'bg-pending-bg text-pending' },
  { id: 'no_order', label: 'Order not in database', detail: 'sof-main will try its own Frameworks lookup.', dot: 'bg-failed', pill: 'bg-failed-bg text-failed' },
  { id: 'voided', label: 'Voided label', detail: 'Skipped. A cancelled label is never released.', dot: 'bg-frame-input/45', pill: 'bg-surface text-muted' },
];
const storeLabel = (id: string | null) => (id ? STORES.find(s => s.id === id)?.label ?? id : '—');

export default function MissingShipmentsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PackageSearch />
        Missing shipments
      </Button>
      {open && <MissingShipmentsDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function MissingShipmentsDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState<'preview' | 'fix' | null>('preview');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fixed, setFixed] = useState<FixResult | null>(null);

  // Finding missing shipments only reads ShipStation and the database, so it runs on open and on every window change.
  useEffect(() => {
    let stale = false;
    setLoading('preview');
    setPreview(null);
    setFixed(null);
    fetch(`/api/jobs/shipstation/missing?days=${days}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Could not reach ShipStation');
        if (!stale) setPreview(data);
      })
      .catch(err => !stale && toast.error(err.message))
      .finally(() => !stale && setLoading(null));
    return () => { stale = true; };
  }, [days]);

  async function queue() {
    setLoading('fix');
    try {
      const res = await fetch('/api/jobs/shipstation/missing/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not queue shipments');
      setFixed(data);
      toast.success(`Queued ${data.queued} shipment${data.queued === 1 ? '' : 's'}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  const missing = preview?.missing ?? [];
  const counts = Object.fromEntries(READINESS.map(r => [r.id, missing.filter(m => m.readiness === r.id).length])) as Record<Readiness, number>;
  const queueable = missing.length - counts.voided;
  // Ready first, voided last — the order people act on them.
  const rank = (r: Readiness) => READINESS.findIndex(x => x.id === r);
  const sorted = [...missing].sort((a, b) => rank(a.readiness) - rank(b.readiness));

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Missing ShipStation shipments</DialogTitle>
          <DialogDescription>Labels printed in ShipStation whose webhook never reached us, so the order was never released or invoiced.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] md:overflow-visible">
          {/* Window + summary */}
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink" id="ms-window">Ship date</p>
              <div role="radiogroup" aria-labelledby="ms-window" className="grid grid-cols-5 gap-1 rounded-lg border border-frame bg-surface p-1">
                {WINDOWS.map(d => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={days === d}
                    disabled={loading === 'fix'}
                    onClick={() => setDays(d)}
                    className={cn(
                      'rounded-md py-1.5 text-[0.8125rem] tabular-nums transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none',
                      days === d ? 'bg-white font-medium text-ink shadow-card' : 'text-muted hover:text-ink',
                    )}
                  >
                    {d === 1 ? '24 h' : `${d} d`}
                  </button>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-2 divide-x divide-frame rounded-lg border border-frame">
              <div className="px-3 py-2.5">
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">In ShipStation</dt>
                <dd className="text-xl font-semibold tabular-nums text-ink">{preview ? preview.checked.toLocaleString() : <Skeleton className="mt-1 h-6 w-12" />}</dd>
              </div>
              <div className="px-3 py-2.5">
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Missing here</dt>
                <dd className={cn('text-xl font-semibold tabular-nums', missing.length ? 'text-pending' : 'text-ink')}>
                  {preview ? missing.length.toLocaleString() : <Skeleton className="mt-1 h-6 w-12" />}
                </dd>
              </div>
            </dl>

            <ul className="space-y-2.5">
              {READINESS.map(r => (
                <li key={r.id} className="flex items-start gap-2.5">
                  <i className={cn('mt-1.5 size-2 shrink-0 rounded-sm', r.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{r.label}</p>
                    <p className="text-xs text-muted">{r.detail}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{preview ? counts[r.id] : '–'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shipment list / outcome */}
          <section aria-live="polite" className="flex min-h-0 min-w-0 flex-col border-t border-frame bg-surface/60 p-6 md:border-l md:border-t-0">
            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
              {fixed ? 'Queued' : 'Shipments'}
            </p>

            {loading === 'preview' && (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-11 w-full" />)}
              </div>
            )}

            {!loading && preview && missing.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-frame-input/50 px-6 py-10 text-center">
                <CheckCircle2 className="size-6 text-success" />
                <p className="text-sm font-medium text-ink">Nothing missing</p>
                <p className="max-w-[34ch] text-xs text-muted">
                  All {preview.checked.toLocaleString()} ShipStation shipments from the last {days === 1 ? '24 hours' : `${days} days`} are recorded here.
                </p>
              </div>
            )}

            {fixed && (
              <div className="space-y-3 rounded-lg border border-frame bg-white p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <CheckCircle2 className="size-4 text-success" />
                  {fixed.queued} shipment{fixed.queued === 1 ? '' : 's'} queued for release
                </p>
                <p className="text-xs text-muted">
                  sof-main picks them up within about a minute and releases each order in Frameworks. They appear in this list as they’re picked up.
                  {fixed.unmatched > 0 && ` ${fixed.unmatched} could not be matched to a synced order here and may fail; the job will show why.`}
                  {fixed.skippedVoided > 0 && ` ${fixed.skippedVoided} voided label${fixed.skippedVoided === 1 ? ' was' : 's were'} skipped.`}
                </p>
              </div>
            )}

            {!loading && !fixed && missing.length > 0 && (
              <ul className="max-h-[22rem] divide-y divide-frame overflow-y-auto rounded-lg border border-frame bg-white">
                {sorted.map(m => {
                  const r = READINESS[rank(m.readiness)];
                  return (
                    <li key={m.shipmentId} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className="font-mono text-[0.8125rem] text-ink">#{m.orderNumber ?? '—'}</span>
                          <span className="truncate text-xs text-muted">{storeLabel(m.store)}</span>
                        </p>
                        <p className="truncate font-mono text-[0.6875rem] text-muted">
                          {[m.carrierCode, m.trackingNumber, m.shipDate && new Date(m.shipDate).toLocaleDateString('en-AU')].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium', r.pill)}>{r.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <DialogFooter>
          <p className="min-w-0 text-xs text-muted">
            {loading === 'preview' ? 'Checking ShipStation…'
              : loading === 'fix' ? 'Queuing…'
              : preview ? `Queuing releases and invoices these orders in Frameworks, the same as their webhook would have.` : ''}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>{fixed ? 'Done' : 'Cancel'}</Button>
            <Button onClick={queue} disabled={!!loading || !!fixed || queueable === 0}>
              {loading === 'fix' ? 'Queuing…'
                : queueable === 0 ? 'Nothing to queue'
                : `Queue ${queueable} shipment${queueable === 1 ? '' : 's'}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
