'use client';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import StatusPill, { humanize } from '@/components/StatusPill';


type Entry = {
  status: 'success' | 'failed';
  source?: string;
  itemsSynced?: number;
  itemsFailed?: number;
  error?: string;
  finishedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })} ${d.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })}`;
}

const columns = (failedLabel: string) => [
  { key: 'status', label: 'Status', getValue: (h: Entry) => h.status },
  { key: 'source', label: 'Source', getValue: (h: Entry) => h.source ?? '' },
  { key: 'synced', label: 'Synced', getValue: (h: Entry) => h.itemsSynced ?? 0 },
  { key: 'unmatched', label: failedLabel, getValue: (h: Entry) => h.itemsFailed ?? 0 },
  { key: 'finished', label: 'Finished', getValue: (h: Entry) => (h.finishedAt ? new Date(h.finishedAt).getTime() : 0) },
  { key: 'error', label: 'Error', getValue: (h: Entry) => h.error ?? '' },
];

const GETTERS = Object.fromEntries(columns('').map(c => [c.key, c.getValue]));

export default function B2BSyncTable({ history, failedLabel = 'Unmatched' }: { history: Entry[]; failedLabel?: string }) {
  const COLUMNS = columns(failedLabel);
  const { sorted, sort, toggleSort } = useClientSort(history, GETTERS);

  return (
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
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 && (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted">No runs recorded yet</td>
          </tr>
        )}
        {sorted.map((h, i) => (
          <tr key={i} className={`border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100`}>
            <td className="px-4 py-3">
              <StatusPill tone={h.status === 'success' ? 'success' : h.status === 'failed' ? 'failed' : 'neutral'}>{humanize(h.status)}</StatusPill>
            </td>
            <td className="px-4 py-3 text-sm text-muted">{h.source ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-ink">{h.itemsSynced ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-ink">{h.itemsFailed ?? '—'}</td>
            <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{formatDate(h.finishedAt)}</td>
            <td className="px-4 py-3 text-[0.8125rem] text-failed max-w-[280px] truncate">{h.error ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
