'use client';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KebabIcon } from '@/components/table/icons';
import SortableTh from '@/components/table/SortableTh';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
};

// Keys match sof-api's ORDER_SORT_KEYS — sorting happens server-side across
// the whole filtered dataset, not just the loaded page (see OrdersService.findAll).
const COLUMNS = [
  { key: 'order', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'store', label: 'Store' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Payment' },
  { key: 'items', label: 'Items' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'frameworks', label: 'Frameworks No.' },
  { key: 'created', label: 'Created' },
];

function JsonView({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  if (data == null) return <p className="text-sm text-muted italic">No data</p>;

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-[0.6875rem] font-medium rounded-md bg-white/80 text-muted hover:text-ink hover:bg-white transition-colors duration-150"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="text-xs text-ink bg-surface rounded-lg p-4 pr-16 overflow-auto max-h-[40vh] whitespace-pre-wrap break-words">
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

function TabContent({ order, tab }: { order: any; tab: string }) {
  if (tab === 'shopify') {
    return (
      <div className="space-y-4">
        <Section label="Request — Shopify webhook">
          <JsonView data={order.payload} />
        </Section>
      </div>
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

  if (tab === 'payment') {
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

  return null;
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
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [tab, setTab] = useState<'shopify' | 'frameworks' | 'payment'>('shopify');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

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
    router.push(`/orders?${next.toString()}`);
  }

  async function retryOrderRow(id: string) {
    setActionMenuId(null);
    const res = await fetch(`/api/orders/${id}/retry`, { method: 'POST' });
    if (res.ok) {
      toast.success('Order queued for retry');
      router.refresh();
    } else {
      toast.error('Retry failed');
    }
  }

  async function retry() {
    if (!selected) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/orders/${selected.id}/retry`, { method: 'POST' });
      if (res.ok) {
        setSelected((prev: any) => ({ ...prev, status: 'pending', statusLabel: 'Pending', error: null }));
      }
    } finally {
      setRetrying(false);
    }
  }

  async function openOrder(o: any) {
    setLoading(true);
    setSelected({ ...o, _loading: true });
    setTab('shopify');
    try {
      const res = await fetch(`/api/orders/${o.id}`);
      if (res.ok) setSelected(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {actionMenuId && <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />}
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-frame">
          <tr>
            {COLUMNS.map(col => (
              <SortableTh
                key={col.key}
                label={col.label}
                direction={activeSortBy === col.key ? activeSortDir : null}
                onClick={() => toggleSort(col.key)}
              />
            ))}
            <th className="text-left px-4 py-[10px] text-xs font-medium text-muted whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-frame">
          {orders.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
            </tr>
          )}
          {orders.map((o: any, idx: number) => (
            <tr
              key={o.id}
              className={`${idx % 2 === 1 ? 'bg-surface/40' : 'bg-white'} hover:bg-surface-hover transition-colors duration-100`}
            >
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">
                <span className="inline-flex items-center gap-1.5">
                  {o.orderName}
                  {orderWarnings.has(o.id) && <WarningIcon message={orderWarnings.get(o.id)!} />}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-ink">{o.customer?.name ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-muted">{o.storeLabel}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[o.status] ?? 'bg-surface text-muted'}`}>
                  {o.statusLabel}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-ink">{o.total ? `$${parseFloat(o.total).toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3">
                {o.paymentStatus
                  ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-pending-bg text-pending uppercase tracking-[0.05em]">{o.paymentStatus}</span>
                  : <span className="text-sm text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-sm text-muted">{o.lineItemCount != null ? `${o.lineItemCount} item${o.lineItemCount !== 1 ? 's' : ''}` : '—'}</td>
              <td className="px-4 py-3 text-sm text-muted">{o.deliveryMethod ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{o.frameworksOrderNo ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setActionMenuId(actionMenuId === o.id ? null : o.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors duration-100"
                >
                  <KebabIcon />
                </button>
                {actionMenuId === o.id && (
                  <div className="absolute right-4 top-10 z-20 w-40 bg-white rounded-lg shadow-xl border border-frame py-1">
                    <button
                      onClick={() => { setActionMenuId(null); openOrder(o); }}
                      className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-hover transition-colors duration-100"
                    >
                      View details
                    </button>
                    {o.status === 'failed' && (
                      <button
                        onClick={() => retryOrderRow(o.id)}
                        className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-hover transition-colors duration-100"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-frame">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">{selected.orderName}</p>
                <p className="text-xs text-muted mt-0.5">
                  {selected.storeLabel} · {new Date(selected.createdAt).toLocaleString()}
                  {selected.frameworksOrderNo && (
                    <> · <span className="text-ink">FW {selected.frameworksOrderNo}{selected.frameworksOrderSuffix ? `-${selected.frameworksOrderSuffix}` : ''}</span></>
                  )}
                </p>
              </div>
              {selected.status === 'failed' && (
                <button
                  onClick={retry}
                  disabled={retrying}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg disabled:opacity-50 transition-colors duration-150 mr-2"
                >
                  {retrying ? 'Retrying…' : 'Retry'}
                </button>
              )}
              <button onClick={() => setSelected(null)} className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-hover">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-1 px-5 pt-3 pb-3 border-b border-frame">
              {(['shopify', 'frameworks', 'payment'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-[120ms] ${tab === t ? 'bg-primary-wash text-primary font-medium' : 'text-muted hover:text-ink hover:bg-surface-hover'}`}
                >
                  {t === 'shopify' ? 'Shopify' : t === 'frameworks' ? 'Frameworks' : 'Payment'}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-auto flex-1">
              {loading ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <TabContent order={selected} tab={tab} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
