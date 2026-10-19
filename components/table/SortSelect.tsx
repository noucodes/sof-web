'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortColumn = { key: string; label: string; kind?: 'text' | 'number' | 'date' };
export type Sort = { key: string; dir: 'asc' | 'desc' } | null;

// [asc, desc] wording per kind; dates and numbers list their usual pick first.
const WORDS = { text: ['A–Z', 'Z–A'], number: ['lowest first', 'highest first'], date: ['oldest first', 'newest first'] };

// Phones show tables as lists with no header row, so this dropdown stands in
// for clicking a column heading. Controlled (value + onChange) for tables
// sorted in the browser, or pass basePath to sort through the URL's
// sortBy/sortDir, as Orders and Payments do.
export default function SortSelect({ columns, value, onChange, basePath }: {
  columns: SortColumn[];
  value?: Sort;
  onChange?: (s: Sort) => void;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current: Sort = basePath
    ? (params.get('sortBy') ? { key: params.get('sortBy')!, dir: params.get('sortDir') === 'desc' ? 'desc' : 'asc' } : null)
    : value ?? null;

  const options = [{ value: 'none', label: 'Default order' }];
  for (const c of columns) {
    const [asc, desc] = WORDS[c.kind ?? 'text'];
    const pair = [{ value: `${c.key}:asc`, label: `${c.label}, ${asc}` }, { value: `${c.key}:desc`, label: `${c.label}, ${desc}` }];
    options.push(...(c.kind === 'text' || !c.kind ? pair : pair.reverse()));
  }
  const selected = current ? `${current.key}:${current.dir}` : 'none';

  function pick(v: string) {
    const [key, dir] = v.split(':') as [string, 'asc' | 'desc'];
    const next: Sort = v === 'none' ? null : { key, dir };
    if (!basePath) return onChange?.(next);
    const qs = new URLSearchParams(params.toString());
    if (next) { qs.set('sortBy', next.key); qs.set('sortDir', next.dir); } else { qs.delete('sortBy'); qs.delete('sortDir'); }
    qs.set('page', '1');
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 border-b border-frame px-4 py-2 md:hidden">
      <span className="text-xs text-muted">Sort</span>
      <Select value={selected} onValueChange={pick}>
        <SelectTrigger aria-label="Sort by" className="h-9 min-w-0 flex-1 text-[0.8125rem]">
          <SelectValue>{options.find(o => o.value === selected)?.label ?? 'Default order'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
