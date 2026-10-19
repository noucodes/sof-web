'use client';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Option = { value: string; label: string; href: string };

// A dropdown whose options are links: stands in for a row of filter buttons
// that doesn't fit on a phone.
export default function LinkSelect({ label, value, options, className }: { label: string; value: string; options: Option[]; className?: string }) {
  const router = useRouter();
  return (
    <Select value={value} onValueChange={v => { const o = options.find(o => o.value === v); if (o) router.push(o.href); }}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue>{options.find(o => o.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
