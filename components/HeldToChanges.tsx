'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, RefreshCw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/TableSkeleton';
import StatusPill, { type Tone } from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';

type Change = {
  id: number;
  userEmail: string | null;
  createdAt: string;
  params: { numTran: string; suffixTran: string; dateRequired: string; previous?: string | null; orderName: string | null; store: string | null };
  result: { ok: boolean; outcome: 'held' | 'released' | 'unchanged' | 'not_open' | 'failed'; error?: string };
};

const STORE_LABELS: Record<string, string> = { burdens: 'Burdens', bathroomhq: 'Bathroom HQ', plumbershq: 'Plumbers HQ', aspire: 'Aspire' };
const OUTCOME: Record<Change['result']['outcome'], [Tone, string]> = {
  held: ['success', 'Held until date'],
  released: ['success', 'Released from hold'],
  unchanged: ['neutral', 'No hold needed'],
  not_open: ['neutral', 'Not open in ShipStation'],
  failed: ['failed', 'Failed'],
};
const TH = 'text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';
const WINDOWS = [7, 30, 90];

// dateDelivReqd is a calendar date; read it as one, not a local-time instant.
const auDate = (ymd: string) => new Date(ymd + 'T00:00:00Z').toLocaleDateString('en-AU', { timeZone: 'UTC' });
const auDateTime = (iso: string) => new Date(iso).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' });

export default function HeldToChanges() {
  const canAct = useCanAct();
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Change[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/shipstation/held-to?days=${d}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not load Date Required changes');
      setRows(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  async function retry(row: Change) {
    setRetrying(row.id);
    try {
      const res = await fetch(`/api/jobs/shipstation/held-to/${row.id}/retry`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Retry failed');
      if (json.result?.ok) toast.success(`${row.params.orderName} updated in ShipStation`);
      else toast.error(json.result?.error ?? 'ShipStation did not accept the change');
      await load(days);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRetrying(null);
    }
  }

  // Only the newest change per Frameworks order can be retried; older ones are superseded.
  const latest = new Set<number>();
  const seen = new Set<string>();
  for (const r of rows ?? []) if (!seen.has(r.params.numTran)) { seen.add(r.params.numTran); latest.add(r.id); }
  const failed = (rows ?? []).filter(r => !r.result.ok && latest.has(r.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger aria-label="Changed within" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WINDOWS.map(d => <SelectItem key={d} value={String(d)}>Last {d} days</SelectItem>)}
          </SelectContent>
        </Select>
        {failed > 0 && (
          <span className="text-sm font-medium text-failed">{failed} change{failed === 1 ? '' : 's'} not applied in ShipStation</span>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => load(days)} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center shadow-card">
          <TriangleAlert className="size-5 text-failed" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">Couldn&apos;t load Date Required changes</p>
            <p className="text-xs text-muted">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => load(days)}>Try again</Button>
        </div>
      ) : loading && !rows ? (
        <TableSkeleton columns={5} />
      ) : (
        <div className={cn('overflow-hidden rounded-xl bg-white shadow-card transition-opacity', loading && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-frame bg-surface-strong">
                <tr>
                  <th className={TH}>Order</th>
                  <th className={TH}>Date required</th>
                  <th className={TH}>ShipStation</th>
                  <th className={TH}>Received</th>
                  <th className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                      No Date Required changes from Frameworks in the last {days} days.
                    </td>
                  </tr>
                )}
                {rows?.map(r => {
                  const [tone, label] = OUTCOME[r.result.outcome] ?? OUTCOME.failed;
                  const canRetry = canAct && !r.result.ok && latest.has(r.id);
                  return (
                    <tr key={r.id} className="border-t border-hair transition-colors duration-100 first:border-t-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[0.8125rem] text-ink">{r.params.orderName ?? '—'}</span>
                        <span className="block text-xs text-muted">
                          {[`FW ${r.params.numTran}-${r.params.suffixTran}`, STORE_LABELS[r.params.store ?? ''] ?? r.params.store].filter(Boolean).join(' · ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.8125rem]">
                        {r.params.previous && r.params.previous !== r.params.dateRequired && (
                          <>
                            <span className="text-muted line-through">{auDate(r.params.previous)}</span>
                            <ArrowRight aria-label="changed to" className="mx-1.5 inline size-3.5 text-muted" />
                          </>
                        )}
                        <span className="text-ink">{auDate(r.params.dateRequired)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={tone}>{label}</StatusPill>
                        {r.result.error && <span className="mt-1 block max-w-xs text-xs text-failed">{r.result.error}</span>}
                        {!r.result.ok && !latest.has(r.id) && <span className="mt-1 block text-xs text-muted">Superseded by a later change</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {auDateTime(r.createdAt)}
                        {r.userEmail && r.userEmail !== 'frameworks' && <span className="block text-xs">Retried by {r.userEmail}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {canRetry && (
                          <Button size="sm" variant="outline" onClick={() => retry(r)} disabled={retrying === r.id}>
                            <RefreshCw className={retrying === r.id ? 'animate-spin' : undefined} />
                            {retrying === r.id ? 'Retrying…' : 'Retry'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
