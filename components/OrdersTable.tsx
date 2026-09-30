'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SortableTh from '@/components/table/SortableTh';
import StatusPill, { humanize, type Tone } from '@/components/StatusPill';
import { useOrdersToolbar } from '@/components/OrdersToolbar';
import { createPortal } from 'react-dom';

export const STATUS_TONE: Record<string, Tone> = { success: 'success', failed: 'failed', pending: 'pending' };
const PAYMENT_TONE: Record<string, Tone> = {
  paid: 'success', pending: 'pending', authorized: 'pending', partially_paid: 'pending',
  refunded: 'neutral', partially_refunded: 'neutral', voided: 'failed',
};

// Keys match sof-api's ORDER_SORT_KEYS — sorting happens server-side across
// the whole filtered dataset, not just the loaded page (see OrdersService.findAll).
// Customer and store sit under the order number (Refined layout) rather than in
// columns of their own; the store filter above the table covers store.
const COLUMNS = [
  { key: 'order', label: 'Order' },
  { key: 'status', label: 'Status' },
  { key: 'payment', label: 'Payment' },
  { key: 'total', label: 'Total', right: true },
  { key: 'items', label: 'Items' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'frameworks', label: 'Frameworks no.' },
  { key: 'created', label: 'Created' },
];

const money = (v: string | number | null | undefined) =>
  v == null || v === '' ? '—' : `$${Number(v).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (d: number) => `${d > 0 ? '+' : '−'}$${Math.abs(d).toFixed(2)}`;
const sydney = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', ...(withTime ? { timeStyle: 'short' as const } : {}) });
const fwNo = (o: any) => (o.frameworksOrderNo ? `${o.frameworksOrderNo}-${o.frameworksOrderSuffix ?? '0'}` : null);

export function JsonView({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  if (data == null) return <p className="text-sm text-muted italic">No data</p>;

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    // The whole box scrolls, so the scrollbar runs its full height. Copy lives
    // in a zero-height sticky row inside the scroll content: it stays pinned
    // top-right and, being content, always sits left of the scrollbar.
    <div className="bg-surface rounded-lg overflow-auto max-h-[40vh] [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]">
      <div className="sticky top-0 flex h-0 items-start justify-end">
        <Button variant="outline" size="sm" onClick={copy} className="mt-2 mr-2 h-7 bg-white px-2 text-[0.6875rem] text-muted shadow-sm hover:text-ink">
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="text-xs text-ink p-4 pr-16 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">{label}</p>
      {children}
    </div>
  );
}

type Tab = 'summary' | 'shopify' | 'frameworks' | 'payment';
const TABS: [Tab, string][] = [['summary', 'Summary'], ['shopify', 'Shopify'], ['frameworks', 'Frameworks'], ['payment', 'Payment']];

function Facts({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <Section label={title}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8125rem]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 truncate text-right tabular-nums text-ink">{v ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Summary({ order }: { order: any }) {
  const fw = order.frameworksPrice != null ? Number(order.frameworksPrice) : null;
  const diff = fw != null && order.total != null ? Math.round((fw - Number(order.total)) * 100) / 100 : null;
  const lastEvent = order.error ?? order.paymentError ?? (
    order.status === 'pending' ? 'Queued. Not sent to Frameworks yet.'
    : order.invoicedAt ? `Invoiced in Frameworks on ${sydney(order.invoicedAt)}.`
    : 'Sent to Frameworks without errors.'
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-frame bg-surface p-3 text-center">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Customer paid</p>
          <p className="text-lg font-semibold tabular-nums text-ink">{money(order.total)}</p>
        </div>
        {fw == null
          ? <StatusPill tone="neutral">{order.frameworksPriceError ? 'Price not fetched' : 'No Frameworks total'}</StatusPill>
          : diff ? <StatusPill tone="pending">{signed(diff)}</StatusPill>
          : <StatusPill tone="success">Match</StatusPill>}
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Frameworks total</p>
          <p className="text-lg font-semibold tabular-nums text-ink">{money(fw)}</p>
        </div>
      </div>

      <div className="grid gap-x-7 gap-y-5 sm:grid-cols-3">
        <Facts title="Payment" rows={[
          ['Method', order.paymentMethod ? humanize(order.paymentMethod) : null],
          ['Status', order.paymentStatus ? humanize(order.paymentStatus) : null],
          ['Fee', order.paymentFee != null ? money(order.paymentFee) : null],
        ]} />
        <Facts title="Frameworks" rows={[
          ['Order no.', fwNo(order) && <span className="font-mono">{fwNo(order)}</span>],
          ['Attempts', order.attempts],
          ['Invoiced', order.invoicedAt ? sydney(order.invoicedAt) : null],
        ]} />
        <Facts title="Customer" rows={[
          ['Name', order.customer?.name],
          ['Email', order.customer?.email],
          ['Phone', order.customer?.phone],
        ]} />
      </div>

      <Section label="Last event">
        <p className={cn('text-[0.8125rem]', order.error || order.paymentError ? 'text-failed' : 'text-muted')}>{lastEvent}</p>
      </Section>

      {order.lineItems?.length > 0 && (
        <Section label={`Items · ${order.deliveryMethod ?? 'No delivery method'}`}>
          <table className="w-full text-[0.8125rem]">
            <tbody>
              {order.lineItems.map((li: any, i: number) => (
                <tr key={i} className="border-t border-hair first:border-t-0">
                  <td className="py-1.5 pr-3 font-mono text-muted">{li.sku ?? '—'}</td>
                  <td className="py-1.5 pr-3 text-ink">{li.name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-muted">×{li.quantity}</td>
                  <td className="py-1.5 text-right tabular-nums text-ink">{money(li.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}

function TabContent({ order, tab }: { order: any; tab: Tab }) {
  if (tab === 'summary') return <Summary order={order} />;

  if (tab === 'shopify') {
    return (
      <Section label="Request — Shopify webhook">
        <JsonView data={order.payload} />
      </Section>
    );
  }

  if (tab === 'frameworks') {
    const response = order.frameworksOrderNo
      ? { orderNo: order.frameworksOrderNo, orderSuffix: order.frameworksOrderSuffix ?? null, status: 'success' }
      : order.error
      ? { status: 'failed', error: order.error }
      : null;

    return (
      <div className="space-y-4">
        <Section label="Request — sent to Frameworks">
          <JsonView data={order.frameworksPayload} />
        </Section>
        <Section label="Response — from Frameworks">
          <JsonView data={response} />
        </Section>
      </div>
    );
  }

  const response = order.invoiceStatus
    ? { invoiceStatus: order.invoiceStatus }
    : order.paymentError
    ? { status: 'failed', error: order.paymentError }
    : null;

  return (
    <div className="space-y-4">
      <Section label="Request — payment payload">
        <JsonView data={order.paymentPayload} />
      </Section>
      <Section label="Response — payment result">
        <JsonView data={response} />
      </Section>
    </div>
  );
}

type NumberGap = { storeLabel: string; nextOrderNumber: number; gapFrom: number; gapTo: number; missingCount: number };

// ponytail: duplicate check only covers orders currently loaded (one page,
// current filters) — real duplicates are rare enough in practice that this
// still catches them. Gaps are different: a "missing" number is just as
// likely to be sitting on another page or hidden by the current filter, so
// that check is backed by GET /orders/number-gaps (full history, all
// stores) instead of guessing from whatever's loaded here.
function findOrderWarnings(orders: any[], gaps: NumberGap[]) {
  const warnings = new Map<string, string>();
  const byStore = new Map<string, { num: number; id: string }[]>();

  for (const o of orders) {
    const match = /(\d+)\s*$/.exec(o.orderName ?? '');
    if (!match) continue;
    const list = byStore.get(o.storeLabel) ?? [];
    list.push({ num: parseInt(match[1], 10), id: o.id });
    byStore.set(o.storeLabel, list);
  }

  for (const list of byStore.values()) {
    const byNum = new Map<number, string[]>();
    for (const { num, id } of list) byNum.set(num, [...(byNum.get(num) ?? []), id]);
    for (const ids of byNum.values()) {
      if (ids.length > 1) for (const id of ids) warnings.set(id, 'Duplicate order number');
    }
  }

  const gapByStoreAndNum = new Map(gaps.map((g) => [`${g.storeLabel}:${g.nextOrderNumber}`, g]));
  for (const [storeLbl, list] of byStore.entries()) {
    for (const { num, id } of list) {
      if (warnings.has(id)) continue;
      const gap = gapByStoreAndNum.get(`${storeLbl}:${num}`);
      if (gap) {
        const range = gap.missingCount > 1 ? `#${gap.gapFrom}–#${gap.gapTo}` : `#${gap.gapFrom}`;
        warnings.set(id, `Gap in order numbers: ${range} missing`);
      }
    }
  }

  return warnings;
}

