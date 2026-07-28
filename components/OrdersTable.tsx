'use client';
import { useMemo, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
};

function JsonView({ data }: { data: any }) {
  if (data == null) return <p className="text-sm text-muted italic">No data</p>;
  return (
    <pre className="text-xs text-ink bg-surface rounded-lg p-4 overflow-auto max-h-[40vh] whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
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

// ponytail: sequence check only covers orders currently loaded (one page, current filters) —
// a real gap/duplicate audit across full history would need a backend endpoint.
function findOrderWarnings(orders: any[]) {
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
    list.sort((a, b) => a.num - b.num);

    const byNum = new Map<number, string[]>();
    for (const { num, id } of list) byNum.set(num, [...(byNum.get(num) ?? []), id]);
    for (const ids of byNum.values()) {
      if (ids.length > 1) for (const id of ids) warnings.set(id, 'Duplicate order number');
    }

    for (let i = 1; i < list.length; i++) {
      const diff = list[i].num - list[i - 1].num;
      if (diff > 1 && !warnings.has(list[i].id)) {
        const missing = diff - 1;
        const range = missing > 1 ? `#${list[i - 1].num + 1}–#${list[i].num - 1}` : `#${list[i - 1].num + 1}`;
        warnings.set(list[i].id, `Gap in order numbers: ${range} missing`);
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

export default function OrdersTable({ orders }: { orders: any[] }) {
  const orderWarnings = useMemo(() => findOrderWarnings(orders), [orders]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [tab, setTab] = useState<'shopify' | 'frameworks' | 'payment'>('shopify');

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
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-frame">
          <tr>
            {['Order', 'Customer', 'Store', 'Status', 'Total', 'Payment', 'Items', 'Delivery', 'Frameworks No.', 'Created'].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-frame">
          {orders.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
            </tr>
          )}
          {orders.map((o: any) => (
            <tr
              key={o.id}
              onClick={() => openOrder(o)}
              className="hover:bg-surface-hover transition-colors duration-100 cursor-pointer"
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
