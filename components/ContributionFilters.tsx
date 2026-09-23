'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function ContributionFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.set('page', '1');
    router.push(`/contribution?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <Select defaultValue={params.get('status') ?? 'success'} onValueChange={v => update({ status: v })}>
        <SelectTrigger aria-label="Status" className="w-40">
          <SelectValue>{STATUS_LABELS[params.get('status') ?? 'success']}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={params.get('store') ?? 'all'} onValueChange={v => update({ store: v })}>
        <SelectTrigger aria-label="Store" className="w-40">
          <SelectValue>{STORE_LABELS[params.get('store') ?? 'all']}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STORE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangeFilter
        from={params.get('from') ?? ''}
        to={params.get('to') ?? ''}
        onApply={(from, to) => update({ from, to })}
      />
    </div>
  );
}

// URL params are yyyy-MM-dd; parse as local dates (new Date('2026-09-12')
// would be UTC midnight and can land on the previous day).
const toDate = (s: string) => (s ? parse(s, 'yyyy-MM-dd', new Date()) : undefined);
const toParam = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

// shadcn range date picker (DatePickerWithRange). Every pick is applied to
// the URL straight away; the popover stays open so the end date can follow.
function DateRangeFilter({ from, to, onApply }: { from: string; to: string; onApply: (from: string, to: string) => void }) {
  const [range, setRange] = useState<DateRange | undefined>(
    from || to ? { from: toDate(from), to: toDate(to) } : undefined,
  );

  function select(r?: DateRange) {
    setRange(r);
    onApply(toParam(r?.from), toParam(r?.to ?? r?.from));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label="Date range"
          data-empty={!range?.from}
          className="h-9 w-64 justify-start border-[1.5px] px-2.5 font-normal data-[empty=true]:text-muted"
        >
          <CalendarIcon className="text-muted" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, 'LLL dd, y')} - {format(range.to, 'LLL dd, y')}
              </>
            ) : (
              format(range.from, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" defaultMonth={range?.from} selected={range} onSelect={select} numberOfMonths={2} />
        {range?.from && (
          <div className="flex justify-end border-t border-frame p-2">
            <Button variant="ghost" size="sm" onClick={() => select(undefined)}>
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
