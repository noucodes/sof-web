import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import FetchPriceButton from '@/components/FetchPriceButton';
import Pagination from '@/components/Pagination';
import { SortIcon } from '@/components/table/icons';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 50;

// Columns backed by base order fields sof-api can sort across the whole
// dataset (see ORDER_SORT_GETTERS in orders.service.ts). Payment
// method/amount live in the per-order detail fetch below, not the list
// endpoint, so they stay display-only for now.
const SORTABLE_COLUMNS: Record<string, string> = {
  'Shopify Order': 'order',
  'Shopify Price': 'total',
  Customer: 'customer',
  'Framework Order No.': 'frameworks',
};

async function getOrders(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: String(PAGE_SIZE) });
  if (params.mismatch === '1') qs.set('mismatch', '1');
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDir) qs.set('sortDir', params.sortDir);
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
  const mismatchOnly = params.mismatch === '1';
  const { orders, total } = await getOrders(cookieHeader, params);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function sortHref(key: string) {
    const next = new URLSearchParams(params);
    const current = params.sortBy === key ? params.sortDir : null;
    if (current === 'asc') {
      next.set('sortBy', key);
      next.set('sortDir', 'desc');
    } else if (current === 'desc') {
      next.delete('sortBy');
      next.delete('sortDir');
    } else {
      next.set('sortBy', key);
      next.set('sortDir', 'asc');
    }
    next.set('page', '1');
    return `/payments?${next.toString()}`;
  }

  // ponytail: N+1 detail fetch per row — the /orders list endpoint doesn't carry payment
  // amount/date/method, only the per-order detail endpoint does. Fine at 50 rows/page;
  // push these fields onto the list endpoint if this page needs to scale further.
  const details = await Promise.all(orders.map((o: any) => getOrderDetail(cookieHeader, o.id)));

  const rows = orders.map((o: any, i: number) => {
    const d = details[i];
    const payment = d?.paymentPayload?.dsCustomerPayment?.customerPayment?.[0];
    const paymentAmount = payment?.paymentAmount ?? o.total;
    const shopifyPrice = o.total;
    const frameworksPrice = o.frameworksPrice;
    // Same cross-check as sof-main's transform.service.js: Shopify's total vs.
    // Frameworks' total (incl. GST) — silent disagreement here is the BHQ3386-style bug.
    // Threshold is a hair above 0 (not a flat 0) to absorb float rounding noise from
    // parseFloat, while still catching genuine 1-cent gaps like #BHQ3823/#BURWEB3054.
    const priceMismatch =
      frameworksPrice != null &&
      shopifyPrice != null &&
      Math.abs(parseFloat(frameworksPrice) - parseFloat(shopifyPrice)) > 0.001;
    const shopifyDiff = priceMismatch ? parseFloat(frameworksPrice) - parseFloat(shopifyPrice) : 0;
    // Separate check: does what the customer actually paid match what Frameworks recorded?
    const havePaymentAndPrice = paymentAmount != null && frameworksPrice != null;
    const paymentVerified =
      havePaymentAndPrice &&
      Math.abs(parseFloat(paymentAmount) - parseFloat(frameworksPrice)) <= 0.001;
    const paymentMismatch = havePaymentAndPrice && !paymentVerified;
    return {
      id: o.id,
      shopifyOrderNo: o.orderName,
      paymentMethod: titleCase(d?.payload?.payment_gateway_names?.[0]),
      paymentAmount,
      shopifyPrice,
      frameworksPrice,
      frameworksPriceError: o.frameworksPriceError,
      priceMismatch,
      shopifyDiff,
      paymentVerified,
      paymentMismatch,
      frameworksOrderNoRaw: o.frameworksOrderNo,
      date: payment?.paymentDate ?? o.createdAt,
      customerName: o.customer?.name ?? '—',
      frameworksOrderNo: o.frameworksOrderNo
        ? `${o.frameworksOrderNo}${d?.frameworksOrderSuffix ? `-${d.frameworksOrderSuffix}` : ''}`
        : '—',
    };
  });

  // Backend already filtered to mismatches across the whole dataset when
  // mismatchOnly is set (see OrdersService.findAll's `mismatch` flag) — `total`
  // is the real count, not just what's on this page.
  const mismatchCount = mismatchOnly ? total : rows.filter((r: any) => r.priceMismatch).length;
  const visibleRows = rows;
  const toggleHrefParams = new URLSearchParams(params);
  toggleHrefParams.set('page', '1');
  if (mismatchOnly) toggleHrefParams.delete('mismatch');
  else toggleHrefParams.set('mismatch', '1');
  const toggleHref = `/payments?${toggleHrefParams.toString()}`;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              Payments <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
            <p className="text-sm text-muted">Payment records for accounts reconciliation.</p>
          </div>
          <Link
            href={toggleHref}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-[120ms] ${
              mismatchOnly
                ? 'bg-primary text-white border-primary hover:bg-primary-deep'
                : 'border-frame-input text-ink hover:bg-surface-hover'
            }`}
          >
            {mismatchOnly ? 'Showing mismatches only' : 'Show mismatches only'}
          </Link>
        </div>

        {mismatchCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-pending-bg text-pending text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
            </svg>
            <span className="font-medium">
              {mismatchCount} order{mismatchCount === 1 ? '' : 's'} {mismatchOnly ? 'total' : 'on this page'} {mismatchCount === 1 ? 'has' : 'have'} a Shopify/Frameworks price mismatch.
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-frame">
              <tr>
                {['Shopify Order', 'Payment Method', 'Shopify Price', 'Payment Amount', 'Date', 'Customer', 'Framework Order No.'].map(h => {
                  const sortKey = SORTABLE_COLUMNS[h];
                  const direction = sortKey && params.sortBy === sortKey ? (params.sortDir as 'asc' | 'desc') ?? 'asc' : null;
                  return (
                    <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">
                      {sortKey ? (
                        <Link href={sortHref(sortKey)} className="inline-flex items-center gap-1 hover:text-ink transition-colors duration-100">
                          {h}
                          <SortIcon direction={direction} />
                        </Link>
                      ) : h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-frame">
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                    {mismatchOnly ? 'No mismatches on this page' : 'No payments found'}
                  </td>
                </tr>
              )}
              {visibleRows.map((r: any, idx: number) => (
                <tr key={r.id} className={`${idx % 2 === 1 ? 'bg-surface/40' : 'bg-white'} hover:bg-surface-hover transition-colors duration-100`}>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{r.shopifyOrderNo}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.shopifyPrice ? `$${parseFloat(r.shopifyPrice).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    <div className="flex items-center gap-1.5">
                      <span className={r.frameworksPriceError ? 'text-failed' : ''}>
                        {r.paymentAmount ? `$${parseFloat(r.paymentAmount).toFixed(2)}` : '—'}
                      </span>
                      {r.priceMismatch && (
                        <span className="text-[0.75rem] font-medium text-pending">
                          ({r.shopifyDiff > 0 ? '+' : '-'}${Math.abs(r.shopifyDiff).toFixed(2)})
                        </span>
                      )}
                      {r.paymentAmount != null && r.frameworksPrice != null && (
                        r.paymentVerified ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="shrink-0">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Verified on Frameworks</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="shrink-0">
                                <svg className="w-4 h-4 text-pending" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
                                </svg>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Payment ${parseFloat(r.paymentAmount).toFixed(2)} does not match Frameworks ${parseFloat(r.frameworksPrice).toFixed(2)}
                            </TooltipContent>
                          </Tooltip>
                        )
                      )}
                      {r.frameworksOrderNoRaw && (!r.frameworksPrice || r.frameworksPriceError || r.paymentMismatch) && (
                        <FetchPriceButton orderId={r.id} hasError={!!r.frameworksPriceError || r.paymentMismatch} />
                      )}
                    </div>
                  </td>
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
            <Pagination page={page} totalPages={totalPages} params={params} basePath="/payments" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
