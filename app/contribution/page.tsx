import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import ContributionFilters from '@/components/ContributionFilters';
import ContributionTable from '@/components/ContributionTable';
import Pagination from '@/components/Pagination';
import VerifyAllButton from '@/components/VerifyAllButton';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 50;

async function getContribution(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams();
  qs.set('status', params.status ?? 'success');
  if (params.store && params.store !== 'all') qs.set('store', params.store);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', String(PAGE_SIZE));

  const res = await fetch(`${API}/orders/contribution?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load contribution report: ${res.status} ${await
   res.text()}`);
  return res.json();
}

function money(n: number | string | null) {
  return n != null ? `$${parseFloat(String(n)).toFixed(2)}` : '—';
}

// GP% = ((net sales − COGS) / net sales) * 100. Sell price is net sales (ex GST, ex freight).
const GP_ALERT_THRESHOLD = 10;
function gpPct(netSales: number | string | null, cogs: number | string | null): number | null {
  const s = netSales != null ? parseFloat(String(netSales)) : NaN;
  const c = cogs != null ? parseFloat(String(cogs)) : NaN;
  if (!Number.isFinite(s) || !Number.isFinite(c) || s === 0) return null;
  return ((s - c) / s) * 100;
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
  if (params.store && params.store !== 'all') exportQs.set('store', params.store);
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
          <div className="flex shrink-0 items-center gap-2">
            <VerifyAllButton />
            {[
              ['CSV', 'csv'],
              ['JSON', 'json'],
            ].map(([label, format]) => (
              // Plain <a>, not <Link>: a download endpoint must not be hover-prefetched.
              <a
                key={format}
                href={`/api/orders/contribution/export?${exportQs.toString()}&format=${format}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-frame-input text-ink hover:bg-surface-hover transition-colors duration-[120ms]"
              >
                Export {label}
              </a>
            ))}
          </div>
        </div>

        <Suspense>
          <ContributionFilters />
        </Suspense>

        <div className="grid grid-cols-6 gap-3">
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
          {(() => {
            const p = gpPct(totals.netSales, totals.cogs);
            const low = p != null && p < GP_ALERT_THRESHOLD;
            return (
              <div className="bg-white rounded-xl shadow-card p-4">
                <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">GP %</p>
                <p className={`text-lg font-semibold mt-1 ${low ? 'text-failed' : 'text-ink'}`}>
                  {p != null ? `${p.toFixed(1)}%` : '—'}
                </p>
              </div>
            );
          })()}
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <ContributionTable rows={rows} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <Pagination page={page} totalPages={totalPages} params={params} basePath="/contribution" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
