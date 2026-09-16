'use client';
import { useMemo, useState } from 'react';

// ponytail: page-scoped sort (whatever rows are already loaded) — fine for
// tables with no backend sort support. Orders/Payments sort server-side
// instead since that needs to cover the whole dataset, not just one page.
export function useClientSort<T>(rows: T[], getters: Record<string, (row: T) => string | number>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const getValue = getters[sort.key];
    if (!getValue) return rows;
    return [...rows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sort, getters]);

  function toggleSort(key: string) {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }

  return { sorted, sort, toggleSort };
}
