'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Send, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/TableSkeleton';
import Pill, { type Tone } from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';

type Row = {
  id: number;
  consignmentNumber: string | null;
  tracking: string | null;
  company: string | null;
  reference: string | null;
  orderKey: string | null;
  status: string | null;
  carrier: string | null;
  createdDate: string | null;
  despatchDate: string | null;
  orderNo: string | null;
  store: string | null;
  jobStatus: string | null;
  jobError: string | null;
  readiness: 'ready' | 'queued' | 'not in SOF' | 'no order number';
};

const TH = 'text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';
const READY: Record<Row['readiness'], [Tone, string]> = {
  ready: ['pending', 'Ready to push'],
  queued: ['info', 'Queued'],
  'not in SOF': ['neutral', 'Not in SOF'],
  'no order number': ['neutral', 'No order number'],
};
const auDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }) : '—');

export default function MachshipMissing() {
  const canAct = useCanAct();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pushing, setPushing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs/machship/missing');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not load MachShip consignments');
      setRows(json);
      setPicked(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ready = (rows ?? []).filter(r => r.readiness === 'ready');
  const allOn = ready.length > 0 && ready.every(r => picked.has(r.id));
  const toggle = (id: number) => setPicked(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function push() {
    setPushing(true);
    try {
      const res = await fetch('/api/jobs/machship/missing/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...picked] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Push failed');
      const n = json.queued.length;
      toast.success(`${n} order${n === 1 ? '' : 's'} queued. Frameworks releases them within a minute or two.`);
      setConfirmOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {rows && <p className="text-sm text-muted">{rows.length} consignment{rows.length === 1 ? '' : 's'}, {ready.length} ready to push</p>}
        <div className="ml-auto flex gap-2">
          {canAct && picked.size > 0 && (
            <Button size="sm" onClick={() => setConfirmOpen(true)}><Send />Push {picked.size} to Frameworks</Button>
          )}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={cn(loading && 'animate-spin')} />Refresh</Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center shadow-card">
          <TriangleAlert className="size-5 text-failed" />
          <p className="text-sm font-medium text-ink">Couldn&apos;t load MachShip consignments</p>
          <p className="text-xs text-muted">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : loading && !rows ? (
        <TableSkeleton columns={6} />
      ) : (
        <div className={cn('overflow-hidden rounded-xl bg-white shadow-card transition-opacity', loading && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table data-compact className="stack-table w-full text-sm">
              <thead className="border-b border-frame bg-surface-strong">
                <tr>
                  <th className={cn(TH, 'w-10')}>
                    <Checkbox aria-label="Select all ready" checked={allOn} disabled={!ready.length || !canAct}
                      onCheckedChange={() => setPicked(allOn ? new Set() : new Set(ready.map(r => r.id)))} />
                  </th>
                  <th className={TH}>Order</th>
                  <th className={TH}>MachShip</th>
                  <th className={TH}>Carrier</th>
                  <th className={TH}>Despatched</th>
                  <th className={TH}>Frameworks</th>
                </tr>
              </thead>
              <tbody>
                {rows?.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Every manifested MachShip consignment is invoiced in Frameworks.</td></tr>
                )}
                {rows?.map(r => {
                  const failed = r.jobStatus === 'failed' && r.readiness === 'ready';
                  const [tone, label] = failed ? (['failed', 'Release failed'] as [Tone, string]) : READY[r.readiness];
                  const can = canAct && r.readiness === 'ready';
                  return (
                    <tr key={r.id} className={cn('border-t border-hair first:border-t-0', picked.has(r.id) && 'bg-primary-wash')}>
                      <td data-select className="px-4 py-3">
                        {can && <Checkbox aria-label={`Select ${r.orderKey}`} checked={picked.has(r.id)} onCheckedChange={() => toggle(r.id)} />}
                      </td>
                      <td data-primary className="px-4 py-3">
                        <span className="font-mono text-[0.8125rem] text-ink">{r.orderKey ?? r.reference ?? '—'}</span>
                        <span className="block text-xs text-muted">{r.company}</span>
                      </td>
                      <td data-label="MachShip" className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono text-[0.8125rem] text-ink">{r.consignmentNumber}</span>
                        <span className="block text-xs text-muted">{r.status}</span>
                      </td>
                      <td data-label="Carrier" className="px-4 py-3 text-ink">
                        {r.carrier ?? '—'}
                        {r.tracking && <span className="block font-mono text-xs text-muted">{r.tracking}</span>}
                      </td>
                      <td data-label="Despatched" className="whitespace-nowrap px-4 py-3 font-mono text-[0.8125rem] text-muted">{auDate(r.despatchDate ?? r.createdDate)}</td>
                      <td data-label="Frameworks" data-key className="px-4 py-3">
                        <Pill tone={tone}>{label}</Pill>
                        {r.orderNo && <span className="mt-1 block font-mono text-xs text-muted">{r.orderNo}</span>}
                        {failed && r.jobError && <span className="block max-w-xs truncate text-xs text-muted" title={r.jobError}>{r.jobError}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push {picked.size} to Frameworks?</DialogTitle>
            <DialogDescription>
              Each order is released (invoiced) in Frameworks, the same as when a shipment comes through on its own. Use this when that didn&apos;t happen, for example while the sql-bridge was down.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={push} disabled={pushing}><Send />{pushing ? 'Pushing…' : 'Push to Frameworks'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
