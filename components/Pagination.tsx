import Link from 'next/link';

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

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
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
    <nav className="flex items-center justify-center gap-1">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={`p-1.5 rounded-lg border border-frame-input text-muted transition-colors duration-[120ms] ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-primary-wash hover:text-primary'}`}
      >
        <ChevronIcon dir="left" />
      </Link>

      {pageList(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`min-w-[2.25rem] text-center px-2.5 py-1.5 rounded-lg text-sm transition-colors duration-[120ms] ${
              p === page ? 'bg-primary text-white font-medium' : 'text-ink hover:bg-primary-wash hover:text-primary'
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={`p-1.5 rounded-lg border border-frame-input text-muted transition-colors duration-[120ms] ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-primary-wash hover:text-primary'}`}
      >
        <ChevronIcon dir="right" />
      </Link>
    </nav>
  );
}
