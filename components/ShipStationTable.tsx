'use client';
import { useState } from 'react';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import { MoreHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  async function openJob(j: any) {
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
      <table className="w-full text-sm">
        <thead className="bg-surface-strong border-b border-frame">
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
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-sm text-muted">No jobs found</td>
            </tr>
          )}
          {sorted.map((j: any, idx: number) => (
            <tr key={j.id} className={`${idx % 2 === 1 ? 'bg-surface' : 'bg-white'} hover:bg-surface-hover transition-colors duration-100`}>
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
              <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{new Date(j.createdAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted" aria-label={`Actions for shipment ${j.shipmentId}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={() => openJob(j)}>View payload</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  {selected.orderNumber ?? '—'} · {new Date(selected.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted" onClick={() => setSelected(null)} aria-label="Close">
                <X className="!size-5" />
              </Button>
            </div>
            <div className="p-5 overflow-auto flex-1 space-y-2">
              <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Request — ShipStation shipment</p>
              {loading ? <Skeleton className="h-48 w-full" /> : <JsonView data={selected.payload} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
