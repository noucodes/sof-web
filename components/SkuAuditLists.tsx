'use client';
import { useMemo, useState } from 'react';

export type SkuRow = { sku: string; desc?: string };
type Key = 'missingFromCatsy' | 'inactiveInCatsy' | 'notInFrameworks';

const TABS: { key: Key; label: string; hint: string }[] = [
  { key: 'missingFromCatsy', label: 'Missing from Catsy', hint: 'Stocked in at least one Frameworks branch, not in Catsy.' },
  { key: 'inactiveInCatsy', label: 'Inactive in Catsy', hint: 'In Catsy, but not stocked in any Frameworks branch.' },
  { key: 'notInFrameworks', label: 'Not in Frameworks', hint: 'In Catsy, but the SKU does not exist in Frameworks.' },
];

// ponytail: renders the first 500 matches; search narrows it, CSV has everything.
const SHOWN = 500;

function downloadCsv(name: string, rows: SkuRow[]) {
  const esc = (v = '') => `"${v.replace(/"/g, '""')}"`;
  const csv = ['sku,description', ...rows.map(r => `${esc(r.sku)},${esc(r.desc)}`)].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SkuAuditLists({ lists }: { lists: Record<Key, SkuRow[]> }) {
  const [tab, setTab] = useState<Key>('missingFromCatsy');
  const [q, setQ] = useState('');
  const current = TABS.find(t => t.key === tab)!;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = lists[tab];
    return needle ? rows.filter(r => r.sku.toLowerCase().includes(needle) || r.desc?.toLowerCase().includes(needle)) : rows;
  }, [lists, tab, q]);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-frame flex flex-wrap items-center gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg ${tab === t.key ? 'bg-surface-strong font-semibold text-ink' : 'text-muted hover:text-ink'}`}
          >
            {t.label} <span className="text-muted">({lists[t.key].length.toLocaleString()})</span>
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
            onClick={() => downloadCsv(tab, filtered)}
            className="text-sm border border-frame rounded-lg px-3 py-1.5 hover:bg-surface-hover"
          >
            Download CSV
          </button>
        </div>
      </div>
      <p className="px-5 py-2 text-xs text-muted border-b border-hair">{current.hint}</p>
      <table className="w-full text-sm">
        <thead className="bg-surface-strong border-b border-frame">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-muted w-56">SKU</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted">Description</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
            </tr>
          )}
          {filtered.slice(0, SHOWN).map(r => (
            <tr key={r.sku} className="border-t border-hair first:border-t-0 hover:bg-surface-hover">
              <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
              <td className="px-4 py-2 text-ink">{r.desc ?? '—'}</td>
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
