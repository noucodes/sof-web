import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import B2BSyncTable from '@/components/B2BSyncTable';
import { JOBS, getAutomations, formatDate, type Run } from '@/lib/automations';

export default async function AutomationPage({ params }: { params: Promise<{ job: string }> }) {
  const { job: name } = await params;
  if (!/^[a-z0-9-]{1,64}$/.test(name)) notFound();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const { latest, history } = await getAutomations<{ latest: Run | null; history: Run[] }>(`/${name}`, cookieHeader);

  const job = JOBS[name];
  const title = job?.title ?? name;
  const items = job?.itemLabel ?? 'Items';
  const cards = [
    {
      label: 'Last run',
      value: latest ? (latest.status === 'success' ? 'Healthy' : 'Failed') : 'Never run',
      sub: formatDate(latest?.finishedAt),
      color: latest?.status === 'success' ? 'text-success' : latest?.status === 'failed' ? 'text-failed' : 'text-ink',
    },
    { label: `${items} updated`, value: latest?.itemsSynced ?? '—', sub: null, color: 'text-ink' },
    { label: `${items} failed`, value: latest?.itemsFailed ?? '—', sub: null, color: 'text-ink' },
    { label: 'Runs', value: job?.schedule ?? '—', sub: latest?.source ?? null, color: 'text-ink' },
  ];

  return (
    <AppShell>
      <PageHeader crumbs={[{ label: 'Automations', href: '/automations' }, title]} />
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">{title}</h1>
          {job && <p className="text-sm text-muted">{job.description}</p>}
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
          <B2BSyncTable history={history} failedLabel="Failed" />
        </div>
      </div>
    </AppShell>
  );
}
