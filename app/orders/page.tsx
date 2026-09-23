import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import OrderFilters from '@/components/OrderFilters';
import OrdersTable from '@/components/OrdersTable';
import Pagination from '@/components/Pagination';
import RetryFailedButton from '@/components/RetryFailedButton';
import SyncTrigger from '@/components/SyncTrigger';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getOrders(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.store && params.store !== 'all') qs.set('store', params.store);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDir) qs.set('sortDir', params.sortDir);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', '50');

  const res = await fetch(`${API}/orders?${qs.toString()}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

// Real gap check across full order history per store (not just the current
// page/filter) — see OrdersService.findNumberGaps in sof-api.
async function getNumberGaps(cookieHeader: string) {
  const res = await fetch(`${API}/orders/number-gaps`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return []; // non-fatal — page still works without gap warnings
  return res.json();
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const [{ orders, total }, gaps] = await Promise.all([
    getOrders(cookieHeader, params),
    getNumberGaps(cookieHeader),
  ]);
  const totalPages = Math.ceil(total / 50);

  return (
    <AppShell>
      <PageHeader crumbs={['Orders']}>
        <RetryFailedButton />
        <SyncTrigger />
      </PageHeader>
      <div className="p-6 space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              Orders <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
          </div>
          <p className="text-sm text-muted">Shopify orders received and processed into Frameworks ERP.</p>
        </div>

        <Suspense>
          <OrderFilters />
        </Suspense>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <OrdersTable orders={orders} gaps={gaps} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <Pagination page={page} totalPages={totalPages} params={params} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
