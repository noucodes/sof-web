import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import B2BSyncTable from '@/components/B2BSyncTable';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Entry = {
  status: 'success' | 'failed';
  source?: string;
  itemsSynced?: number;
  itemsFailed?: number;
  error?: string;
  finishedAt?: string;
};

// b2b-push writes run status straight into sof-api's b2b_sync_status table
// (SOF_API_STATUS_URL). This page just reads it back — the session cookie is
// forwarded, so an expired session 401s and redirects like every other page.
async function getStatus(cookieHeader: string): Promise<{ latest: Entry | null; history: Entry[] }> {
  const res = await fetch(`${API}/api/b2b-sync/status`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load B2B sync status: ${res.status} ${await res.text()}`);
  return res.json();
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })} ${d.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })}`;
}

export default async function B2BSyncPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const { latest, history } = await getStatus(cookieHeader);

  const cards = [
    {
      label: 'Last run',
      value: latest ? (latest.status === 'success' ? 'Healthy' : 'Failed') : 'Never run',
      sub: formatDate(latest?.finishedAt),
      color: latest?.status === 'success' ? 'text-success' : latest?.status === 'failed' ? 'text-failed' : 'text-ink',
    },
    { label: 'SKUs synced', value: latest?.itemsSynced ?? '—', sub: null, color: 'text-ink' },
    { label: 'SKUs unmatched', value: latest?.itemsFailed ?? '—', sub: null, color: 'text-ink' },
    { label: 'Source', value: latest?.source ?? '—', sub: null, color: 'text-ink' },
  ];

  return (
    <AppShell>
      <PageHeader crumbs={['B2B Price Sync']} />
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">B2B Price Sync</h1>
          </div>
          <p className="text-sm text-muted">Catsy trade prices pushed into Shopify's B2B price list, every 12 hours.</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow-card p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-[0.07em]">{c.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
              {c.sub && <p className="text-xs text-muted mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>

        {latest?.status === 'failed' && latest.error && (
          <div className="bg-failed-bg text-failed text-sm rounded-xl p-4">
            <span className="font-medium">Last error:</span> {latest.error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-frame">
            <h2 className="text-sm font-semibold text-ink">Run history</h2>
          </div>
          <B2BSyncTable history={history} />
        </div>
      </div>
    </AppShell>
  );
}
