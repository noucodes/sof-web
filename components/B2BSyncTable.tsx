'use client';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import SortSelect from '@/components/table/SortSelect';
import StatusPill, { humanize } from '@/components/StatusPill';
import RowSheet from '@/components/RowSheet';


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

const COLUMNS = [
  { key: 'status', label: 'Status', getValue: (h: Entry) => h.status },
  { key: 'source', label: 'Source', getValue: (h: Entry) => h.source ?? '' },
  { key: 'synced', label: 'Synced', kind: 'number' as const, getValue: (h: Entry) => h.itemsSynced ?? 0 },
  { key: 'unmatched', label: 'Unmatched', kind: 'number' as const, getValue: (h: Entry) => h.itemsFailed ?? 0 },
  { key: 'finished', label: 'Finished', kind: 'date' as const, getValue: (h: Entry) => (h.finishedAt ? new Date(h.finishedAt).getTime() : 0) },
  { key: 'error', label: 'Error', getValue: (h: Entry) => h.error ?? '' },
];

const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function B2BSyncTable({ history }: { history: Entry[] }) {
  const { sorted, sort, toggleSort, setSort } = useClientSort(history, GETTERS);

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
            <td data-label="Status" data-key className="px-4 py-3">
              <StatusPill tone={h.status === 'success' ? 'success' : h.status === 'failed' ? 'failed' : 'neutral'}>{humanize(h.status)}</StatusPill>
            </td>
            <td data-label="Source" className="px-4 py-3 text-sm text-muted">{h.source ?? '—'}</td>
            <td data-label="Synced" data-key="labelled" className="px-4 py-3 text-sm text-ink">{h.itemsSynced ?? '—'}</td>
            <td data-label="Unmatched" className="px-4 py-3 text-sm text-ink">{h.itemsFailed ?? '—'}</td>
            <td data-primary className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{formatDate(h.finishedAt)}</td>
            {/* Phones: only a real error gets a line, wrapped in full. */}
            <td data-hide={h.error ? undefined : true} className="px-4 py-3 text-[0.8125rem] text-failed max-w-[280px] truncate">{h.error ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </RowSheet>
    </>
  );
}
