'use client';
import { useMemo, useState } from 'react';
import { ListFilter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ponytail: shows the first 200 matches; type to narrow. Virtualise if vendors ever run to thousands.
const SHOWN = 200;

// Filter menu in the Vendor column header: tick one or more Frameworks Vendors
// (Catsy frameworks_supplier_name). '' stands for SKUs with no vendor set.
export default function SkuAuditVendorFilter({
  vendors,
  value,
  onChange,
}: {
  vendors: [string, number][];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState('');
  const active = value.length > 0;
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vendors.filter(([v]) => (v || 'no vendor').toLowerCase().includes(needle));
  }, [vendors, q]);
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <Popover onOpenChange={o => !o && setQ('')}>
      <PopoverTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Filter Vendor"
          className={`-ml-2 h-7 gap-1 px-2 font-medium ${active ? 'text-primary' : 'text-muted'}`}
        >
          Vendor{active && ` (${value.length})`}
          <ListFilter className={active ? 'text-primary' : undefined} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="relative border-b border-frame p-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search vendors" aria-label="Search vendors" className="h-8 pl-8 text-[0.8125rem]" />
        </div>
        <ul className="max-h-72 overflow-y-auto py-1" aria-label="Vendors">
          {matches.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-muted">
              {vendors.length ? 'No vendor matches' : 'Vendors show up after the next SKU audit run.'}
            </li>
          )}
          {matches.slice(0, SHOWN).map(([v, n]) => (
            <li key={v || '(none)'}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover">
                <Checkbox checked={value.includes(v)} onCheckedChange={() => toggle(v)} />
                <span className={`flex-1 truncate ${v ? 'text-ink' : 'italic text-muted'}`}>{v || 'No vendor set'}</span>
                <span className="text-xs tabular-nums text-muted">{n.toLocaleString()}</span>
              </label>
            </li>
          ))}
          {matches.length > SHOWN && (
            <li className="px-3 py-2 text-xs text-muted">{(matches.length - SHOWN).toLocaleString()} more. Type to narrow the list.</li>
          )}
        </ul>
        {active && (
          <div className="flex items-center justify-between border-t border-frame px-3 py-2 text-xs">
            <span className="text-muted">{value.length} selected</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onChange([])}>Clear</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
