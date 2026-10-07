'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Paste a column of SKUs (from a spreadsheet, an email, etc.). value/onApply are a
// comma list, so callers can keep it in the URL like their other filters.
export default function SkuSearch({ value, onApply, hint, className = 'h-9' }: { value: string; onApply: (v: string) => void; hint: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const count = value ? value.split(',').length : 0;
  const parse = (t: string) => [...new Set(t.split(/[\s,;]+/).map(s => s.trim().toUpperCase()).filter(Boolean))];
  const pending = parse(text).length;

  function apply(list: string[]) {
    onApply(list.join(','));
    setOpen(false);
  }

  return (
    <>
      <Button variant={count ? 'secondary' : 'outline'} className={className} onClick={() => { setText(value.split(',').join('\n')); setOpen(true); }}>
        {count ? `${count} SKU${count === 1 ? '' : 's'}` : 'Search SKUs'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search by SKU</DialogTitle>
            <DialogDescription>Paste SKUs, one per line or separated by commas. {hint}</DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <textarea
              aria-label="SKUs"
              autoFocus
              rows={10}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'ABC123\nXYZ-456'}
              className="w-full rounded-lg border border-frame-input bg-white px-3 py-2 font-mono text-sm text-ink focus-visible:shadow-focus-ring focus-visible:outline-none"
            />
            <p className="mt-1 text-xs text-muted">{pending} SKU{pending === 1 ? '' : 's'}{pending > 500 ? ' · only the first 500 are searched' : ''}</p>
          </div>
          <DialogFooter>
            {count > 0 && <Button variant="ghost" onClick={() => apply([])}>Clear</Button>}
            <Button onClick={() => apply(parse(text))}>Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
