import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ActivityTimeline from '@/components/ActivityTimeline';
import { pageLabel, type ActivityEntry } from '@/lib/activity';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const RANGES = [7, 30, 90];

type Activity = {
  users: { userEmail: string; views: number; actions: number; lastSeen: string | null }[];
  pages: { userEmail: string; path: string; views: number; lastAt: string }[];
  entries: ActivityEntry[];
};

async function getActivity(cookieHeader: string, qs: string): Promise<Activity> {
  const res = await fetch(`${API}/audit/activity?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to load activity: ${res.status} ${await res.text()}`);
  return res.json();
}

const ago = (d: string | null) => (d ? `${formatDistanceToNowStrict(new Date(d))} ago` : '—');
const TH = 'px-4 py-[10px] text-left text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ user?: string; days?: string }> }) {
  const { user, days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30;
  const qs = new URLSearchParams({ days: String(days), ...(user && { user }) });
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const { users, pages, entries } = await getActivity(cookieHeader, qs.toString());

  const href = (p: { user?: string | null; days?: number }) => {
    const next = new URLSearchParams({ days: String(p.days ?? days) });
    const u = p.user === undefined ? user : p.user;
    if (u) next.set('user', u);
    return `/admin/activity?${next}`;
  };

  // Top pages for the selected user, or across everyone when no one is picked.
  const topPages = Object.values(
    pages.reduce<Record<string, { path: string; views: number; lastAt: string }>>((acc, p) => {
      const a = (acc[p.path] ??= { path: p.path, views: 0, lastAt: p.lastAt });
      a.views += p.views;
      if (p.lastAt > a.lastAt) a.lastAt = p.lastAt;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  const maxViews = topPages[0]?.views ?? 1;

  return (
    <AppShell>
      <PageHeader crumbs={['Admin', 'User activity']} />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">User activity</h1>
            <p className="text-sm text-muted">Where each person goes in the portal and what they did. Page views and actions only; nothing they type is stored.</p>
          </div>
          <nav aria-label="Date range" className="flex gap-1">
            {RANGES.map(d => (
              <Link
                key={d}
                href={href({ days: d })}
                aria-current={d === days ? 'page' : undefined}
                className={`rounded-md px-2.5 py-1 text-[0.8125rem] ${d === days ? 'bg-primary-wash text-primary font-semibold' : 'text-muted hover:text-ink'}`}
              >
                {d} days
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">People</h2>
            <table className="w-full text-sm">
              <thead className="bg-surface-strong border-b border-frame">
                <tr>
                  <th className={TH}>User</th>
                  <th className={`${TH} !text-right`}>Page views</th>
                  <th className={`${TH} !text-right`}>Actions</th>
                  <th className={TH}>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">No activity in the last {days} days</td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u.userEmail} className={`border-t border-hair first:border-t-0 ${u.userEmail === user ? 'bg-primary-wash' : 'hover:bg-surface-hover'}`}>
                    <td className="px-4 py-2">
                      <Link href={href({ user: u.userEmail })} className="text-primary hover:underline">{u.userEmail}</Link>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{u.views.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{u.actions.toLocaleString()}</td>
                    <td className="px-4 py-2 text-muted">{ago(u.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {user && (
              <p className="px-5 py-3 border-t border-hair text-xs">
                Showing <span className="font-medium text-ink">{user}</span> only.{' '}
                <Link href={href({ user: null })} className="text-primary hover:underline">Show everyone</Link>
              </p>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">
              Most visited pages{user ? ` for ${user}` : ''}
            </h2>
            <ul className="px-5 py-3 space-y-3">
              {topPages.length === 0 && <li className="py-6 text-center text-sm text-muted">No page views yet</li>}
              {topPages.map(p => (
                <li key={p.path}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink truncate">{pageLabel(p.path)}</span>
                    <span className="text-muted tabular-nums">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-strong">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="bg-white rounded-xl shadow-card overflow-hidden">
          <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">Timeline</h2>
          <ActivityTimeline entries={entries} showUser={!user} />
          {entries.length >= 300 && <p className="px-5 py-3 border-t border-hair text-xs text-muted">Showing the latest 300 entries.</p>}
        </section>
      </div>
    </AppShell>
  );
}
