import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
};

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
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">
              ShipStation Jobs <span className="text-sm font-normal text-muted">({total})</span>
            </h1>
            <p className="text-sm text-muted">Label print jobs received from ShipStation and linked to Frameworks orders.</p>
          </div>
          <div className="flex gap-2">
            {STATUSES.map(s => (
              <Link
                key={s}
                href={`/shipstation?status=${s}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-[120ms] border ${
                  (params.status ?? 'all') === s
                    ? 'bg-primary-wash text-primary border-primary/20 font-medium'
                    : 'border-frame-input text-muted hover:text-ink hover:bg-surface-hover'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-frame">
              <tr>
                {['Shipment ID', 'Order', 'Ship To', 'Carrier', 'Tracking', 'Status', 'Attempts', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-frame">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No jobs found</td>
                </tr>
              )}
              {jobs.map((j: any) => (
                <tr key={j.id} className="hover:bg-surface-hover transition-colors duration-100">
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.shipmentId}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">
                    {j.orderNumber ?? '—'}
                    {j.linkedOrder?.orderNo && <span className="text-muted ml-1">→ FW {j.linkedOrder.orderNo}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{j.shipTo ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted">{j.carrier ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{j.trackingNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[j.status] ?? 'bg-surface text-muted'}`}>
                      {j.statusLabel}
                    </span>
                    {j.error && <p className="text-[0.7rem] text-failed mt-0.5 max-w-[200px] truncate">{j.error}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted text-center">{j.attempts}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{new Date(j.createdAt).toLocaleDateString()}</td>
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
                <Link href={`/shipstation?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/shipstation?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="px-3 py-1.5 border border-frame-input rounded-lg text-sm text-primary hover:bg-primary-wash transition-colors duration-[120ms]">
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
