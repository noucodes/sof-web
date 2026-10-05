'use client';
import { useMemo, useState } from 'react';
import StatusPill from '@/components/StatusPill';

export type FrameworksStatus = 'active' | 'inactive' | 'missing';
type ShopifyStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
type Store = 'burdens' | 'bathroomhq' | 'plumbershq';
type StoreCell = { enabled: boolean | null; shopify: ShopifyStatus | null };
export type SkuRow = { sku: string; desc: string; frameworks: FrameworksStatus; stores?: Record<Store, StoreCell> };
type ShopifyOnly = { sku: string; title: string; status: ShopifyStatus };
export type ShopifyByStore = Partial<Record<Store, { error?: string; notInCatsy: ShopifyOnly[] }>>;

type Filter = 'all' | FrameworksStatus | 'notLive' | 'notEnabled' | 'shopifyOnly';

const FW_LABEL: Record<FrameworksStatus, string> = { active: 'Active', inactive: 'Inactive', missing: 'Not in Frameworks' };
const FW_TONE = { active: 'success', inactive: 'neutral', missing: 'failed' } as const;
const SHOP_LABEL: Record<ShopifyStatus, string> = { ACTIVE: 'Live', DRAFT: 'Draft', ARCHIVED: 'Archived' };

const STORES: { key: Store; label: string }[] = [
  { key: 'burdens', label: 'Burdens' },
  { key: 'bathroomhq', label: 'BHQ' },
  { key: 'plumbershq', label: 'PHQ' },
];

// Enabled for the store in Catsy but not live on its Shopify, or the reverse.
const notLive = (c?: StoreCell) => c?.enabled === true && c.shopify !== 'ACTIVE';
const notEnabled = (c?: StoreCell) => c?.enabled !== true && c?.shopify === 'ACTIVE';

const shopText = (c?: StoreCell) => (c?.shopify ? SHOP_LABEL[c.shopify] : 'Not listed');
const catsyText = (c?: StoreCell) => (c?.enabled === true ? 'on' : c?.enabled === false ? 'off' : '?');

// ponytail: renders the first 500 matches; search narrows it, CSV has everything.
const SHOWN = 500;

