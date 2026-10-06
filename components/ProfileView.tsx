import { formatDistanceToNowStrict } from 'date-fns';
import ActivityTimeline from '@/components/ActivityTimeline';
import StatusPill from '@/components/StatusPill';
import { RoleBadge, UserAvatar } from '@/components/UserBits';
import { pageLabel, type ActivityEntry } from '@/lib/activity';
import { ROLES } from '@/lib/roles';

export type Profile = { id: number; email: string; role: string; isActive: boolean; createdAt: string };
export type Activity = {
  users: { userEmail: string; views: number; actions: number; lastSeen: string | null }[];
  pages: { path: string; views: number; lastAt: string }[];
  entries: ActivityEntry[];
};

const date = (d: string) => new Date(d).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'long', year: 'numeric' });

// Shared by Admin › Users › <person> and My profile: who they are, their last
// 30 days at a glance, and the full timeline. `side` is the editable panel.
export default function ProfileView({ user, activity, side, sideTitle, isMe }: { user: Profile; activity: Activity | null; side: React.ReactNode; sideTitle: string; isMe?: boolean }) {
  const stats = activity?.users[0];
  const role = ROLES.find(r => r.key === user.role);
  const pages = (activity?.pages ?? []).slice(0, 6);
  const max = pages[0]?.views ?? 1;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-card p-5 flex flex-wrap items-center gap-4">
        <UserAvatar email={user.email} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-ink tracking-tight truncate">{user.email}</h1>
            {isMe && <span className="rounded bg-surface-strong px-1.5 text-[0.6875rem] text-muted">You</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <RoleBadge role={user.role} />
            <StatusPill tone={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Active' : 'Deactivated'}</StatusPill>
            <span>Added {date(user.createdAt)}</span>
            <span aria-hidden>·</span>
            <span>Last seen {stats?.lastSeen ? `${formatDistanceToNowStrict(new Date(stats.lastSeen))} ago` : 'never'}</span>
          </div>
        </div>
        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Page views</dt>
            <dd className="text-xl font-semibold tabular-nums text-ink">{(stats?.views ?? 0).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Actions</dt>
            <dd className="text-xl font-semibold tabular-nums text-ink">{(stats?.actions ?? 0).toLocaleString()}</dd>
          </div>
        </dl>
        <p className="basis-full text-[0.6875rem] text-muted">Counts cover the last 30 days.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="bg-white rounded-xl shadow-card overflow-hidden">
          <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">{sideTitle}</h2>
          {side}
        </section>

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">What {role?.label ?? user.role}s can do</h2>
            <ul className="px-5 py-3 space-y-1.5 text-sm text-ink">
              {role?.can.map(c => (
                <li key={c} className="flex gap-2"><span className="text-success" aria-hidden>✓</span>{c}</li>
              ))}
              {user.role === 'viewer' && <li className="flex gap-2 text-muted"><span aria-hidden>✕</span>Can’t retry, sync, fix or change anything</li>}
            </ul>
          </section>

          <section className="bg-white rounded-xl shadow-card overflow-hidden">
            <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">Most visited pages</h2>
            <ul className="px-5 py-3 space-y-3">
              {pages.length === 0 && <li className="py-4 text-center text-sm text-muted">No page views in the last 30 days</li>}
              {pages.map(p => (
                <li key={p.path}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{pageLabel(p.path)}</span>
                    <span className="tabular-nums text-muted">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-strong">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(p.views / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <h2 className="px-5 py-4 border-b border-frame text-sm font-semibold text-ink">Activity <span className="font-normal text-muted">· last 30 days</span></h2>
        {activity ? (
          <ActivityTimeline entries={activity.entries} showUser={false} emptyText="No activity in the last 30 days" />
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted">Activity unavailable</p>
        )}
      </section>
    </div>
  );
}
