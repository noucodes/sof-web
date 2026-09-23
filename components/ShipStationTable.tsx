'use client';
import { useState } from 'react';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import { KebabIcon } from '@/components/table/icons';
import { JsonView } from '@/components/OrdersTable';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
};

const COLUMNS = [
  { key: 'shipmentId', label: 'Shipment ID', getValue: (j: any) => j.shipmentId ?? '' },
  { key: 'order', label: 'Order', getValue: (j: any) => j.orderNumber ?? '' },
  { key: 'shipTo', label: 'Ship To', getValue: (j: any) => j.shipTo ?? '' },
  { key: 'carrier', label: 'Carrier', getValue: (j: any) => j.carrier ?? '' },
  { key: 'tracking', label: 'Tracking', getValue: (j: any) => j.trackingNumber ?? '' },
  { key: 'status', label: 'Status', getValue: (j: any) => j.statusLabel ?? '' },
  { key: 'attempts', label: 'Attempts', getValue: (j: any) => j.attempts ?? 0 },
  { key: 'date', label: 'Date', getValue: (j: any) => new Date(j.createdAt).getTime() },
];

const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function ShipStationTable({ jobs }: { jobs: any[] }) {
  const { sorted, sort, toggleSort } = useClientSort(jobs, GETTERS);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);

  // fixed (not absolute) so the menu isn't clipped by the card's overflow-hidden — same as OrdersTable.
  function toggleActionMenu(id: number, button: HTMLElement) {
    if (actionMenuId === id) {
      setActionMenuId(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    setActionMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
    setActionMenuId(id);
  }

  async function openJob(j: any) {
    setActionMenuId(null);
    setLoading(true);
    setSelected(j);
    try {
      const res = await fetch(`/api/jobs/${j.id}`);
      if (res.ok) setSelected(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {actionMenuId !== null && <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />}
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-frame">
          <tr>
            {COLUMNS.map(col => (
              <SortableTh
                key={col.key}
                label={col.label}
                direction={sort?.key === col.key ? sort.dir : null}
                onClick={() => toggleSort(col.key)}
              />
            ))}
            <th className="text-left px-4 py-[10px] text-xs font-medium text-muted whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-frame">
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-sm text-muted">No jobs found</td>
            </tr>
          )}
          {sorted.map((j: any, idx: number) => (
            <tr key={j.id} className={`${idx % 2 === 1 ? 'bg-surface/40' : 'bg-white'} hover:bg-surface-hover transition-colors duration-100`}>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.shipmentId}</td>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">
                {j.orderNumber ?? '—'}
                {j.linkedOrder?.orderNo && <span className="text-muted ml-1">→ FW {j.linkedOrder.orderNo}</span>}
              </td>
              <td className="px-4 py-3 text-sm text-ink">{j.shipTo ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-muted">{j.carrier ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.trackingNumber ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[j.status] ?? 'bg-surface text-muted'}`}>
                  {j.statusLabel}
                </span>
                {j.error && <p className="text-[0.7rem] text-failed mt-0.5 max-w-[200px] truncate">{j.error}</p>}
              </td>
              <td className="px-4 py-3 text-sm text-muted text-center">{j.attempts}</td>
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{new Date(j.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <button
                  onClick={e => toggleActionMenu(j.id, e.currentTarget)}
                  aria-label={`Actions for shipment ${j.shipmentId}`}
                  className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors duration-100"
                >
                  <KebabIcon />
                </button>
                {actionMenuId === j.id && actionMenuPos && (
                  <div
                    className="fixed z-20 w-40 bg-white rounded-lg shadow-xl border border-frame py-1"
                    style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                  >
                    <button
                      onClick={() => openJob(j)}
                      className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-hover transition-colors duration-100"
                    >
                      View payload
                    </button>
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
                <p className="text-[0.9375rem] font-semibold text-ink">Shipment {selected.shipmentId}</p>
                <p className="text-xs text-muted mt-0.5">
                  {selected.orderNumber ?? '—'} · {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-hover">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-auto flex-1 space-y-2">
              <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Request — ShipStation shipment</p>
              {loading ? <p className="text-sm text-muted">Loading…</p> : <JsonView data={selected.payload} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
