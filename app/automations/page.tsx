import Link from 'next/link';
import { cookies } from 'next/headers';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import AutomationsHelp from '@/components/AutomationsHelp';
import { JOBS, getAutomations, formatDate, type Run } from '@/lib/automations';

export default async function AutomationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const latest = await getAutomations<Run[]>('', cookieHeader);
  const byJob = new Map(latest.map(r => [r.job, r]));
  // Known jobs first (in JOBS order), then anything reporting that isn't listed yet.
  const names = [...Object.keys(JOBS), ...latest.map(r => r.job).filter(j => !JOBS[j])];

  return (
    <AppShell>
      <PageHeader crumbs={['Automations']} />
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Automations</h1>
            <AutomationsHelp />
          </div>
          <p className="text-sm text-muted">Every job that runs on its own, and how its last run went.</p>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-strong border-b border-frame">
              <tr className="text-left text-xs font-medium text-muted">
                <th className="px-4 py-2.5">Automation</th>
                <th className="px-4 py-2.5">Last run</th>
                <th className="px-4 py-2.5">Finished</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5">Failed</th>
                <th className="px-4 py-2.5">Runs</th>
              </tr>
            </thead>
            <tbody>
              {names.map(name => {
                const run = byJob.get(name);
                const job = JOBS[name];
                return (
                  <tr key={name} className="border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100">
                    <td className="px-4 py-3">
                      <Link href={`/automations/${name}`} className="font-medium text-ink hover:text-primary">
                        {job?.title ?? name}
                      </Link>
                      {job && <p className="text-xs text-muted mt-0.5 max-w-[440px]">{job.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {run ? (
                        <StatusPill tone={run.status === 'success' ? 'success' : 'failed'}>
                          {run.status === 'success' ? 'Healthy' : 'Failed'}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Never run</StatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{formatDate(run?.finishedAt)}</td>
                    <td className="px-4 py-3 text-ink">{run?.itemsSynced ?? '—'}</td>
                    <td className="px-4 py-3 text-ink">{run?.itemsFailed ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{job?.schedule ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
