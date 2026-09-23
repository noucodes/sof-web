'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
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
    next.set(key, value);
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
