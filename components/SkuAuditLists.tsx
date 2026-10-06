'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import SkuAuditColumnFilter, { type ColumnFilter } from '@/components/SkuAuditColumnFilter';
import SkuAuditVendorFilter from '@/components/SkuAuditVendorFilter';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type FrameworksStatus = 'active' | 'inactive' | 'missing';
type ShopifyStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
type Store = 'burdens' | 'bathroomhq' | 'plumbershq';
type StoreCell = { enabled: boolean | null; shopify: ShopifyStatus | null };
type SkuRow = {
  sku: string;
  title?: string; // Catsy current_title
  vendor?: string; // Catsy frameworks_supplier_name ("Frameworks Vendor")
  desc: string; // Frameworks description
  frameworks: FrameworksStatus;
  branches?: Record<string, string>;
  stores?: Record<Store, StoreCell>;
};
type ShopifyOnly = { sku: string; title: string; status: ShopifyStatus };

type Filter = 'all' | FrameworksStatus | 'notLive' | 'notEnabled' | 'shopifyOnly';

export type Counts = {
  frameworks: Record<'all' | FrameworksStatus, number>;
  stores: Record<Store, { notLive: number; notEnabled: number; shopifyOnly: number }>;
  vendors?: [string, number][]; // [vendor, SKU count]; missing on runs from before the Vendor column
};

// Keys are what sof-api stores; labels follow Frameworks' own branch types.
const FW_LABEL: Record<FrameworksStatus, string> = { active: 'Stocked', inactive: 'Non-stocked', missing: 'Not in Frameworks' };
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
  active: () => 'In Catsy and Stocked in at least one Frameworks branch (kept on the shelf).',
  inactive: () => 'In Catsy and in Frameworks, but not Stocked in any branch. Usually ordered in from the supplier when sold.',
  missing: () => 'In Catsy, but the SKU does not exist in Frameworks. Usually a typo or a deleted product.',
  notLive: s => `Switched on for ${s} in Catsy, but not live on the ${s} Shopify site (missing, draft or archived).`,
  notEnabled: s => `Live on the ${s} Shopify site, but switched off for ${s} in Catsy.`,
  shopifyOnly: s => `On the ${s} Shopify site, but not in Catsy at all, so Catsy can't update them.`,
};

// Same rules as sof-api (sku-diff.ts); only used to colour the store pills.
const notLive = (c?: StoreCell) => c?.enabled === true && c.shopify !== 'ACTIVE';
const notEnabled = (c?: StoreCell) => c?.enabled === false && c.shopify === 'ACTIVE';

// e.g. "8: Stocked · 20: Non-Stocked"
const branchText = (b?: Record<string, string>) =>
  b ? Object.entries(b).map(([id, type]) => `${id}: ${type || '?'}`).join(' · ') : '';

const shopText = (c?: StoreCell) => (c?.shopify ? SHOP_LABEL[c.shopify] : 'Not listed');
const catsyText = (c?: StoreCell) => (c?.enabled === true ? 'on' : c?.enabled === false ? 'off' : '?');

const PAGE = 500;

// Parses sof-api's export CSV (RFC 4180 quoting) back into rows, so Excel and copy
// reuse the same filtered rows as the CSV download.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') cell += text[++i];
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') (row.push(cell), (cell = ''));
    else if (ch === '\n') (row.push(cell), rows.push(row), (row = []), (cell = ''));
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) (row.push(cell), rows.push(row));
  return rows;
}

