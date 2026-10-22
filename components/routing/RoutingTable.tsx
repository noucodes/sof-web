'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StatusPill from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';
import { DECIDABLE, actionLabel, actionSub, stateMeta, type RoutingOrder } from '@/lib/routing';
import { useRoutingAction } from './useRoutingAction';

// "1 of 2 lines at 20" style summary of where the stock is.
function stockSummary(o: RoutingOrder) {
  const lines = (o.lines ?? []).filter(l => !l.skip);
  if (!lines.length) return '—';
  const branches = new Set(lines.flatMap(l => Object.keys(l.available ?? {})));
  for (const b of branches) {
    if (lines.every(l => (l.available?.[b] ?? 0) >= l.qty)) return `All at branch ${b}`;
  }
  const at20 = lines.filter(l => (l.available?.['20'] ?? 0) >= l.qty).length;
  return at20 ? `${at20} of ${lines.length} lines at branch 20` : 'No branch has all lines';
}

export default function RoutingTable({ rows }: { rows: RoutingOrder[] }) {
  const canAct = useCanAct();
  const { run, isBusy } = useRoutingAction();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState(false);

  const approvable = rows.filter(r => DECIDABLE.includes(r.state) && r.action);
  const toggle = (id: number) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function approveSelected() {
    setBulk(true);
    let ok = 0;
    for (const id of picked) if (await run(id, 'approve')) ok++;
    setBulk(false);
    setPicked(new Set());
    if (ok) toast.success(`${ok} order${ok === 1 ? '' : 's'} approved`);
  }

  if (!rows.length) {
    return <p className="rounded-lg bg-white py-16 text-center text-sm text-muted shadow-card">No orders here.</p>;
  }

  return (
    <div className="space-y-3">
      {canAct && approvable.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-[0.8125rem] text-muted">{picked.size} selected</span>
          <Button size="sm" disabled={!picked.size || bulk} onClick={approveSelected}>
            {bulk && <Loader2 className="animate-spin" />}
            Approve selected
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-card">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
              {canAct && <th scope="col" className="w-8 border-b border-frame py-2.5 pl-4"><span className="sr-only">Select</span></th>}
              {['Order', 'Customer', 'Lines', 'Brand', 'Stock found', 'Proposed action', 'Flags', 'State', ''].map((h, i) => (
                <th key={i} scope="col" className="border-b border-frame px-4 py-2.5">{h || <span className="sr-only">Actions</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(o => {
              const meta = stateMeta(o.state);
              const decidable = DECIDABLE.includes(o.state) && !!o.action;
              return (
                <tr key={o.id} className="border-b border-hair align-top last:border-0 hover:bg-surface-hover">
                  {canAct && (
                    <td className="py-3 pl-4">
                      {decidable && (
                        <input type="checkbox" checked={picked.has(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.customerOrderNo ?? o.orderNo}`} className="size-4 accent-[var(--color-primary)]" />
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/order-routing/${o.id}`} className="font-mono text-[0.8125rem] font-medium text-primary hover:underline">{o.customerOrderNo ?? o.orderNo}</Link>
                    <div className="font-mono text-xs text-muted">SO {o.orderNo}</div>
                  </td>
                  <td className="px-4 py-3">{o.customerName ?? '—'}<div className="text-xs text-muted">{o.despatchMethod}</div></td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem]">{(o.lines ?? []).filter(l => !l.skip).length}</td>
                  <td className="px-4 py-3">{o.brand ?? '—'}</td>
                  <td className="px-4 py-3">{stockSummary(o)}</td>
                  <td className="px-4 py-3"><div className="font-medium">{o.action ? actionLabel(o.action) : o.state === 'on_hold' ? 'Left unchanged' : 'No action proposed'}</div><div className="text-xs text-muted">{actionSub(o)}</div></td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {(o.flags ?? []).map(f => <span key={f} className="rounded-md bg-pending-bg px-2 py-px text-xs text-pending">{f}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    {(o.error || o.holdReason) && <div className="mt-1 max-w-[200px] text-xs text-muted">{o.error ?? o.holdReason}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    {canAct && decidable && (
                      <Button size="sm" disabled={isBusy(o.id, 'approve')} onClick={() => run(o.id, 'approve', {}, `${o.customerOrderNo ?? o.orderNo} approved`)}>
                        {isBusy(o.id, 'approve') && <Loader2 className="animate-spin" />}Approve
                      </Button>
                    )}
                    {canAct && o.state === 'failed' && (
                      <Button size="sm" variant="outline" disabled={isBusy(o.id, 'retry')} onClick={() => run(o.id, 'retry', {}, 'Queued to run again')}>Retry</Button>
                    )}
                    <Link href={`/order-routing/${o.id}`} className="ml-2 text-[0.8125rem] text-primary hover:underline">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
