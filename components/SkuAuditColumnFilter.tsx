'use client';
import { ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ShopifyFilter = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'none';
export type CatsyFilter = 'on' | 'off' | 'unknown';
export type ColumnFilter = { shopify?: ShopifyFilter; catsy?: CatsyFilter };

const SHOPIFY: { value: ShopifyFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Live' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'none', label: 'Not listed' },
];
const CATSY: { value: CatsyFilter; label: string }[] = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'unknown', label: 'Unknown (?)' },
];

// Filter menu in a store column header: Shopify status and the Catsy Enabled flag.
// Radix radio groups can't hold an empty value, so 'any' stands for no filter.
export default function SkuAuditColumnFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ColumnFilter;
  onChange: (v: ColumnFilter) => void;
}) {
  const active = !!(value.shopify || value.catsy);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          aria-label={`Filter ${label}`}
          className={`-ml-2 h-7 gap-1 px-2 font-medium ${active ? 'text-primary' : 'text-muted'}`}
        >
          {label}
          <ListFilter className={active ? 'text-primary' : undefined} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted font-medium">{label} Shopify status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value.shopify ?? 'any'}
          onValueChange={v => onChange({ ...value, shopify: v === 'any' ? undefined : (v as ShopifyFilter) })}
        >
          <DropdownMenuRadioItem value="any">Any</DropdownMenuRadioItem>
          {SHOPIFY.map(o => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted font-medium">{label} enabled in Catsy</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value.catsy ?? 'any'}
          onValueChange={v => onChange({ ...value, catsy: v === 'any' ? undefined : (v as CatsyFilter) })}
        >
          <DropdownMenuRadioItem value="any">Any</DropdownMenuRadioItem>
          {CATSY.map(o => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange({})}>Clear {label} filter</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
