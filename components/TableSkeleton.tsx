import { Skeleton } from '@/components/ui/skeleton';

// A zebra-striped table card placeholder, shared by the route-level loading
// page and by in-page Suspense fallbacks (filter/sort/page changes).
export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="hidden gap-6 bg-surface-strong border-b border-frame px-4 py-3 md:flex">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        // Phones show tables as lists, so each placeholder row is a short stack of lines.
        <div key={i} className="flex flex-col gap-2 px-4 py-4 border-t border-hair first:border-t-0 md:flex-row md:gap-6 [&>:nth-child(n+4)]:max-md:hidden">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}
