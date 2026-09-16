'use client';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';

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

  return (
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
        </tr>
      </thead>
      <tbody className="divide-y divide-frame">
        {sorted.length === 0 && (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted">No jobs found</td>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