// Tabs/newlines inside a cell would break the pasted grid.
const toTsv = (rows: string[][]) => rows.map(r => r.map(c => c.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');

// Rows come from sof-api a page at a time (80k+ SKUs is too much for the browser);
// the counts for every tab arrive with the page summary.
export default function SkuAuditLists({
  runId,
  counts,
  shopifyErrors,
}: {
  runId: number;
  counts: Counts;
  shopifyErrors: Partial<Record<Store, string | null>>;
}) {
  const [store, setStore] = useState<Store | ''>('');
  const storeLabel = STORES.find(s => s.key === store)?.label ?? '';
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [cols, setCols] = useState<Partial<Record<Store, ColumnFilter>>>({});
  const [vendors, setVendors] = useState<string[]>([]);
  const colFilterCount = Object.values(cols).filter(f => f?.shopify || f?.catsy).length + (vendors.length ? 1 : 0);
  const [data, setData] = useState<{ total: number; rows: (SkuRow | ShopifyOnly)[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Wait for typing to pause before searching 80k rows on the server.
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ filter, q: search });
    if (store) p.set('store', store);
    for (const [s, f] of Object.entries(cols)) {
      if (f?.shopify) p.set(`${s}_shopify`, f.shopify);
      if (f?.catsy) p.set(`${s}_catsy`, f.catsy);
    }
    for (const v of vendors) p.append('vendor', v);
    return p.toString();
  }, [store, filter, search, cols, vendors]);

  useEffect(() => setOffset(0), [params]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/sku-audit/rows?${params}&offset=${offset}&limit=${PAGE}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => !cancelled && setData(d))
      .catch(() => !cancelled && setData({ total: 0, rows: [] }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params, offset, runId]);

  const tabs = useMemo(() => {
    const t: { key: Filter; label: string; count: number }[] = [
      { key: 'all', label: 'All', count: counts.frameworks.all },
      ...(['active', 'inactive', 'missing'] as const).map(k => ({ key: k, label: FW_LABEL[k], count: counts.frameworks[k] })),
    ];
    if (store) {
      const c = counts.stores[store];
      t.push(
        { key: 'notLive', label: 'Enabled, not live', count: c?.notLive ?? 0 },
        { key: 'notEnabled', label: 'Live, not enabled', count: c?.notEnabled ?? 0 },
        { key: 'shopifyOnly', label: 'On Shopify, not in Catsy', count: c?.shopifyOnly ?? 0 },
      );
    }
    return t;
  }, [counts, store]);

  const showingShopifyOnly = filter === 'shopifyOnly' && !!store;
  const storeError = store ? shopifyErrors[store] : undefined;
  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];

  const [exporting, setExporting] = useState(false);

  async function exportAs(kind: 'xlsx' | 'table' | 'skus') {
    setExporting(true);
    try {
      const res = await fetch(`/api/sku-audit/export?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const rows = parseCsv(await res.text());
      const n = rows.length - 1;
      if (kind === 'xlsx') {
        const name = res.headers.get('content-disposition')?.match(/filename="(.+)\.csv"/)?.[1] ?? 'sku-audit';
        const { default: writeExcelFile } = await import('write-excel-file/browser');
        await writeExcelFile(rows).toFile(`${name}.xlsx`);
      } else if (kind === 'table') {
        await navigator.clipboard.writeText(toTsv(rows));
        toast.success(`Copied ${n.toLocaleString()} rows. Paste into Excel or Sheets.`);
      } else {
        await navigator.clipboard.writeText(rows.slice(1).map(r => r[0]).join('\n'));
        toast.success(`Copied ${n.toLocaleString()} SKUs`);
      }
    } catch {
      toast.error(kind === 'xlsx' ? "Couldn't build the Excel file" : "Couldn't copy to the clipboard");
    } finally {
      setExporting(false);
    }
  }

  function pickStore(s: Store | '') {
    setStore(s);
    if (!s && ['notLive', 'notEnabled', 'shopifyOnly'].includes(filter)) setFilter('all');
  }

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
          {colFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setCols({}); setVendors([]); }} className="text-primary">
              <X />
              Clear column filters ({colFilterCount})
            </Button>
          )}
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search SKU, title or description"
            aria-label="Search SKU, title or description"
            className="h-8 w-60 text-[0.8125rem]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting}>
                <Download />
                {exporting ? 'Exporting…' : 'Export'}
                <ChevronDown className="text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem asChild>
                {/* Plain <a>: the server streams the CSV straight to disk. */}
                <a href={`/api/sku-audit/export?${params}`} download>
                  Download CSV
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportAs('xlsx')}>Download Excel</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => exportAs('table')}>Copy table</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportAs('skus')}>Copy SKUs only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
                </tr>
              )}
              {(rows as ShopifyOnly[]).map(v => (
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
                <th className="px-4 py-2.5 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-1.5 text-left font-medium text-muted w-44">
                  <SkuAuditVendorFilter vendors={counts.vendors ?? []} value={vendors} onChange={setVendors} />
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted w-40">Frameworks</th>
                {STORES.map(s => (
                  <th key={s.key} className={`px-4 py-1.5 text-left font-medium w-36 ${store === s.key ? 'text-ink' : 'text-muted'}`}>
                    <SkuAuditColumnFilter
                      label={s.label}
                      value={cols[s.key] ?? {}}
                      onChange={v => setCols(c => ({ ...c, [s.key]: v }))}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4 + STORES.length} className="px-4 py-10 text-center text-sm text-muted">Nothing here</td>
                </tr>
              )}
              {(rows as SkuRow[]).map(r => (
                <tr key={r.sku} className="border-t border-hair first:border-t-0 hover:bg-surface-hover">
                  <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
                  <td className="px-4 py-2 text-ink">
                    {/* Catsy's current_title; Frameworks' description underneath when it says something different. */}
                    {r.title || r.desc || '—'}
                    {r.title && r.desc && r.desc.toLowerCase() !== r.title.toLowerCase() && (
                      <span className="block text-[0.6875rem] text-muted mt-0.5">Frameworks: {r.desc}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink">{r.vendor ?? <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-2">
                    <StatusPill tone={FW_TONE[r.frameworks]}>{FW_LABEL[r.frameworks]}</StatusPill>
                    {r.branches && (
                      <span className="block text-[0.6875rem] text-muted mt-0.5">Branch {branchText(r.branches)}</span>
                    )}
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
      </div>

      {total > 0 && (
        <div className="px-5 py-3 flex items-center justify-between border-t border-hair text-xs text-muted">
          <span>
            {(offset + 1).toLocaleString()}–{Math.min(offset + PAGE, total).toLocaleString()} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(o => Math.max(0, o - PAGE))}>
              <ChevronLeft />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(o => o + PAGE)}>
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
