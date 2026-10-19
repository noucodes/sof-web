'use client';
import { useState } from 'react';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import SortSelect from '@/components/table/SortSelect';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JsonView, STATUS_TONE } from '@/components/OrdersTable';
import StatusPill from '@/components/StatusPill';
import RowSheet from '@/components/RowSheet';


const COLUMNS = [
  { key: 'shipmentId', label: 'Shipment ID', getValue: (j: any) => j.shipmentId ?? '' },
  { key: 'order', label: 'Order', getValue: (j: any) => j.orderNumber ?? '' },
  { key: 'shipTo', label: 'Ship To', getValue: (j: any) => j.shipTo ?? '' },
  { key: 'carrier', label: 'Carrier', getValue: (j: any) => j.carrier ?? '' },
  { key: 'tracking', label: 'Tracking', getValue: (j: any) => j.trackingNumber ?? '' },
  { key: 'status', label: 'Status', getValue: (j: any) => j.statusLabel ?? '' },
  { key: 'attempts', label: 'Attempts', kind: 'number' as const, getValue: (j: any) => j.attempts ?? 0 },
  { key: 'date', label: 'Date', kind: 'date' as const, getValue: (j: any) => new Date(j.createdAt).getTime() },
];

const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function ShipStationTable({ jobs }: { jobs: any[] }) {
  const { sorted, sort, toggleSort, setSort } = useClientSort(jobs, GETTERS);
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
      <SortSelect columns={COLUMNS} value={sort} onChange={setSort} />
      <RowSheet>
      <table data-compact className="stack-table w-full text-sm">
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
            <tr key={j.id} className={`border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100`}>
              <td data-label="Shipment ID" className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.shipmentId}</td>
              <td data-primary className="px-4 py-3 font-mono text-[0.8125rem] text-ink">
                {j.orderNumber ?? '—'}
                {j.linkedOrder?.orderNo && <span className="text-muted ml-1">→ FW {j.linkedOrder.orderNo}</span>}
              </td>
              <td data-label="Ship to" className="px-4 py-3 text-sm text-ink">{j.shipTo ?? '—'}</td>
              <td data-label="Carrier" className="px-4 py-3 text-sm text-muted">{j.carrier ?? '—'}</td>
              <td data-label="Tracking" className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.trackingNumber ?? '—'}</td>
              <td data-label="Status" data-key className="px-4 py-3">
                <StatusPill tone={STATUS_TONE[j.status] ?? 'neutral'}>{j.statusLabel}</StatusPill>
                {j.error && <p className="text-[0.7rem] text-failed mt-0.5 max-w-[200px] truncate">{j.error}</p>}
              </td>
              <td data-label="Attempts" className="px-4 py-3 text-sm text-muted text-center">{j.attempts}</td>
              <td data-label="Date" data-key className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{new Date(j.createdAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}</td>
              <td data-select className="px-4 py-3">
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
      </RowSheet>

      <Dialog open={selected != null} onOpenChange={o => { if (!o) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shipment {selected.shipmentId}</DialogTitle>
              <DialogDescription>
                {selected.orderNumber ?? '—'} · {new Date(selected.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-6">
              <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Request — ShipStation shipment</p>
              {loading ? <Skeleton className="h-48 w-full" /> : <JsonView data={selected.payload} />}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
