'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const STATUSES = ['all', 'pending', 'success', 'failed'];

const STORE_LABELS: Record<string, string> = {
  all: 'All stores',
  burdens: 'Burdens',
  bathroomhq: 'BathroomHQ',
  plumbershq: 'PlumbersHQ',
  aspire: 'Aspire',
};

const inputClass =
  'border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]';

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
        placeholder="Search orders…"
        defaultValue={params.get('search') ?? ''}
        onChange={e => update('search', e.target.value)}
        className={`${inputClass} w-56`}
      />

      <select
        defaultValue={params.get('status') ?? 'all'}
        onChange={e => update('status', e.target.value)}
        className={inputClass}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>
            {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        defaultValue={params.get('store') ?? 'all'}
        onChange={e => update('store', e.target.value)}
        className={inputClass}
      >
        {Object.entries(STORE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
