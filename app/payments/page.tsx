import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 50;

async function getOrders(cookieHeader: string, page: number) {
  const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  const res = await fetch(`${API}/orders?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

async function getOrderDetail(cookieHeader: string, id: string) {
  const res = await fetch(`${API}/orders/${id}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function titleCase(s?: string) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const { orders, total } = await getOrders(cookieHeader, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ponytail: N+1 detail fetch per row — the /orders list endpoint doesn't carry payment
  // amount/date/method, only the per-order detail endpoint does. Fine at 50 rows/page;
  // push these fields onto the list endpoint if this page needs to scale further.
  const details = await Promise.all(orders.map((o: any) => getOrderDetail(cookieHeader, o.id)));

  const rows = orders.map((o: any, i: number) => {
    const d = details[i];
    const payment = d?.paymentPayload?.dsCustomerPayment?.customerPayment?.[0];
    return {
      id: o.id,
      shopifyOrderNo: o.orderName,
      paymentMethod: titleCase(d?.payload?.payment_gateway_names?.[0]),
      paymentAmount: payment?.paymentAmount ?? o.total,
      date: payment?.paymentDate ?? o.createdAt,
      customerName: o.customer?.name ?? '—',
      frameworksOrderNo: o.frameworksOrderNo
        ? `${o.frameworksOrderNo}${d?.frameworksOrderSuffix ? `-${d.frameworksOrderSuffix}` : ''}`
        : '—',
    };
  });

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
            Payments <span className="text-sm font-normal text-muted">({total})</span>
          </h1>
          <p className="text-sm text-muted">Payment records for accounts reconciliation.</p>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-frame">
              <tr>
                {['Shopify Order', 'Payment Method', 'Payment Reference', 'Payment Amount', 'Date', 'Customer', 'Framework Order No.'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-frame">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">No payments found</td>
                </tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-surface-hover transition-colors duration-100">
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{r.shopifyOrderNo}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.paymentMethod}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">—</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.paymentAmount ? `$${parseFloat(r.paymentAmount).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.customerName}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{r.frameworksOrderNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/payments?page=${page - 1}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/payments?page=${page + 1}`}
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
