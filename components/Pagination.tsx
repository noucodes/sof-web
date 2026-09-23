import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function pageList(current: number, total: number): (number | '...')[] {
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const list: (number | '...')[] = [1];
  if (left > 2) list.push('...');
  for (let i = left; i <= right; i++) list.push(i);
  if (right < total - 1) list.push('...');
  if (total > 1) list.push(total);
  return list;
}

export default function Pagination({
  page,
  totalPages,
  params,
  basePath = '/orders',
}: {
  page: number;
  totalPages: number;
  params: Record<string, string>;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => `${basePath}?${new URLSearchParams({ ...params, page: String(p) })}`;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Button asChild variant="outline" size="icon" className="h-8 w-8" aria-disabled={page <= 1}>
        <Link href={hrefFor(page - 1)} aria-label="Previous page" className={page <= 1 ? 'pointer-events-none opacity-40' : undefined}>
          <ChevronLeft />
        </Link>
      </Button>

      {pageList(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted">…</span>
        ) : (
          <Button key={p} asChild variant={p === page ? 'default' : 'ghost'} size="sm" className="min-w-8 px-2.5">
            <Link href={hrefFor(p)} aria-current={p === page ? 'page' : undefined}>
              {p}
            </Link>
          </Button>
        )
      )}

      <Button asChild variant="outline" size="icon" className="h-8 w-8" aria-disabled={page >= totalPages}>
        <Link href={hrefFor(page + 1)} aria-label="Next page" className={page >= totalPages ? 'pointer-events-none opacity-40' : undefined}>
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  );
}
