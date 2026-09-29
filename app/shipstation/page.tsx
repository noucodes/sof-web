import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import RetryFailedReleasesButton from '@/components/RetryFailedReleasesButton';
import MissingShipmentsButton from '@/components/MissingShipmentsButton';
import InvoicedOutsideShipStation from '@/components/InvoicedOutsideShipStation';
import ShipStationTable from '@/components/ShipStationTable';
import AsyncCount from '@/components/AsyncCount';
import { TableSkeleton } from '@/components/PageLoading';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getJobs(cookieHeader: string, params: Record<string, string>) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', '50');
  const res = await fetch(`${API}/jobs?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load jobs');
  return res.json();
}

const STATUSES = ['all', 'pending', 'success', 'failed'];

export default async function ShipStationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const invoicedView = params.view === 'invoiced-outside';

  const tabs = (
    <nav aria-label="ShipStation views" className="inline-flex h-9 items-center rounded-lg bg-surface-strong p-1 text-muted">
      {[
        ['Label jobs', '/shipstation', !invoicedView],
        ['Invoiced outside ShipStation', '/shipstation?view=invoiced-outside', invoicedView],
      ].map(([label, href, active]) => (
        <Link
          key={label as string}
          href={href as string}
          aria-current={active ? 'page' : undefined}
          className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none ${active ? 'bg-white text-ink shadow-card' : 'hover:text-ink'}`}
        >
          {label as string}
        </Link>
      ))}
    </nav>
  );

  if (invoicedView) {
    return (
      <AppShell>
        <PageHeader crumbs={['ShipStation']}>
          <MissingShipmentsButton />
          <RetryFailedReleasesButton />
        </PageHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Invoiced outside ShipStation</h1>
            <p className="text-sm text-muted">
              Orders invoiced directly in Frameworks that ShipStation still shows as open. Mark them shipped so they aren&apos;t picked twice.
            </p>
          </div>
          {tabs}
          <InvoicedOutsideShipStation />
        </div>
      </AppShell>
    );
  }

  // Started here, awaited inside the keyed Suspense boundaries below so status/page
  // changes show skeletons (loading.tsx doesn't show for same-route navigations).
  const data = getJobs(cookieHeader, params);
  const key = new URLSearchParams(params).toString();

  return (
    <AppShell>
      <PageHeader crumbs={['ShipStation']}>
        <MissingShipmentsButton />
        <RetryFailedReleasesButton />
        {STATUSES.map(s => {
          const active = (params.status ?? 'all') === s;
          return (
            <Button
              key={s}
              asChild
              size="sm"
              variant="outline"
              className={active ? 'border-primary bg-primary-wash text-primary hover:bg-primary-wash' : 'text-muted hover:text-ink'}
            >
              <Link href={`/shipstation?status=${s}`} aria-current={active ? 'page' : undefined}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            </Button>
          );
        })}
      </PageHeader>
      <div className="p-6 space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-1 text-[0.9375rem] font-semibold text-ink tracking-tight">
              ShipStation Jobs
              <Suspense key={key} fallback={<Skeleton className="h-3.5 w-10" />}>
                <AsyncCount data={data} />
              </Suspense>
            </h1>
          </div>
          <p className="text-sm text-muted">Label print jobs received from ShipStation and linked to Frameworks orders.</p>
        </div>

        {tabs}

        <Suspense key={key} fallback={<TableSkeleton columns={9} />}>
          <ShipStationContent data={data} params={params} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function ShipStationContent({
  data,
  params,
}: {
  data: Promise<{ jobs: any[]; total: number }>;
  params: Record<string, string>;
}) {
  const { jobs, total } = await data;
  const page = Number(params.page ?? 1);
  const totalPages = Math.ceil(total / 50);

  return (
    <>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <ShipStationTable jobs={jobs} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {totalPages}</span>
          <Pagination page={page} totalPages={totalPages} params={params} basePath="/shipstation" />
        </div>
      )}
    </>
  );
}
