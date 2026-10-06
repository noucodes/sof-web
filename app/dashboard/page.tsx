import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { ChevronRight, CircleCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill, { type Tone } from '@/components/StatusPill';
import { actionLabel, type ActivityParams } from '@/lib/activity';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TZ = 'Australia/Sydney';

const STORE_LABEL: Record<string, string> = { burdens: 'Burdens', bathroomhq: 'Bathroom HQ', plumbershq: 'Plumbers HQ', aspire: 'Aspire' };
const SKU_STORE_LABEL: Record<string, string> = { burdens: 'Burdens', bathroomhq: 'BHQ', plumbershq: 'PHQ' };

type Daily = { days: number; rows: { day: string; store: string | null; status: string; count: number }[] };
type Feed = { id: string; type: string; message: string; createdAt: string }[];
type Team = { id: number; userEmail: string; params: ActivityParams; result: { ok?: boolean } | null; createdAt: string }[];
type B2b = { latest: { status: string; finishedAt: string | null; createdAt: string; itemsSynced: number | null; itemsFailed: number | null; error: string | null } | null };
type SkuSummary = {
  latest: { status: string; finishedAt: string; counts?: { stores: Record<string, { notLive: number; notEnabled: number }> }; shopifyErrors?: Record<string, string | null> } | null;
};

const ago = (d?: string | null) => (d ? `${formatDistanceToNowStrict(new Date(d))} ago` : 'Never');
const hoursSince = (d?: string | null) => (d ? (Date.now() - new Date(d).getTime()) / 36e5 : Infinity);

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  // Each panel degrades on its own: one slow or failing endpoint shows as
  // "unavailable" instead of taking the whole dashboard down.
  const get = async <T,>(path: string): Promise<T | null> => {
    const res = await fetch(`${API}${path}`, { headers: { cookie: cookieHeader }, cache: 'no-store' }).catch(() => null);
    if (res?.status === 401) redirect('/login');
    return res?.ok ? res.json().catch(() => null) : null;
  };

  const [metrics, daily, feed, team, failedJobs, b2b, sku] = await Promise.all([
    get<any>('/metrics'),
    get<Daily>('/metrics/daily?days=7'),
    get<{ activity: Feed }>('/metrics/activity?limit=8'),
    get<Team>('/audit/team?limit=8'),
    get<{ total: number }>('/jobs?status=failed&limit=1'),
    get<B2b>('/api/b2b-sync/status'),
    get<SkuSummary>('/api/sku-audit'),
  ]);

  // ---- Needs attention ------------------------------------------------------
  const skuMismatch = Object.entries(sku?.latest?.counts?.stores ?? {})
    .map(([s, c]) => ({ store: SKU_STORE_LABEL[s] ?? s, n: (c.notLive ?? 0) + (c.notEnabled ?? 0) }))
    .filter(x => x.n > 0);
  const skuErrors = Object.entries(sku?.latest?.shopifyErrors ?? {}).filter(([, e]) => e).map(([s]) => SKU_STORE_LABEL[s] ?? s);
  // ponytail: "stale" = oldest pending order is an hour or more old; sof-api only sends it as "1h 5m" text.
  const stalePending = metrics?.pendingOrders > 0 && /h/.test(metrics?.oldestPendingAge ?? '');

  const attention: { tone: Tone; title: string; detail: string; href: string }[] = [];
  if (metrics?.bridge === 'down') attention.push({ tone: 'failed', title: 'Bridge is down', detail: 'Orders can’t reach Frameworks until it’s back.', href: '/orders' });
  if (metrics?.failedOrders > 0) attention.push({ tone: 'failed', title: `${metrics.failedOrders} failed order${metrics.failedOrders === 1 ? '' : 's'}`, detail: 'Didn’t make it into Frameworks. Retry or fix them.', href: '/orders?status=failed' });
  if (failedJobs && failedJobs.total > 0) attention.push({ tone: 'failed', title: `${failedJobs.total} failed ShipStation job${failedJobs.total === 1 ? '' : 's'}`, detail: 'Labels printed but not released in Frameworks.', href: '/shipstation?status=failed' });
  if (b2b?.latest?.status === 'failed') attention.push({ tone: 'failed', title: 'Last B2B price sync failed', detail: b2b.latest.error?.slice(0, 120) ?? ago(b2b.latest.finishedAt ?? b2b.latest.createdAt), href: '/b2b-sync' });
  if (stalePending) attention.push({ tone: 'pending', title: `${metrics.pendingOrders} pending order${metrics.pendingOrders === 1 ? '' : 's'}`, detail: `Oldest has waited ${metrics.oldestPendingAge}.`, href: '/orders?status=pending' });
  if (skuErrors.length) attention.push({ tone: 'pending', title: 'SKU audit couldn’t read Shopify', detail: `${skuErrors.join(', ')} on the last run.`, href: '/sku-audit' });
  if (skuMismatch.length) attention.push({ tone: 'pending', title: `${skuMismatch.reduce((s, x) => s + x.n, 0).toLocaleString()} Catsy/Shopify mismatches`, detail: skuMismatch.map(x => `${x.store} ${x.n.toLocaleString()}`).join(' · '), href: '/sku-audit' });

  // ---- 7-day trend ----------------------------------------------------------
  const days = Array.from({ length: daily?.days ?? 7 }, (_, i) => {
    const d = new Date(Date.now() - ((daily?.days ?? 7) - 1 - i) * 864e5);
    return d.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
  });
  const byDay = days.map(day => {
    const rows = daily?.rows.filter(r => r.day === day) ?? [];
    const sum = (status: string) => rows.filter(r => r.status === status).reduce((s, r) => s + r.count, 0);
    return { day, success: sum('success'), failed: sum('failed'), pending: sum('pending'), total: rows.reduce((s, r) => s + r.count, 0) };
  });
  const maxDay = Math.max(1, ...byDay.map(d => d.total));
  const today = daily?.rows.filter(r => r.day === days[days.length - 1]) ?? [];
  const todayByStore = Object.entries(
    today.reduce<Record<string, number>>((acc, r) => ((acc[r.store ?? 'unknown'] = (acc[r.store ?? 'unknown'] ?? 0) + r.count), acc), {}),
  ).sort((a, b) => b[1] - a[1]);
  const todayTotal = todayByStore.reduce((s, [, n]) => s + n, 0);
  const weekTotal = byDay.reduce((s, d) => s + d.total, 0);
  const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-AU', { weekday: 'short' });

  // ---- System health --------------------------------------------------------
  const b2bAt = b2b?.latest?.finishedAt ?? b2b?.latest?.createdAt;
  const health: { label: string; tone: Tone; status: string; sub: string }[] = [
    { label: 'Bridge', tone: !metrics ? 'neutral' : metrics.bridge === 'healthy' ? 'success' : 'failed', status: !metrics ? 'Unknown' : metrics.bridge === 'healthy' ? 'Healthy' : 'Down', sub: 'sof-bridge to Frameworks' },
    // ponytail: freshness thresholds are guesses at each job's schedule; tune if they nag.
    // Orders arrive by Shopify webhook (Sync is only a manual catch-up), so the newest order is the live signal.
    { label: 'Last order in', tone: !metrics ? 'neutral' : hoursSince(metrics.lastOrderAt) < 12 ? 'success' : 'pending', status: !metrics ? 'Unknown' : hoursSince(metrics.lastOrderAt) < 12 ? 'Receiving' : 'Quiet', sub: `${ago(metrics?.lastOrderAt)}${metrics?.lastOrderStore ? ` · ${STORE_LABEL[metrics.lastOrderStore] ?? metrics.lastOrderStore}` : ''}` },
    { label: 'B2B price sync', tone: !b2b?.latest ? 'neutral' : b2b.latest.status === 'failed' ? 'failed' : hoursSince(b2bAt) < 26 ? 'success' : 'pending', status: b2b?.latest ? (b2b.latest.status === 'failed' ? 'Failed' : 'Synced') : 'Unknown', sub: b2b?.latest ? `${ago(b2bAt)}${b2b.latest.itemsSynced != null ? ` · ${b2b.latest.itemsSynced.toLocaleString()} items` : ''}` : 'No runs yet' },
    { label: 'SKU audit', tone: !sku?.latest ? 'neutral' : sku.latest.status !== 'success' ? 'failed' : hoursSince(sku.latest.finishedAt) < 26 ? 'success' : 'pending', status: sku?.latest ? (sku.latest.status === 'success' ? 'Ran' : 'Failed') : 'Unknown', sub: ago(sku?.latest?.finishedAt) },
  ];

  const time = (d: string) => new Date(d).toLocaleTimeString('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

  return (
    <AppShell>
      <PageHeader crumbs={['Dashboard']} />
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">What needs doing, how orders are flowing, and whether every sync is running.</p>
        </div>

        {/* System health strip */}
        <section aria-label="System health" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {health.map(h => (
            <div key={h.label} className="bg-white rounded-xl shadow-card px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted uppercase tracking-[0.07em]">{h.label}</p>
                <StatusPill tone={h.tone}>{h.status}</StatusPill>
              </div>
              <p className="text-sm text-ink mt-2">{h.sub}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Needs attention */}
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">
              Needs attention {attention.length > 0 && <span className="text-muted font-normal">({attention.length})</span>}
            </h2>
            {attention.length === 0 ? (
              <div className="px-5 py-10 flex flex-col items-center gap-2 text-center">
                <CircleCheck className="size-6 text-success" aria-hidden />
                <p className="text-sm text-ink font-medium">All clear</p>
                <p className="text-xs text-muted">No failed orders, jobs or syncs right now.</p>
              </div>
            ) : (
              <ul>
                {attention.map(a => (
                  <li key={a.title} className="border-t border-hair first:border-t-0">
                    <Link href={a.href} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover">
                      <StatusPill tone={a.tone}>{a.tone === 'failed' ? 'Fix' : 'Check'}</StatusPill>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-ink">{a.title}</span>
                        <span className="block text-xs text-muted truncate">{a.detail}</span>
                      </span>
                      <ChevronRight className="size-4 text-muted shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Orders today + 7-day trend */}
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-frame flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Orders</h2>
              <p className="text-xs text-muted">{weekTotal.toLocaleString()} in the last 7 days</p>
            </div>
            {!daily ? (
              <p className="px-5 py-10 text-center text-sm text-muted">Order trend unavailable</p>
            ) : (
              <div className="p-5 grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)]">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-[0.07em]">Today</p>
                  <p className="text-2xl font-semibold text-ink mt-1 tabular-nums">{todayTotal.toLocaleString()}</p>
                  <ul className="mt-2 space-y-1">
                    {todayByStore.map(([s, n]) => (
                      <li key={s} className="flex justify-between text-xs">
                        <span className="text-muted">{STORE_LABEL[s] ?? s}</span>
                        <span className="text-ink tabular-nums">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <figure>
                  <div className="flex gap-4 text-xs text-muted mb-3" aria-hidden>
                    {[['bg-success', 'Processed'], ['bg-pending', 'Pending'], ['bg-failed', 'Failed']].map(([c, l]) => (
                      <span key={l} className="inline-flex items-center gap-1.5">
                        <span className={`size-2 rounded-sm ${c}`} />
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-end gap-2 h-36 border-b border-frame" aria-hidden>
                    {byDay.map(d => (
                      <div
                        key={d.day}
                        title={`${dayLabel(d.day)} ${d.day}: ${d.success} processed, ${d.pending} pending, ${d.failed} failed`}
                        className="group flex-1 h-full flex flex-col justify-end items-center"
                      >
                        <span className="text-[0.6875rem] text-muted tabular-nums mb-1">{d.total || ''}</span>
                        {/* Stacked bottom-up; 2px white gaps keep segments distinct. */}
                        <div className="w-full max-w-10 flex flex-col-reverse gap-[2px] group-hover:opacity-80" style={{ height: `${(d.total / maxDay) * 100}%` }}>
                          {(['success', 'pending', 'failed'] as const)
                            .filter(k => d[k] > 0)
                            .map((k, i, arr) => (
                              <div
                                key={k}
                                className={`${k === 'success' ? 'bg-success' : k === 'pending' ? 'bg-pending' : 'bg-failed'} ${i === arr.length - 1 ? 'rounded-t' : ''}`}
                                style={{ flexGrow: d[k], minHeight: 2 }}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1.5" aria-hidden>
                    {byDay.map(d => (
                      <span key={d.day} className="flex-1 text-center text-[0.6875rem] text-muted">{dayLabel(d.day)}</span>
                    ))}
                  </div>
                  <table className="sr-only">
                    <caption>Orders per day, last 7 days</caption>
                    <thead>
                      <tr><th>Day</th><th>Processed</th><th>Pending</th><th>Failed</th></tr>
                    </thead>
                    <tbody>
                      {byDay.map(d => (
                        <tr key={d.day}><td>{d.day}</td><td>{d.success}</td><td>{d.pending}</td><td>{d.failed}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Team activity */}
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">Team activity</h2>
            <ul>
              {(!team || team.length === 0) && <li className="px-5 py-8 text-center text-sm text-muted">No one has done anything yet</li>}
              {team?.map(t => (
                <li key={t.id} className="flex items-start gap-3 px-5 py-3 border-t border-hair first:border-t-0">
                  <span className="flex-1 min-w-0 text-sm">
                    <span className="text-ink">{actionLabel(t.params)}</span>
                    <span className="block text-xs text-muted truncate">{t.userEmail}</span>
                  </span>
                  {t.result?.ok === false && <StatusPill tone="failed">Failed</StatusPill>}
                  <span className="text-xs text-muted whitespace-nowrap">{time(t.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* System feed (orders + syncs) */}
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">Orders &amp; syncs</h2>
            <ul>
              {(!feed || feed.activity.length === 0) && <li className="px-5 py-8 text-center text-sm text-muted">No recent activity</li>}
              {feed?.activity.map(a => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3 border-t border-hair first:border-t-0">
                  <StatusPill tone={a.type === 'success' ? 'success' : a.type === 'failed' ? 'failed' : a.type === 'enqueued' ? 'pending' : 'neutral'}>
                    {a.type === 'success' ? 'Processed' : a.type === 'enqueued' ? 'Queued' : a.type === 'pull' ? 'Sync' : a.type.charAt(0).toUpperCase() + a.type.slice(1).replace(/_/g, ' ')}
                  </StatusPill>
                  <span className="flex-1 min-w-0 text-sm text-ink truncate">{a.message}</span>
                  <span className="text-xs text-muted whitespace-nowrap">{time(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
