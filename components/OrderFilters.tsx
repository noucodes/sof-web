'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const STATUSES = ['all', 'pending', 'success', 'failed'];
const STORES = ['all', 'burdens', 'bathroomhq', 'plumbershq', 'aspire'];

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
      <input
        type="search"
        placeholder="Search orders..."
        defaultValue={params.get('search') ?? ''}
        onChange={e => update('search', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        defaultValue={params.get('status') ?? 'all'}
        onChange={e => update('status', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
      <select
        defaultValue={params.get('store') ?? 'all'}
        onChange={e => update('store', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STORES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
    </div>
  );
}
