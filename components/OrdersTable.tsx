'use client';
import { useState } from 'react';

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

function TabContent({ order, tab, compareResult, comparing, onCompare }: {
  order: any;
  tab: string;
  compareResult: any;
  comparing: boolean;
  onCompare: () => void;
}) {
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

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Cross-check vs sof-main</p>
            <button
              onClick={onCompare}
              disabled={comparing}
              className="px-2.5 py-1 text-xs font-medium text-primary bg-primary-wash rounded-lg hover:bg-primary/10 disabled:opacity-50 transition-colors duration-[120ms]"
            >
              {comparing ? 'Comparing…' : 'Compare'}
            </button>
            {compareResult && !compareResult.sofMainError && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${compareResult.match ? 'bg-success-bg text-success' : 'bg-failed-bg text-failed'}`}>
                {compareResult.match ? '✓ Match' : `✗ ${compareResult.differences?.length ?? '?'} difference${compareResult.differences?.length === 1 ? '' : 's'}`}
              </span>
            )}
            {compareResult?.sofMainError && (
              <span className="text-xs text-failed">sof-main unreachable</span>
            )}
          </div>

          {compareResult && !compareResult.match && !compareResult.sofMainError && (
            <div className="space-y-3">
              {compareResult.differences?.length > 0 && (
                <div className="bg-failed-bg rounded-lg p-3">
                  <ul className="space-y-0.5">
                    {compareResult.differences.map((d: string, i: number) => (
                      <li key={i} className="text-xs font-mono text-failed">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] mb-1">sof-api</p>
                  <JsonView data={compareResult.sofApi} />
                </div>
                <div>
                  <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] mb-1">sof-main</p>
                  <JsonView data={compareResult.sofMain} />
                </div>
              </div>
            </div>
          )}
        </div>
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

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [tab, setTab] = useState<'shopify' | 'frameworks' | 'payment'>('shopify');
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [comparing, setComparing] = useState(false);

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
    setCompareResult(null);
    try {
      const res = await fetch(`/api/orders/${o.id}`);
      if (res.ok) setSelected(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    if (!selected) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const res = await fetch(`/api/orders/${selected.id}/compare`);
      const data = await res.json();
      setCompareResult(data);
    } finally {
      setComparing(false);
    }
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-frame">
          <tr>
            {['Order', 'Customer', 'Store', 'Status', 'Frameworks No.', 'Created'].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-frame">
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
            </tr>
          )}
          {orders.map((o: any) => (
            <tr
              key={o.id}
              onClick={() => openOrder(o)}
              className="hover:bg-surface-hover transition-colors duration-100 cursor-pointer"
            >
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{o.orderName}</td>
              <td className="px-4 py-3 text-sm text-ink">{o.customer?.name ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-muted">{o.storeLabel}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[o.status] ?? 'bg-surface text-muted'}`}>
                  {o.statusLabel}
                </span>
              </td>
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
            {/* Header */}
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

            {/* Tabs */}
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

            {/* Content */}
            <div className="p-5 overflow-auto flex-1">
              {loading ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <TabContent order={selected} tab={tab} compareResult={compareResult} comparing={comparing} onCompare={runCompare} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
