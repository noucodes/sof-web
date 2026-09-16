'use client';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
};

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
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

const COLUMNS = [
  { key: 'status', label: 'Status', getValue: (h: Entry) => h.status },
  { key: 'source', label: 'Source', getValue: (h: Entry) => h.source ?? '' },
  { key: 'synced', label: 'Synced', getValue: (h: Entry) => h.itemsSynced ?? 0 },
  { key: 'unmatched', label: 'Unmatched', getValue: (h: Entry) => h.itemsFailed ?? 0 },
  { key: 'finished', label: 'Finished', getValue: (h: Entry) => (h.finishedAt ? new Date(h.finishedAt).getTime() : 0) },
  { key: 'error', label: 'Error', getValue: (h: Entry) => h.error ?? '' },
];

const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function B2BSyncTable({ history }: { history: Entry[] }) {
  const { sorted, sort, toggleSort } = useClientSort(history, GETTERS);

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
            <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted">No runs recorded yet</td>
          </tr>
        )}
        {sorted.map((h, i) => (
          <tr key={i} className={`${i % 2 === 1 ? 'bg-surface/40' : 'bg-white'} hover:bg-surface-hover transition-colors duration-100`}>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[h.status] ?? 'bg-surface text-muted'}`}>
                {h.status}
              </span>
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
