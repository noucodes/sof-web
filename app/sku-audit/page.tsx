import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import SkuAuditLists, { type Counts } from '@/components/SkuAuditLists';
import RunSkuAuditButton from '@/components/RunSkuAuditButton';
import SkuAuditRunLog from '@/components/SkuAuditRunLog';
import SkuAuditHelp from '@/components/SkuAuditHelp';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Run = {
  id: number;
  status: 'success' | 'failed';
  frameworksCount?: number;
  frameworksStocked?: number;
  catsyCount?: number;
  error?: string;
  log?: string[];
  finishedAt?: string;
};

type Latest = Run & { counts: Counts; shopifyErrors: Record<string, string | null> };

// sof-api checks every Catsy SKU against Frameworks and each store's Shopify
// daily at 5am (sku-audit module). This loads the summary; the table fetches
// its rows a page at a time.
async function getAudit(cookieHeader: string): Promise<{ latest: Latest | null; history: Run[]; running: boolean }> {
  const res = await fetch(`${API}/api/sku-audit`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load SKU audit: ${res.status} ${await res.text()}`);
  return res.json();
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })} ${d.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })}`;
}

export default async function SkuAuditPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const { latest, history, running } = await getAudit(cookieHeader);
  const lastFailed = history[0]?.status === 'failed' ? history[0] : null;

  const count = (s: 'active' | 'inactive' | 'missing') => latest?.counts.frameworks[s].toLocaleString() ?? '—';
  const cards = [
    { label: 'Catsy SKUs', value: latest?.catsyCount?.toLocaleString() ?? '—', sub: 'Every product in Catsy' },
    { label: 'Stocked', value: count('active'), sub: 'Stocked in at least one Frameworks branch' },
    { label: 'Non-stocked', value: count('inactive'), sub: 'In Frameworks, ordered in when sold' },
    { label: 'Not in Frameworks', value: count('missing'), sub: 'SKU not found, likely a typo or deleted' },
  ];

  return (
    <AppShell>
      <PageHeader crumbs={['SKU Audit']} />
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">SKU Audit</h1>
              <SkuAuditHelp />
            </div>
            <p className="text-sm text-muted">
              Is every Catsy product stocked in Frameworks and live on the right Shopify stores? Runs daily at 5am.
              Last run {formatDate(latest?.finishedAt)}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SkuAuditRunLog log={history[0]?.log} status={history[0]?.status} finished={formatDate(history[0]?.finishedAt)} />
            <RunSkuAuditButton running={running} />
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow-card p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-[0.07em]">{c.label}</p>
              <p className="text-2xl font-semibold mt-1 text-ink">{c.value}</p>
              {c.sub && <p className="text-xs text-muted mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>

        {lastFailed?.error && (
          <div className="bg-failed-bg text-failed text-sm rounded-xl p-4">
            <span className="font-medium">Last run failed ({formatDate(lastFailed.finishedAt)}):</span> {lastFailed.error}
          </div>
        )}

        {latest && (
          <SkuAuditLists runId={latest.id} counts={latest.counts} shopifyErrors={latest.shopifyErrors} />
        )}
      </div>
    </AppShell>
  );
}
