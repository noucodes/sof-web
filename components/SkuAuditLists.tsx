'use client';
import { useMemo, useState } from 'react';
import StatusPill from '@/components/StatusPill';

export type FrameworksStatus = 'active' | 'inactive' | 'missing';
export type SkuRow = { sku: string; desc: string; frameworks: FrameworksStatus };
type Filter = 'all' | FrameworksStatus;

const LABEL: Record<FrameworksStatus, string> = { active: 'Active', inactive: 'Inactive', missing: 'Not in Frameworks' };
const TONE = { active: 'success', inactive: 'neutral', missing: 'failed' } as const;

const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'missing', label: 'Not in Frameworks' },
];

// ponytail: renders the first 500 matches; search narrows it, CSV has everything.
const SHOWN = 500;

function downloadCsv(name: string, rows: SkuRow[]) {
  const esc = (v = '') => `"${v.replace(/"/g, '""')}"`;
  const csv = ['sku,description,frameworks_status', ...rows.map(r => `${esc(r.sku)},${esc(r.desc)},${esc(LABEL[r.frameworks])}`)].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `catsy-skus-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SkuAuditLists({ rows }: { rows: SkuRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const c = { all: rows.length, active: 0, inactive: 0, missing: 0 };
    rows.forEach(r => c[r.frameworks]++);
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      r =>
        (filter === 'all' || r.frameworks === filter) &&
        (!needle || r.sku.toLowerCase().includes(needle) || r.desc.toLowerCase().includes(needle)),
    );
  }, [rows, filter, q]);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-frame flex flex-wrap items-center gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg ${filter === t.key ? 'bg-surface-strong font-semibold text-ink' : 'text-muted hover:text-ink'}`}
          >
            {t.label} <span className="text-muted">({counts[t.key].toLocaleString()})</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search SKU or description"
            aria-label="Search SKU or description"
            className="text-sm border border-frame rounded-lg px-3 py-1.5 w-60"
          />
          <button
            onClick={() => downloadCsv(filter, filtered)}
            className="text-sm border border-frame rounded-lg px-3 py-1.5 hover:bg-surface-hover"
          >
            Download CSV
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-surface-strong border-b border-frame">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-muted w-56">SKU</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted">Frameworks description</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted w-48">Frameworks status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
            </tr>
          )}
          {filtered.slice(0, SHOWN).map(r => (
            <tr key={r.sku} className="border-t border-hair first:border-t-0 hover:bg-surface-hover">
              <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
              <td className="px-4 py-2 text-ink">{r.desc || '—'}</td>
              <td className="px-4 py-2">
                <StatusPill tone={TONE[r.frameworks]}>{LABEL[r.frameworks]}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length > SHOWN && (
        <p className="px-5 py-3 text-xs text-muted border-t border-hair">
          Showing {SHOWN} of {filtered.length.toLocaleString()}. Search to narrow, or download the CSV for the full list.
        </p>
      )}
    </div>
  );
}
