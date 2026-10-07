'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Clock, RefreshCw, TriangleAlert, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/TableSkeleton';
import Pill, { type Tone } from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';

type Row = {
  id: number;
  orderName: string | null;
  store: string | null;
  customer: string | null;
  frameworksOrderNo: string | null;
  invoicedAt: string;
  total: string | null;
  delivery: string | null;
  lineCount: number | null;
  // null: not open in ShipStation (already shipped there, or never sent to it)
  shipstation: { orderId: number; orderNumber: string; status: string; service: string | null; carrierCode: string | null } | null;
};
type ListResponse = { days: number; checkedAt: string; orders: Row[]; notOpenInShipStation: number };
type Carrier = { code: string; name: string };
type AutoLogRow = {
  id: number;
  createdAt: string;
  params: { orderName: string | null; store: string | null; carrierCode: string; shipDate: string; ssStatus: string };
  result: { ok: boolean; error?: string };
};

const STORE_LABELS: Record<string, string> = { burdens: 'Burdens', bathroomhq: 'Bathroom HQ', plumbershq: 'Plumbers HQ', aspire: 'Aspire' };
const SS_STATUS: Record<string, [Tone, string]> = {
  awaiting_shipment: ['pending', 'Awaiting shipment'],
  on_hold: ['pending', 'On hold'],
  cancelled: ['neutral', 'Cancelled'],
};
const TH = 'text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';
const WINDOWS = [7, 30, 90];
const VIEWS = {
  open: 'Still open in ShipStation',
  cancelled: 'Cancelled in ShipStation',
  gone: 'Already shipped or not in ShipStation',
  all: 'All statuses',
} as const;
type View = keyof typeof VIEWS;
const viewOf = (r: Row): Exclude<View, 'all'> => (!r.shipstation ? 'gone' : r.shipstation.status === 'cancelled' ? 'cancelled' : 'open');

const markable = (r: Row) => viewOf(r) === 'open';
// invoiced_at is a DATE column; read it as a calendar date, not a local-time instant.
const ymd = (iso: string) => iso.slice(0, 10);
const auDate = (iso: string) => new Date(ymd(iso) + 'T00:00:00Z').toLocaleDateString('en-AU', { timeZone: 'UTC' });
const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(ymd(iso) + 'T00:00:00Z')) / 864e5));
const money = (v: string | null) => (v == null ? '—' : `$${parseFloat(v).toFixed(2)}`);
const agoLabel = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return min < 1 ? 'just now' : min === 1 ? '1 min ago' : `${min} min ago`;
};

function StatusPill({ status }: { status: string | null }) {
  if (!status) return <Pill tone="neutral">Not open</Pill>;
  const [tone, label] = SS_STATUS[status] ?? ['neutral', status.replace(/_/g, ' ')];
  return <Pill tone={tone}>{label}</Pill>;
}

