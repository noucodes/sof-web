import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import SkuAuditLists, { type SkuRow } from '@/components/SkuAuditLists';
import RunSkuAuditButton from '@/components/RunSkuAuditButton';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Run = {
  status: 'success' | 'failed';
  frameworksCount?: number;
  frameworksStocked?: number;
  catsyCount?: number;
  missingFromCatsy?: SkuRow[];
  inactiveInCatsy?: SkuRow[];
  notInFrameworks?: SkuRow[];
  error?: string;
  finishedAt?: string;
};

// sof-api runs the Frameworks vs Catsy diff daily at 5am (sku-audit module)
// and stores each run; this page reads the latest one back.
async function getAudit(cookieHeader: string): Promise<{ latest: Run | null; history: Run[]; running: boolean }> {
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

  const cards = [
    { label: 'Frameworks SKUs', value: latest?.frameworksCount?.toLocaleString() ?? '—', sub: latest ? `${latest.frameworksStocked?.toLocaleString()} stocked` : null },
    { label: 'Catsy SKUs', value: latest?.catsyCount?.toLocaleString() ?? '—', sub: null },
    { label: 'Missing from Catsy', value: latest?.missingFromCatsy?.length.toLocaleString() ?? '—', sub: 'Stocked in Frameworks' },
    { label: 'Inactive in Catsy', value: latest?.inactiveInCatsy?.length.toLocaleString() ?? '—', sub: 'Not stocked in Frameworks' },
  ];

  return (
    <AppShell>
      <PageHeader crumbs={['SKU Audit']} />
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">SKU Audit</h1>
            <p className="text-sm text-muted">
              Frameworks products compared with Catsy, daily at 5am. Last run {formatDate(latest?.finishedAt)}.
            </p>
          </div>
          <RunSkuAuditButton running={running} />
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
          <SkuAuditLists
            lists={{
              missingFromCatsy: latest.missingFromCatsy ?? [],
              inactiveInCatsy: latest.inactiveInCatsy ?? [],
              notInFrameworks: latest.notInFrameworks ?? [],
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
