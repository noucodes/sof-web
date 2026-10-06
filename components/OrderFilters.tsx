'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['all', 'pending', 'success', 'failed'];

// Passed as <SelectValue> children too: Radix only fills the trigger after
// hydration, so without it the server HTML renders a blank select.
const statusLabel = (s: string) => (s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1));

const STORE_LABELS: Record<string, string> = {
  all: 'All stores',
  burdens: 'Burdens',
  bathroomhq: 'BathroomHQ',
  plumbershq: 'PlumbersHQ',
  aspire: 'Aspire',
};

export default function OrderFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1');
    router.push(`/orders?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="flex gap-3 flex-wrap">
      <Input
        type="search"
        aria-label="Search orders"
        placeholder="Search orders…"
        defaultValue={params.get('search') ?? ''}
        onChange={e => update('search', e.target.value)}
        className="w-56"
      />

      <SkuSearch value={params.get('skus') ?? ''} onApply={v => update('skus', v)} />

      <Select defaultValue={params.get('status') ?? 'all'} onValueChange={v => update('status', v)}>
        <SelectTrigger aria-label="Status" className="w-40">
          <SelectValue>{statusLabel(params.get('status') ?? 'all')}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => (
            <SelectItem key={s} value={s}>
              {statusLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={params.get('store') ?? 'all'} onValueChange={v => update('store', v)}>
        <SelectTrigger aria-label="Store" className="w-40">
          <SelectValue>{STORE_LABELS[params.get('store') ?? 'all']}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STORE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Paste a column of SKUs (from a spreadsheet, an email, etc.) and see every order
// that has any of them. Kept in the URL as a comma list like the other filters.
function SkuSearch({ value, onApply }: { value: string; onApply: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const count = value ? value.split(',').length : 0;
  const parse = (t: string) => [...new Set(t.split(/[\s,;]+/).map(s => s.trim().toUpperCase()).filter(Boolean))];
  const pending = parse(text).length;

  function apply(list: string[]) {
    onApply(list.join(','));
    setOpen(false);
  }

  return (
    <>
      <Button variant={count ? 'secondary' : 'outline'} className="h-9" onClick={() => { setText(value.split(',').join('\n')); setOpen(true); }}>
        {count ? `${count} SKU${count === 1 ? '' : 's'}` : 'Search SKUs'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search by SKU</DialogTitle>
            <DialogDescription>Paste SKUs, one per line or separated by commas. Shows orders with any of them.</DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <textarea
              aria-label="SKUs"
              autoFocus
              rows={10}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'ABC123\nXYZ-456'}
              className="w-full rounded-lg border border-frame-input bg-white px-3 py-2 font-mono text-sm text-ink focus-visible:shadow-focus-ring focus-visible:outline-none"
            />
            <p className="mt-1 text-xs text-muted">{pending} SKU{pending === 1 ? '' : 's'}{pending > 500 ? ' · only the first 500 are searched' : ''}</p>
          </div>
          <DialogFooter>
            {count > 0 && <Button variant="ghost" onClick={() => apply([])}>Clear</Button>}
            <Button onClick={() => apply(parse(text))}>Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
