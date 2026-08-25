import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ContributionFilters from '@/components/ContributionFilters';
import FetchPriceButton from '@/components/FetchPriceButton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 50;

async function getContribution(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams();
  qs.set('status', params.status ?? 'success');
  if (params.store) qs.set('store', params.store);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', String(PAGE_SIZE));

  const res = await fetch(`${API}/orders/contribution?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load contribution report');
  return res.json();
}

function money(n: number | string | null) {
  return n != null ? `$${parseFloat(String(n)).toFixed(2)}` : '—';
}

export default async function ContributionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const { rows, total, totals } = await getContribution(cookieHeader, params);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportQs = new URLSearchParams();
  exportQs.set('status', params.status ?? 'success');
  if (params.store) exportQs.set('store', params.store);
  if (params.from) exportQs.set('from', params.from);
  if (params.to) exportQs.set('to', params.to);

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              Contribution <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
            <p className="text-sm text-muted">
              Net sales (ex GST) − COGS − freight − payment fees (1.8%), per order from Frameworks.
            </p>
          </div>
          <Link
            href={`/api/orders/contribution/export?${exportQs.toString()}`}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border border-frame-input text-ink hover:bg-surface-hover transition-colors duration-[120ms]"
          >
            Export CSV
          </Link>
        </div>

        <Suspense>
          <ContributionFilters />
        </Suspense>

        <div className="grid grid-cols-5 gap-3">
          {[
            ['Net Sales', totals.netSales],
            ['COGS', totals.cogs],
            ['Freight', totals.freight],
            ['Payment Fees', totals.paymentFees],
            ['Contribution', totals.contribution],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white rounded-xl shadow-card p-4">
              <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">{label}</p>
              <p className="text-lg font-semibold text-ink mt-1">{money(value as number)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-frame">
              <tr>
                {['Order', 'Store', 'Frameworks No.', 'Net Sales', 'COGS', 'Freight', 'Payment Fees', 'Contribution'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-frame">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
                </tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.orderId} className={`hover:bg-surface-hover transition-colors duration-100 ${r.error ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{r.orderName}</td>
                  <td className="px-4 py-3 text-sm text-muted">{r.storeLabel}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{r.frameworksOrderNo ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink">{money(r.netSales)}</td>
                  <td className="px-4 py-3 text-sm text-ink">{money(r.cogs)}</td>
                  <td className="px-4 py-3 text-sm text-ink">{money(r.freight)}</td>
                  <td className="px-4 py-3 text-sm text-ink">{money(r.paymentFees)}</td>
                  <td className="px-4 py-3 text-sm text-ink font-medium">
                    <div className="flex items-center gap-1.5">
                      {r.contribution == null ? (
                        <span className="text-muted font-normal">Not calculated</span>
                      ) : (
                        <span>{money(r.contribution)}</span>
                      )}
                      {r.error && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0">
                              <svg className="w-4 h-4 text-pending" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
                              </svg>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{r.error}</TooltipContent>
                        </Tooltip>
                      )}
                      {r.frameworksOrderNo && (r.contribution == null || r.error) && (
                        <FetchPriceButton orderId={r.orderId} hasError={!!r.error} />
                      )}
                    </div>
                  </td>
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
                  href={`/contribution?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/contribution?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
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
