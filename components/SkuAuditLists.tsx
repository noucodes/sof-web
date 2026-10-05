'use client';
import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// One-line explanation under the tabs, so the current view reads on its own.
const HINTS: Record<Filter, (store: string) => string> = {
  all: s => (s ? `Every Catsy SKU, with its ${s} Shopify status highlighted.` : 'Every SKU in Catsy, with its Frameworks status and its status on each Shopify store.'),
  active: () => 'In Catsy and stocked in at least one Frameworks branch.',
  inactive: () => 'In Catsy and in Frameworks, but not stocked in any branch. Candidates to retire.',
  missing: () => 'In Catsy, but the SKU does not exist in Frameworks. Usually a typo or a deleted product.',
  notLive: s => `Switched on for ${s} in Catsy, but not live on the ${s} Shopify site (missing, draft or archived).`,
  notEnabled: s => `Live on the ${s} Shopify site, but switched off for ${s} in Catsy.`,
  shopifyOnly: s => `On the ${s} Shopify site, but not in Catsy at all, so Catsy can't update them.`,
};

// Enabled for the store in Catsy but not live on its Shopify, or the reverse.
const notLive = (c?: StoreCell) => c?.enabled === true && c.shopify !== 'ACTIVE';
// An unknown flag (?) isn't a mismatch: the saved Catsy query just doesn't return it.
const notEnabled = (c?: StoreCell) => c?.enabled === false && c.shopify === 'ACTIVE';

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
  const storeLabel = STORES.find(s => s.key === store)?.label ?? '';
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
      <div className="px-5 pt-3 pb-2 flex flex-wrap items-center gap-2">
        {/* Radix Select can't hold an empty value, so 'all' stands for no store. */}
        <Select value={store || 'all'} onValueChange={v => pickStore(v === 'all' ? '' : (v as Store))}>
          <SelectTrigger aria-label="Store" className="h-8 w-40 text-[0.8125rem]">
            <SelectValue>{store ? `Store: ${storeLabel}` : 'All stores'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            {STORES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search SKU or description"
            aria-label="Search SKU or description"
            className="h-8 w-60 text-[0.8125rem]"
          />
          <Button variant="outline" size="sm" onClick={download}>
            <Download />
            Download CSV
          </Button>
        </div>
      </div>
      <div className="px-4 pb-2 border-b border-frame flex flex-wrap items-center gap-1">
        {tabs.map(t => (
          <Button
            key={t.key}
            size="sm"
            variant={filter === t.key ? 'secondary' : 'ghost'}
            onClick={() => setFilter(t.key)}
            className={filter === t.key ? 'font-semibold' : 'text-muted'}
          >
            {t.label} <span className="text-muted font-normal">({t.count.toLocaleString()})</span>
          </Button>
        ))}
      </div>

      <p className="px-5 py-2 text-xs text-muted border-b border-hair">{HINTS[filter](storeLabel)}</p>

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
