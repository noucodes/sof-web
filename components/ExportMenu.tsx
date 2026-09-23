'use client';
import { ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FORMATS = [
  { format: 'csv', label: 'CSV', hint: 'Spreadsheet' },
  { format: 'json', label: 'JSON', hint: 'Raw data' },
];

export default function ExportMenu({ query }: { query: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download />
          Export
          <ChevronDown className="text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {FORMATS.map(({ format, label, hint }) => (
          <DropdownMenuItem key={format} asChild>
            {/* Plain <a>, not <Link>: a download endpoint must not be hover-prefetched. */}
            <a href={`/api/orders/contribution/export?${query}&format=${format}`}>
              {label}
              <span className="ml-auto text-xs text-muted">{hint}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
