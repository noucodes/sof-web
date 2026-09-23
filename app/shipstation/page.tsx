import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import RetryFailedReleasesButton from '@/components/RetryFailedReleasesButton';
import ShipStationTable from '@/components/ShipStationTable';

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
  const page = Number(params.page ?? 1);
  const { jobs, total } = await getJobs(cookieHeader, params);
  const totalPages = Math.ceil(total / 50);

  return (
    <AppShell>
      <PageHeader crumbs={['ShipStation']}>
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
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              ShipStation Jobs <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
          </div>
          <p className="text-sm text-muted">Label print jobs received from ShipStation and linked to Frameworks orders.</p>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <ShipStationTable jobs={jobs} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <Pagination page={page} totalPages={totalPages} params={params} basePath="/shipstation" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
