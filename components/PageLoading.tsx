import AppShell from '@/components/AppShell';
import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the real page layout (header bar, title/description, then a
// zebra-striped table card) so nothing jumps when the data arrives.
export default function PageLoading() {
  return (
    <AppShell>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-frame bg-white px-4">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-3.5 w-32" />
      </header>
      <div className="p-6 space-y-4" aria-busy="true" aria-label="Loading">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-72" />
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="flex gap-6 bg-surface-strong border-b border-frame px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex gap-6 px-4 py-4 ${i % 2 === 1 ? 'bg-surface' : 'bg-white'}`}>
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-3.5 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