export default function InvoicedOutsideShipStation() {
  const canAct = useCanAct();
  const [days, setDays] = useState(30);
  const [store, setStore] = useState('all');
  const [view, setView] = useState<View>('open');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [autoLog, setAutoLog] = useState<AutoLogRow[] | null>(null);
  const [, tick] = useState(0);

  const loadAutoLog = useCallback(() => {
    fetch('/api/jobs/shipstation/invoiced-outside/auto-log').then(r => (r.ok ? r.json() : [])).then(setAutoLog).catch(() => setAutoLog([]));
  }, []);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/shipstation/invoiced-outside?days=${d}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not load orders from ShipStation');
      setData(json);
      setPicked(new Set());
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);
  useEffect(() => {
    fetch('/api/jobs/shipstation/carriers').then(r => (r.ok ? r.json() : [])).then(setCarriers).catch(() => {});
    loadAutoLog();
    const t = setInterval(() => tick(n => n + 1), 30000); // keeps "Last checked N min ago" current
    return () => clearInterval(t);
  }, [loadAutoLog]);

  async function checkNow() {
    setChecking(true);
    try {
      const res = await fetch('/api/jobs/shipstation/invoiced-outside/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Check failed');
      const before = new Set(data?.orders.map(o => o.id));
      const added = json.orders.filter((o: Row) => !before.has(o.id)).length;
      setData(json);
      setPicked(new Set());
      toast.success(added ? `Check complete. ${added} new order${added === 1 ? '' : 's'} invoiced outside ShipStation.` : 'Check complete. Nothing new.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChecking(false);
      loadAutoLog();
    }
  }

  async function markShipped(items: { row: Row; carrierCode: string; shipDate: string; trackingNumber?: string }[], notifyCustomer: boolean) {
    const res = await fetch('/api/jobs/shipstation/invoiced-outside/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notifyCustomer,
        orders: items.map(i => ({
          shipstationOrderId: i.row.shipstation!.orderId,
          carrierCode: i.carrierCode,
          shipDate: i.shipDate,
          ...(i.trackingNumber ? { trackingNumber: i.trackingNumber } : {}),
        })),
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? 'ShipStation did not accept the request');
    const failed = json.results.filter((r: any) => !r.ok);
    const done = new Set<number>(json.results.filter((r: any) => r.ok).map((r: any) => r.shipstationOrderId));
    setData(d => (d ? { ...d, orders: d.orders.filter(o => !o.shipstation || !done.has(o.shipstation.orderId)) } : d));
    setPicked(p => new Set([...p].filter(id => !items.some(i => i.row.id === id && done.has(i.row.shipstation!.orderId)))));
    if (json.marked) toast.success(`Marked ${json.marked} order${json.marked === 1 ? '' : 's'} shipped in ShipStation`);
    if (failed.length) toast.error(`${failed.length} not marked: ${failed[0].error}`);
    return failed.length === 0;
  }

  const storeRows = useMemo(() => (data?.orders ?? []).filter(o => store === 'all' || o.store === store), [data, store]);
  const rows = view === 'all' ? storeRows : storeRows.filter(r => viewOf(r) === view);
  const count = (v: View) => storeRows.filter(r => viewOf(r) === v).length;
  const open = rows.filter(markable);
  const stale = storeRows.filter(r => markable(r) && daysSince(r.invoicedAt) >= 3);
  const selected = open.filter(r => picked.has(r.id));
  const allOn = open.length > 0 && open.every(r => picked.has(r.id));
  const toggle = (id: number) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [VIEWS.open, count('open'), count('open') ? 'text-pending' : 'text-ink'],
          ['Open 3+ days', stale.length, stale.length ? 'text-failed' : 'text-ink'],
          [VIEWS.cancelled, count('cancelled'), 'text-ink'],
          [VIEWS.gone, count('gone'), 'text-muted'],
        ].map(([k, v, c]) => (
          <div key={k as string} className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{k}</p>
            {loading && !data ? (
              <Skeleton className="mt-2 h-5 w-10" />
            ) : (
              <p className={cn('mt-1 text-lg font-semibold tabular-nums', error ? 'text-muted' : (c as string))}>{error ? '—' : (v as number)}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selected.length > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary-wash py-1 pl-3 pr-1 text-sm font-medium text-primary">
            {selected.length} selected
            <Button size="sm" onClick={() => setBulkOpen(true)}><Truck />Mark {selected.length} shipped</Button>
            <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
          </div>
        ) : (
          <>
            <Select value={store} onValueChange={setStore}>
              <SelectTrigger aria-label="Store" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                {Object.entries(STORE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
              <SelectTrigger aria-label="Invoiced within" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WINDOWS.map(d => <SelectItem key={d} value={String(d)}>Last {d} days</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={view} onValueChange={v => { setView(v as View); setPicked(new Set()); }}>
              <SelectTrigger aria-label="ShipStation status" className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(VIEWS) as View[]).map(v => (
                  <SelectItem key={v} value={v}>{VIEWS[v]} ({v === 'all' ? storeRows.length : count(v)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
          <Clock className="size-3.5" />
          {checking ? 'Checking Frameworks and ShipStation…' : data ? `Last checked ${agoLabel(data.checkedAt)}` : error ? 'Not loaded' : 'Loading…'}
        </span>
        {canAct && <Button
          size="sm"
          variant="outline"
          onClick={checkNow}
          disabled={checking || loading}
          title="Re-read invoice dates from Frameworks and order statuses from ShipStation"
        >
          <RefreshCw className={checking ? 'animate-spin' : undefined} />
          {checking ? 'Checking…' : 'Check now'}
        </Button>}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center shadow-card">
          <TriangleAlert className="size-5 text-failed" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">Couldn&apos;t load orders invoiced outside ShipStation</p>
            <p className="text-xs text-muted">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => load(days)}>Try again</Button>
        </div>
      ) : loading && !data ? (
        <TableSkeleton columns={7} />
      ) : (
        <div className={cn('overflow-hidden rounded-xl bg-white shadow-card transition-opacity', loading && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-frame bg-surface-strong">
                <tr>
                  <th className={cn(TH, 'w-10')}>
                    <Checkbox
                      aria-label="Select all open orders"
                      checked={allOn}
                      disabled={!open.length || !canAct}
                      onCheckedChange={() => setPicked(allOn ? new Set() : new Set(open.map(r => r.id)))}
                    />
                  </th>
                  <th className={TH}>Order</th>
                  <th className={TH}>Invoiced in Frameworks</th>
                  <th className={TH}>ShipStation</th>
                  <th className={TH}>Delivery</th>
                  <th className={cn(TH, 'text-right')}>Total</th>
                  <th className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                      {view === 'all' ? 'Nothing invoiced in Frameworks without a ShipStation label' : `No orders ${VIEWS[view].toLowerCase()}`} in the last {days} days{store !== 'all' ? ` for ${STORE_LABELS[store]}` : ''}.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => {
                  const age = daysSince(r.invoicedAt);
                  const can = canAct && markable(r);
                  return (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      onClick={() => setOpenRow(r)}
                      onKeyDown={e => { if (e.key === 'Enter') setOpenRow(r); }}
                      className={cn(
                        'cursor-pointer transition-colors duration-100 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none',
                        'border-t border-hair first:border-t-0',
                        picked.has(r.id) && 'bg-primary-wash',
                      )}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {can && <Checkbox aria-label={`Select ${r.orderName}`} checked={picked.has(r.id)} onCheckedChange={() => toggle(r.id)} />}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[0.8125rem] text-ink">{r.orderName}</span>
                        <span className="block text-xs text-muted">{[r.customer, STORE_LABELS[r.store ?? ''] ?? r.store].filter(Boolean).join(' · ')}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono text-[0.8125rem] text-muted">{auDate(r.invoicedAt)}</span>
                        <span className="block font-mono text-xs text-muted">{r.frameworksOrderNo ?? '—'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusPill status={r.shipstation?.status ?? null} />
                        {can && (
                          <span className={cn('mt-1 block text-xs', age >= 3 ? 'font-medium text-failed' : 'text-muted')}>
                            {age === 0 ? 'Invoiced today' : `${age} day${age === 1 ? '' : 's'} open`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {r.delivery ?? r.shipstation?.service ?? '—'}
                        {r.lineCount != null && <span className="block text-xs text-muted">{r.lineCount} item{r.lineCount === 1 ? '' : 's'}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{money(r.total)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant={can ? 'outline' : 'ghost'} onClick={() => setOpenRow(r)}>{can ? 'Mark shipped' : 'Review'}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AutoLog rows={autoLog} />

      {openRow && (
        <RowDialog row={openRow} carriers={carriers} onClose={() => setOpenRow(null)} onMark={markShipped} />
      )}
      {bulkOpen && (
        <BulkDialog rows={selected} carriers={carriers} onClose={() => setBulkOpen(false)} onMark={markShipped} />
      )}
    </div>
  );
}

function AutoLog({ rows }: { rows: AutoLogRow[] | null }) {
  return (
    <section className="space-y-2" aria-labelledby="auto-log-title">
      <div>
        <h3 id="auto-log-title" className="text-sm font-semibold text-ink">Marked shipped automatically</h3>
        <p className="text-xs text-muted">
          Every 30 minutes (and on Check now), every order invoiced in Frameworks that is still open in ShipStation are marked shipped there. The customer isn&apos;t emailed.
        </p>
      </div>
      {rows === null ? (
        <TableSkeleton columns={4} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-frame bg-surface-strong">
                <tr>
                  <th className={TH}>When</th>
                  <th className={TH}>Order</th>
                  <th className={TH}>Carrier · ship date</th>
                  <th className={TH}>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">Nothing marked automatically yet.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-hair first:border-t-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.8125rem] text-muted">
                      {new Date(r.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[0.8125rem] text-ink">{r.params.orderName}</span>
                      <span className="block text-xs text-muted">{STORE_LABELS[r.params.store ?? ''] ?? r.params.store}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{r.params.carrierCode} · {auDate(r.params.shipDate)}</td>
                    <td className="px-4 py-3">
                      {r.result.ok ? <Pill tone="success">Marked shipped</Pill> : <Pill tone="failed">Failed</Pill>}
                      {r.result.error && <span className="mt-1 block text-xs text-failed">{r.result.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

type MarkFn = (items: { row: Row; carrierCode: string; shipDate: string; trackingNumber?: string }[], notify: boolean) => Promise<boolean>;

function CarrierSelect({ carriers, value, onChange, id }: { carriers: Carrier[]; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue placeholder={carriers.length ? 'Choose a carrier' : 'Loading carriers…'} /></SelectTrigger>
      <SelectContent>
        {carriers.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function NotifyToggle({ checked, onChange, pickups }: { checked: boolean; onChange: (v: boolean) => void; pickups?: number }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-frame bg-surface p-3">
      <Checkbox className="mt-0.5" checked={checked} onCheckedChange={c => onChange(c === true)} />
      <span>
        <span className="block text-sm font-medium text-ink">Email the customer a shipping notification</span>
        <span className="block text-xs text-muted">
          Off by default.{pickups ? ` ${pickups} of these look like pickups.` : ' Pickup customers already have their goods.'}
        </span>
      </span>
    </label>
  );
}

const looksLikePickup = (r: Row) => /pick ?up|collect/i.test(`${r.delivery ?? ''} ${r.shipstation?.service ?? ''}`);

function RowDialog({ row, carriers, onClose, onMark }: { row: Row; carriers: Carrier[]; onClose: () => void; onMark: MarkFn }) {
  const can = useCanAct() && markable(row);
  const [carrier, setCarrier] = useState(row.shipstation?.carrierCode ?? '');
  const [shipDate, setShipDate] = useState(ymd(row.invoicedAt));
  const [tracking, setTracking] = useState('');
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      if (await onMark([{ row, carrierCode: carrier, shipDate, trackingNumber: tracking.trim() || undefined }], notify)) onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const side = (title: string, badge: React.ReactNode, items: [string, React.ReactNode][]) => (
    <div className="space-y-2 rounded-lg border border-frame p-4">
      <p className="flex items-center justify-between gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{title}{badge}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8125rem]">
        {items.map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="text-right tabular-nums text-ink">{v}</dd></div>
        ))}
      </dl>
    </div>
  );

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle><span className="font-mono">{row.orderName}</span>{row.customer ? ` · ${row.customer}` : ''}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <StatusPill status={row.shipstation?.status ?? null} />
            <span>{STORE_LABELS[row.store ?? ''] ?? row.store}</span>
            <span>·</span>
            <span className="tabular-nums">{money(row.total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            {side('Frameworks', <Pill tone="success">Invoiced</Pill>, [
              ['Order no.', <span key="n" className="font-mono">{row.frameworksOrderNo ?? '—'}</span>],
              ['Invoiced', auDate(row.invoicedAt)],
              ['Total inc. GST', money(row.total)],
              ['Lines', row.lineCount ?? '—'],
            ])}
            <ArrowRight className="hidden size-4 justify-self-center text-muted sm:block" />
            {side('ShipStation', <StatusPill status={row.shipstation?.status ?? null} />, [
              ['Order no.', <span key="s" className="font-mono">{row.shipstation?.orderNumber ?? '—'}</span>],
              ['Service', row.shipstation?.service ?? '—'],
              ['Label printed', 'No'],
              ['Days open', can ? daysSince(row.invoicedAt) : '—'],
            ])}
          </div>

          {can ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="mark-carrier" className="text-xs font-medium text-ink">Shipped with</label>
                <CarrierSelect id="mark-carrier" carriers={carriers} value={carrier} onChange={setCarrier} />
                <p className="text-[0.6875rem] text-muted">Carriers connected to your ShipStation account.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mark-date" className="text-xs font-medium text-ink">Ship date</label>
                <Input id="mark-date" type="date" value={shipDate} onChange={e => setShipDate(e.target.value)} />
                <p className="text-[0.6875rem] text-muted">Defaults to the Frameworks invoice date.</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="mark-tracking" className="text-xs font-medium text-ink">
                  Tracking number <span className="font-normal text-muted">(optional)</span>
                </label>
                <Input id="mark-tracking" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Leave blank for pickups and own delivery" />
              </div>
              <div className="sm:col-span-2"><NotifyToggle checked={notify} onChange={setNotify} /></div>
            </div>
          ) : !row.shipstation ? (
            <p className="rounded-lg border border-frame bg-surface px-4 py-3 text-sm text-muted">
              Not open in ShipStation. It was already shipped there without a label job here, or never sent to ShipStation (pickup, counter sale). Nothing to do.
            </p>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-pending-bg px-4 py-3 text-sm text-pending">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>Cancelled in ShipStation but invoiced in Frameworks. One of them is wrong. Confirm with the store before changing either.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          {can && <p className="min-w-0 text-xs text-muted">Recorded as shipped in ShipStation. No label is bought.</p>}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>{can ? 'Cancel' : 'Close'}</Button>
            {can && (
              <Button onClick={submit} disabled={busy || !carrier || !shipDate}>
                <Truck />{busy ? 'Marking…' : 'Mark shipped in ShipStation'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkDialog({ rows, carriers, onClose, onMark }: { rows: Row[]; carriers: Carrier[]; onClose: () => void; onMark: MarkFn }) {
  const [carrier, setCarrier] = useState('');
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const withoutCarrier = rows.filter(r => !r.shipstation!.carrierCode).length;
  const pickups = rows.filter(looksLikePickup).length;

  async function submit() {
    setBusy(true);
    try {
      const ok = await onMark(
        rows.map(row => ({ row, carrierCode: row.shipstation!.carrierCode ?? carrier, shipDate: ymd(row.invoicedAt) })),
        notify,
      );
      if (ok) onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mark {rows.length} order{rows.length === 1 ? '' : 's'} shipped in ShipStation</DialogTitle>
          <DialogDescription>Each one is marked shipped on the date Frameworks invoiced it.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="max-h-56 overflow-y-auto rounded-lg border border-frame">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-hair first:border-t-0">
                    <td className="px-4 py-2 font-mono text-[0.8125rem]">{r.orderName}</td>
                    <td className="px-4 py-2">{r.customer ?? '—'}</td>
                    <td className="px-4 py-2 text-muted">{r.shipstation!.carrierCode ?? 'Needs a carrier'}</td>
                    <td className="px-4 py-2 text-right font-mono text-[0.8125rem] text-muted">{auDate(r.invoicedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withoutCarrier > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="bulk-carrier" className="text-xs font-medium text-ink">
                Carrier for the {withoutCarrier} order{withoutCarrier === 1 ? '' : 's'} without one
              </label>
              <CarrierSelect id="bulk-carrier" carriers={carriers} value={carrier} onChange={setCarrier} />
            </div>
          )}
          <NotifyToggle checked={notify} onChange={setNotify} pickups={pickups} />
          <p className="text-xs text-muted">Open a single order to add a tracking number.</p>
        </div>
        <DialogFooter>
          <p className="min-w-0 text-xs text-muted">No labels are bought.</p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={busy || (withoutCarrier > 0 && !carrier)}>
              <Truck />{busy ? 'Marking…' : `Mark ${rows.length} shipped`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
