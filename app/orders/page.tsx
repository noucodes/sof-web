import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import OrderFilters from '@/components/OrderFilters';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Orders <span className="text-gray-400 font-normal text-sm">({total})</span>
          </h1>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-800">Users</Link>
        </div>
        <LogoutButton />
      </header>

      <main className="p-6 space-y-4">
        <Suspense>
          <OrderFilters />
        </Suspense>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Order', 'Customer', 'Store', 'Status', 'Frameworks #', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders found</td>
                </tr>
              )}
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.orderName}</td>
                  <td className="px-4 py-3 text-gray-600">{o.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.storeLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {o.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.frameworksOrderNo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
