import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import OrderFilters from '@/components/OrderFilters';
import OrdersTable from '@/components/OrdersTable';
import SyncTrigger from '@/components/SyncTrigger';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getOrders(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.store && params.store !== 'all') qs.set('store', params.store);
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const { orders, total } = await getOrders(cookieHeader, params);
  const totalPages = Math.ceil(total / 50);

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              Orders <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
            <p className="text-sm text-muted">Shopify orders received and processed into Frameworks ERP.</p>
          </div>
          <SyncTrigger />
        </div>

        <Suspense>
          <OrderFilters />
        </Suspense>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <OrdersTable orders={orders} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
