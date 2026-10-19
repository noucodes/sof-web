import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { TableSkeleton } from '@/components/PageLoading';
import ContributionFilters from '@/components/ContributionFilters';
import RowSheet from '@/components/RowSheet';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Row = {
  storeLabel: string;
  transactionDate: string;
  type: string;
  order: string | null;
  amount: number;
  fee: number;
  net: number;
};
type Data = { from: string; to: string; rows: Row[]; errors: string[] };

async function getMovement(cookieHeader: string, qs: URLSearchParams): Promise<Data> {
  const res = await fetch(`${API}/orders/movement?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load Shopify movement');
  return res.json();
}

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;
const ymd = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-AU');
const typeLabel = (t: string) => t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');

export default async function MovementPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const key of ['store', 'from', 'to']) if (params[key] && params[key] !== 'all') qs.set(key, params[key]);

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const data = getMovement(cookieHeader, qs);
  const allStores = !params.store || params.store === 'all';

  return (
    <AppShell>
      <PageHeader crumbs={[{ label: 'Payments', href: '/payments' }, 'Daily movement']}>
        <Button asChild size="sm" variant="outline">
          {/* Plain <a>, not <Link>: a download endpoint must not be prefetched. */}
          <a href={`/api/orders/movement/export?${qs}`}>
            <Download />
            Download CSV
          </a>
        </Button>
      </PageHeader>
      <div className="p-4 md:p-6 space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Daily movement</h1>
          <p className="text-sm text-muted">
            Every Shopify Payments transaction, straight from Shopify. Dates filter on Shopify&apos;s transaction date; the last 7 days if none are picked.
          </p>
        </div>

        <Suspense>
          <ContributionFilters basePath="/payments/movement" showStatus={false} />
        </Suspense>

        <Suspense key={qs.toString()} fallback={<TableSkeleton columns={allStores ? 6 : 5} />}>
          <MovementContent data={data} allStores={allStores} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function MovementContent({ data, allStores }: { data: Promise<Data>; allStores: boolean }) {
  const { from, to, rows, errors } = await data;
  const headers = ['Transaction Date', ...(allStores ? ['Store'] : []), 'Order', 'Amount', 'Fee', 'Net'];
  const isMoney = (h: string) => h === 'Amount' || h === 'Fee' || h === 'Net';

  return (
    <>
      {errors.map(e => (
        <div key={e} role="alert" className="px-4 py-3 rounded-lg bg-failed-bg text-failed text-sm">{e}</div>
      ))}

      <p className="text-sm text-muted">
        {ymd(from)} – {ymd(to)}: {rows.length} transaction{rows.length === 1 ? '' : 's'}.
      </p>

      <div className="bg-white rounded-xl shadow-card overflow-x-auto">
        <RowSheet>
        <table data-compact className="stack-table w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              {headers.map(h => (
                <th key={h} className={`${isMoney(h) ? 'text-right' : 'text-left'} px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-muted">No transactions in these dates</td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100">
                <td data-label="Date" data-key className="px-4 py-3 font-mono text-[0.8125rem] text-muted whitespace-nowrap">
                  {new Date(r.transactionDate).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', timeStyle: 'short' })}
                </td>
                {allStores && <td data-label="Store" className="px-4 py-3 text-ink">{r.storeLabel}</td>}
                <td data-primary className="px-4 py-3 font-mono text-[0.8125rem] text-ink">
                  {r.order ?? <span className="font-sans text-sm text-muted">{typeLabel(r.type)}</span>}
                </td>
                <td data-label="Amount" data-key className="px-4 py-3 text-right tabular-nums text-ink">{money(r.amount)}</td>
                <td data-label="Fee" className="px-4 py-3 text-right tabular-nums text-ink">{money(r.fee)}</td>
                <td data-label="Net" className="px-4 py-3 text-right tabular-nums text-ink">{money(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </RowSheet>
      </div>
    </>
  );
}
