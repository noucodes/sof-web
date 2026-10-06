import AppShell from '@/components/AppShell';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/TableSkeleton';

// Lives in its own file so client components can import it without pulling in AppShell (server-only).
export { TableSkeleton };

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
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <TableSkeleton />
      </div>
    </AppShell>
  );
}