function WarningIcon({ message }: { message: string }) {
  return (
    <span title={message}>
      <svg
        className="w-3.5 h-3.5 text-pending shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        role="img"
        aria-label={message}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    </span>
  );
}

export default function OrdersTable({ orders, gaps = [] }: { orders: any[]; gaps?: NumberGap[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderWarnings = useMemo(() => findOrderWarnings(orders, gaps), [orders, gaps]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [retrying, setRetrying] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('summary');
  const [isSortPending, startSortTransition] = useTransition();
  const [pendingSortKey, setPendingSortKey] = useState<string | null>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const { compact, slot } = useOrdersToolbar();

  // Selection belongs to the rows on screen; a new page, sort or filter clears it.
  useEffect(() => setPicked(new Set()), [orders]);

  const allOn = orders.length > 0 && orders.every(o => picked.has(o.id));
  const someOn = !allOn && orders.some(o => picked.has(o.id));
  const pickedFailed = orders.filter(o => picked.has(o.id) && o.status === 'failed');
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // One request per order, in sequence, so the bridge isn't hit in parallel.
  async function retrySelected() {
    setBulkRetrying(true);
    let ok = 0;
    for (const o of pickedFailed) {
      const res = await fetch(`/api/orders/${o.id}/retry`, { method: 'POST' }).catch(() => null);
      if (res?.ok) ok++;
    }
    setBulkRetrying(false);
    const failed = pickedFailed.length - ok;
    if (ok) toast.success(`${ok} order${ok === 1 ? '' : 's'} queued for retry`);
    if (failed) toast.error(`${failed} order${failed === 1 ? '' : 's'} could not be queued`);
    setPicked(new Set());
    router.refresh();
  }

  const cell = compact ? 'px-4 py-1.5' : 'px-4 py-3';

  const activeSortBy = searchParams.get('sortBy');
  const activeSortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;

  function toggleSort(key: string) {
    const next = new URLSearchParams(searchParams.toString());
    const current = activeSortBy === key ? activeSortDir : null;
    if (current === 'asc') {
      next.set('sortBy', key);
      next.set('sortDir', 'desc');
    } else if (current === 'desc') {
      next.delete('sortBy');
      next.delete('sortDir');
    } else {
      next.set('sortBy', key);
      next.set('sortDir', 'asc');
    }
    next.set('page', '1');
    setPendingSortKey(key);
    startSortTransition(() => {
      router.push(`/orders?${next.toString()}`);
    });
  }

  async function retry(id: string) {
    setRetrying(id);
    try {
      const res = await fetch(`/api/orders/${id}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setDetails(d => (d[id] ? { ...d, [id]: { ...d[id], status: 'pending', statusLabel: 'Pending', error: null } } : d));
      toast.success('Order queued for retry');
      router.refresh();
    } catch {
      toast.error('Retry failed');
    } finally {
      setRetrying(null);
    }
  }

  // Payloads and line items only come with the single-order fetch; cached per
  // order so stepping back and forth with the arrow keys doesn't refetch.
  async function show(idx: number) {
    setOpenIdx(idx);
    const o = orders[idx];
    if (details[o.id]) return;
    const res = await fetch(`/api/orders/${o.id}`).catch(() => null);
    if (res?.ok) {
      const full = await res.json();
      setDetails(d => ({ ...d, [o.id]: full }));
    }
  }

  function open(idx: number) {
    setTab('summary');
    show(idx);
  }

  const current = openIdx != null ? orders[openIdx] : null;
  const order = current ? { ...current, ...details[current.id] } : null;
  const loaded = current ? !!details[current.id] : false;
  const step = (by: number) => {
    if (openIdx == null) return;
    const next = openIdx + by;
    if (next >= 0 && next < orders.length) show(next);
  };

  return (
    <>
      {/* Bulk bar lives in the filter row (see OrdersToolbar), beside the density switch. */}
      {slot && picked.size > 0 && createPortal(
        <div className="flex h-9 items-center gap-2 rounded-lg bg-primary-wash pl-3 pr-0.5 text-sm font-medium text-primary" aria-live="polite">
          {picked.size} selected
          {pickedFailed.length > 0 && (
            <Button size="sm" onClick={retrySelected} disabled={bulkRetrying}>
              {bulkRetrying ? 'Retrying…' : `Retry ${pickedFailed.length} failed`}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
        </div>,
        slot,
      )}

      <div className="overflow-x-auto">
        <table className={cn('w-full', compact ? 'text-[0.8125rem]' : 'text-sm')}>
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              <th className="w-10 py-[10px] pl-4 pr-0">
                <Checkbox
                  aria-label="Select all orders on this page"
                  checked={allOn ? true : someOn ? 'indeterminate' : false}
                  disabled={!orders.length}
                  onCheckedChange={() => setPicked(allOn ? new Set() : new Set(orders.map(o => o.id)))}
                />
              </th>
              {COLUMNS.map(col => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  direction={activeSortBy === col.key ? activeSortDir : null}
                  onClick={() => toggleSort(col.key)}
                  loading={isSortPending && pendingSortKey === col.key}
                  className={col.right ? 'text-right' : undefined}
                />
              ))}
              <th className="px-4 py-[10px]"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className={`transition-opacity duration-150 ${isSortPending ? 'opacity-50' : ''}`}>
            {orders.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
              </tr>
            )}
            {orders.map((o: any, idx: number) => (
              <tr
                key={o.id}
                ref={el => { rowRefs.current[idx] = el; }}
                tabIndex={0}
                aria-haspopup="dialog"
                onClick={() => open(idx)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); } }}
                className={cn(
                  'group cursor-pointer border-t border-hair transition-colors duration-100 first:border-t-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                  picked.has(o.id) ? 'bg-primary-wash' : 'hover:bg-surface-hover focus-visible:bg-surface-hover',
                )}
              >
                <td className={cn(cell, 'w-10 pr-0')} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                  <Checkbox aria-label={`Select ${o.orderName}`} checked={picked.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                </td>
                <td className={cell}>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[0.8125rem] text-ink">
                    {o.orderName}
                    {orderWarnings.has(o.id) && <WarningIcon message={orderWarnings.get(o.id)!} />}
                    {/* Compact keeps every row to one line: customer and store move beside the number. */}
                    {compact && <span className="font-sans text-xs text-muted">{[o.customer?.name, o.storeLabel].filter(Boolean).join(' · ')}</span>}
                  </span>
                  {!compact && <span className="block text-xs text-muted">{[o.customer?.name, o.storeLabel].filter(Boolean).join(' · ')}</span>}
                </td>
                <td className={cell}><StatusPill tone={STATUS_TONE[o.status] ?? 'neutral'}>{o.statusLabel}</StatusPill></td>
                <td className={cell}>
                  {o.paymentStatus
                    ? <StatusPill tone={PAYMENT_TONE[o.paymentStatus] ?? 'neutral'}>{humanize(o.paymentStatus)}</StatusPill>
                    : <span className="text-sm text-muted">—</span>}
                </td>
                <td className={cn(cell, 'whitespace-nowrap text-right tabular-nums text-ink')}>{money(o.total)}</td>
                <td className={cn(cell, 'whitespace-nowrap text-muted')}>{o.lineItemCount != null ? `${o.lineItemCount} item${o.lineItemCount !== 1 ? 's' : ''}` : '—'}</td>
                <td className={cn(cell, 'text-muted')}>{o.deliveryMethod ?? '—'}</td>
                <td className={cn(cell, 'whitespace-nowrap font-mono text-[0.8125rem] text-muted')}>{fwNo(o) ?? '—'}</td>
                <td className={cn(cell, 'whitespace-nowrap tabular-nums text-muted')}>{sydney(o.createdAt)}</td>
                {/* Shown on hover/focus with a mouse; always shown on touch screens, which have no hover. */}
                <td className={cn(cell, 'whitespace-nowrap text-right')}>
                  <span className="opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                    {o.status === 'failed' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={retrying === o.id}
                        onClick={e => { e.stopPropagation(); retry(o.id); }}
                        onKeyDown={e => e.stopPropagation()}
                        aria-label={`Retry ${o.orderName}`}
                      >
                        {retrying === o.id ? 'Retrying…' : 'Retry'}
                      </Button>
                    ) : (
                      <span className="text-xs text-primary">Details ›</span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={order != null} onOpenChange={o => { if (!o) setOpenIdx(null); }}>
        {order && (
          <DialogContent
            className="max-w-3xl"
            onKeyDown={e => {
              if (e.key === 'ArrowLeft') step(-1);
              if (e.key === 'ArrowRight') step(1);
            }}
            // Back to the row you ended on, not the one you opened.
            onCloseAutoFocus={e => { e.preventDefault(); if (openIdx != null) rowRefs.current[openIdx]?.focus(); }}
          >
            <DialogHeader>
              <p className="text-xs text-muted">{order.storeLabel}</p>
              <DialogTitle className="font-mono text-lg">{order.orderName}</DialogTitle>
              <DialogDescription asChild>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusPill tone={STATUS_TONE[order.status] ?? 'neutral'}>{order.statusLabel}</StatusPill>
                  {order.customer?.name && <span>{order.customer.name}</span>}
                  <span>· {sydney(order.createdAt, true)}</span>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div role="tablist" aria-label="Order details" className="flex gap-1 border-b border-frame px-6">
              {TABS.map(([t, label]) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    '-mb-px border-b-2 px-2.5 py-2 text-[0.8125rem] transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none',
                    tab === t ? 'border-primary font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {!loaded && tab !== 'summary' ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <TabContent order={order} tab={tab} />
              )}
            </div>

            <DialogFooter className="justify-between">
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => step(-1)} disabled={openIdx === 0} aria-label="Previous order">
                  <ChevronLeft />Previous
                </Button>
                <Button size="sm" variant="outline" onClick={() => step(1)} disabled={openIdx === orders.length - 1} aria-label="Next order">
                  Next<ChevronRight />
                </Button>
              </div>
              <div className="flex gap-2">
                {order.status === 'failed' && (
                  <Button size="sm" onClick={() => retry(order.id)} disabled={retrying === order.id}>
                    {retrying === order.id ? 'Retrying…' : 'Retry order'}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setOpenIdx(null)}>Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
