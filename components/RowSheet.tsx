'use client';
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

type Details = { title: string; fields: { label: string; html: string }[] };

// Phones: wraps a <table className="stack-table" data-compact>. Tapping an
// item opens all of that row's cells, labelled, in a bottom sheet, so the
// list itself only needs its data-key cells. The sheet copies the row's own
// rendered HTML (already escaped by the browser); buttons are dropped since
// the copies aren't wired up. Taps on links, buttons and checkboxes pass through.
export default function RowSheet({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const [row, setRow] = useState<Details | null>(null);

  function open(e: React.MouseEvent) {
    if (!isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, label, [role="checkbox"], [role="menuitem"]')) return;
    const tr = target.closest('tbody > tr');
    if (!tr || tr.querySelector('td[colspan]')) return;

    const copy = (td: Element) => {
      const c = td.cloneNode(true) as HTMLElement;
      c.querySelectorAll('button, input').forEach(n => n.remove());
      return c.innerHTML;
    };
    const cells = Array.from(tr.children);
    const primary = cells.find(td => td.hasAttribute('data-primary'));
    const fields = cells
      .filter(td => !td.hasAttribute('data-primary') && !td.hasAttribute('data-select') && td.getAttribute('data-label') !== '')
      .map(td => ({ label: td.getAttribute('data-label') ?? '', html: copy(td) }))
      // Drop empty cells, and unlabelled ones that only hold a "—" placeholder.
      .filter(f => { const text = f.html.replace(/<[^>]*>/g, '').trim(); return text && (f.label || text !== '—'); });
    setRow({ title: primary?.innerHTML ?? '', fields });
  }

  return (
    <div className={className} onClick={open}>
      {children}
      <Sheet open={row != null} onOpenChange={o => { if (!o) setRow(null); }}>
        {row && (
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl border-frame bg-white p-0 pb-[env(safe-area-inset-bottom)]">
            <div className="sticky top-0 border-b border-frame bg-white px-4 py-4 pr-12">
              <SheetTitle className="text-[0.9375rem] font-semibold text-ink [&_.block]:font-normal" asChild>
                <div dangerouslySetInnerHTML={{ __html: row.title }} />
              </SheetTitle>
              <SheetDescription className="sr-only">All details for this item</SheetDescription>
            </div>
            <dl className="divide-y divide-hair px-4 text-sm">
              {row.fields.map((f, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-3">
                  {f.label && <dt className="shrink-0 text-muted">{f.label}</dt>}
                  <dd className={f.label ? 'min-w-0 text-right text-ink [&_.block]:mt-0.5' : 'min-w-0 text-ink'} dangerouslySetInnerHTML={{ __html: f.html }} />
                </div>
              ))}
            </dl>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
