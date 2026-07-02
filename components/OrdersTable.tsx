'use client';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
};

function JsonView({ data }: { data: string | null }) {
  if (!data) return <p className="text-sm text-muted">No data</p>;
  try {
    return (
      <pre className="text-xs text-ink bg-surface rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
        {JSON.stringify(JSON.parse(data), null, 2)}
      </pre>
    );
  } catch {
    return <pre className="text-xs text-ink bg-surface rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">{data}</pre>;
  }
}

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<'shopify' | 'frameworks'>('shopify');

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
              onClick={() => { setSelected(o); setTab('shopify'); }}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-frame">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">{selected.orderName}</p>
                <p className="text-xs text-muted mt-0.5">{selected.storeLabel} · {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-hover"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3">
              {(['shopify', 'frameworks'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-[120ms] ${
                    tab === t ? 'bg-primary-wash text-primary font-medium' : 'text-muted hover:text-ink hover:bg-surface-hover'
                  }`}
                >
                  {t === 'shopify' ? 'Shopify payload' : 'Frameworks payload'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-5 overflow-auto">
              <JsonView data={tab === 'shopify' ? selected.payload : selected.frameworksPayload} />
            </div>

            {selected.error && (
              <div className="px-5 pb-5">
                <p className="text-xs font-medium text-failed mb-1">Error</p>
                <p className="text-xs text-ink bg-failed-bg rounded-lg px-3 py-2">{selected.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
