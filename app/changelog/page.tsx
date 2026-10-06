import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { CHANGELOG } from '@/lib/changelog';

const SECTIONS = [
  ['added', 'New'],
  ['improved', 'Improved'],
  ['fixed', 'Fixed'],
] as const;

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ChangelogPage() {
  return (
    <AppShell>
      <PageHeader crumbs={['Changelog']} />
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Changelog</h1>
          <p className="text-sm text-muted">What’s new on the portal, newest first.</p>
        </div>
        <ol className="space-y-4">
          {CHANGELOG.map((r, i) => (
            <li key={r.version} className="bg-white rounded-xl shadow-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">{r.title}</h2>
                <span className="font-mono text-xs text-muted">v{r.version}</span>
                {i === 0 && <StatusPill tone="success">Current</StatusPill>}
                <time dateTime={r.date} className="ml-auto text-xs text-muted">{fmt(r.date)}</time>
              </div>
              {SECTIONS.map(([key, label]) =>
                r[key]?.length ? (
                  <div key={key} className="mt-3">
                    <h3 className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">{label}</h3>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-sm text-ink marker:text-muted">
                      {r[key]!.map(c => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                ) : null,
              )}
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}
