'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const STORE_LABELS: Record<string, string> = {
  all: 'All stores',
  burdens: 'Burdens',
  bathroomhq: 'BathroomHQ',
  plumbershq: 'PlumbersHQ',
  aspire: 'Aspire',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Synced only',
  all: 'All statuses',
  pending: 'Pending',
  failed: 'Failed',
};

const inputClass =
  'border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]';

export default function ContributionFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    router.push(`/contribution?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <select
        defaultValue={params.get('status') ?? 'success'}
        onChange={e => update('status', e.target.value)}
        className={inputClass}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
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

      <div className="flex items-center gap-2 text-sm text-muted">
        <input
          type="date"
          defaultValue={params.get('from') ?? ''}
          onChange={e => update('from', e.target.value)}
          className={inputClass}
        />
        <span>to</span>
        <input
          type="date"
          defaultValue={params.get('to') ?? ''}
          onChange={e => update('to', e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}