function downloadCsv(name: string, header: string[], lines: string[][]) {
  const esc = (v = '') => `"${v.replace(/"/g, '""')}"`;
  const csv = [header, ...lines].map(l => l.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `sku-audit-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SkuAuditLists({ rows, shopify }: { rows: SkuRow[]; shopify: ShopifyByStore }) {
  const [store, setStore] = useState<Store | ''>('');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const matches = (...fields: string[]) => !needle || fields.some(f => f.toLowerCase().includes(needle));

  const tabs = useMemo(() => {
    const t: { key: Filter; label: string; count: number }[] = [
      { key: 'all', label: 'All', count: rows.length },
      ...(['active', 'inactive', 'missing'] as const).map(k => ({
        key: k,
        label: FW_LABEL[k],
        count: rows.filter(r => r.frameworks === k).length,
      })),
    ];
    if (store) {
      t.push(
        { key: 'notLive', label: 'Enabled, not live', count: rows.filter(r => notLive(r.stores?.[store])).length },
        { key: 'notEnabled', label: 'Live, not enabled', count: rows.filter(r => notEnabled(r.stores?.[store])).length },
        { key: 'shopifyOnly', label: 'On Shopify, not in Catsy', count: shopify[store]?.notInCatsy.length ?? 0 },
      );
    }
    return t;
  }, [rows, shopify, store]);

  const filtered = useMemo(
    () =>
      rows.filter(r => {
        const cell = store ? r.stores?.[store] : undefined;
        const pass =
          filter === 'all' ||
          r.frameworks === filter ||
          (filter === 'notLive' && notLive(cell)) ||
          (filter === 'notEnabled' && notEnabled(cell));
        return pass && matches(r.sku, r.desc);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, store, filter, needle],
  );

  const shopifyOnly = useMemo(
    () => (store ? (shopify[store]?.notInCatsy ?? []).filter(v => matches(v.sku, v.title)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shopify, store, needle],
  );

  const showingShopifyOnly = filter === 'shopifyOnly' && !!store;
  const storeError = store ? shopify[store]?.error : undefined;

  function pickStore(s: Store | '') {
    setStore(s);
    if (!s && ['notLive', 'notEnabled', 'shopifyOnly'].includes(filter)) setFilter('all');
  }

  function download() {
    const name = [store, filter].filter(Boolean).join('-');
    if (showingShopifyOnly) {
      downloadCsv(name, ['sku', 'shopify_title', 'shopify_status'], shopifyOnly.map(v => [v.sku, v.title, SHOP_LABEL[v.status]]));
      return;
    }
    downloadCsv(
      name,
      ['sku', 'description', 'frameworks_status', ...STORES.flatMap(s => [`${s.key}_catsy_enabled`, `${s.key}_shopify`])],
      filtered.map(r => [
        r.sku,
        r.desc,
        FW_LABEL[r.frameworks],
        ...STORES.flatMap(s => [catsyText(r.stores?.[s.key]), shopText(r.stores?.[s.key])]),
      ]),
    );
  }

  const count = showingShopifyOnly ? shopifyOnly.length : filtered.length;

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-frame flex flex-wrap items-center gap-2">
        <select
          value={store}
          onChange={e => pickStore(e.target.value as Store | '')}
          aria-label="Store"
          className="text-sm border border-frame rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All stores</option>
          {STORES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg ${filter === t.key ? 'bg-surface-strong font-semibold text-ink' : 'text-muted hover:text-ink'}`}
          >
            {t.label} <span className="text-muted">({t.count.toLocaleString()})</span>
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
          <button onClick={download} className="text-sm border border-frame rounded-lg px-3 py-1.5 hover:bg-surface-hover">
            Download CSV
          </button>
        </div>
      </div>

      {storeError && (
        <p className="px-5 py-2 text-xs bg-failed-bg text-failed border-b border-hair">
          Couldn&apos;t read this store from Shopify on the last run: {storeError}
        </p>
      )}

      {showingShopifyOnly ? (
        <table className="w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted w-56">SKU</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted">Shopify product</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted w-32">Shopify status</th>
            </tr>
          </thead>
          <tbody>
            {shopifyOnly.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
              </tr>
            )}
            {shopifyOnly.slice(0, SHOWN).map(v => (
              <tr key={v.sku} className="border-t border-hair first:border-t-0 hover:bg-surface-hover">
                <td className="px-4 py-2 font-mono text-xs">{v.sku}</td>
                <td className="px-4 py-2 text-ink">{v.title}</td>
                <td className="px-4 py-2">
                  <StatusPill tone={v.status === 'ACTIVE' ? 'success' : 'neutral'}>{SHOP_LABEL[v.status]}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted w-48">SKU</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted">Frameworks description</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted w-40">Frameworks</th>
              {STORES.map(s => (
                <th key={s.key} className={`px-4 py-2.5 text-left font-medium w-32 ${store === s.key ? 'text-ink' : 'text-muted'}`}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3 + STORES.length} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
              </tr>
            )}
            {filtered.slice(0, SHOWN).map(r => (
              <tr key={r.sku} className="border-t border-hair first:border-t-0 hover:bg-surface-hover">
                <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
                <td className="px-4 py-2 text-ink">{r.desc || '—'}</td>
                <td className="px-4 py-2">
                  <StatusPill tone={FW_TONE[r.frameworks]}>{FW_LABEL[r.frameworks]}</StatusPill>
                </td>
                {STORES.map(s => {
                  const c = r.stores?.[s.key];
                  const mismatch = notLive(c) || notEnabled(c);
                  return (
                    <td key={s.key} className="px-4 py-2" title={`Catsy: ${catsyText(c)} · Shopify: ${shopText(c)}`}>
                      <StatusPill tone={mismatch ? 'failed' : c?.shopify === 'ACTIVE' ? 'success' : 'neutral'}>{shopText(c)}</StatusPill>
                      <span className="block text-[0.6875rem] text-muted mt-0.5">Catsy {catsyText(c)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {count > SHOWN && (
        <p className="px-5 py-3 text-xs text-muted border-t border-hair">
          Showing {SHOWN} of {count.toLocaleString()}. Search to narrow, or download the CSV for the full list.
        </p>
      )}
    </div>
  );
}
