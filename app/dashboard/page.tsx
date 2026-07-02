import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getMetrics(cookieHeader: string) {
  const [metricsRes, activityRes] = await Promise.all([
    fetch(`${API}/metrics`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${API}/metrics/activity?limit=10`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
  ]);
  if (metricsRes.status === 401) redirect('/login');
  const metrics = await metricsRes.json();
  const { activity } = await activityRes.json();
  return { metrics, activity };
}

const ACTIVITY_COLORS: Record<string, string> = {
  success: 'text-success',
  failed: 'text-failed',
  enqueued: 'text-pending',
  pull: 'text-primary',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const { metrics, activity } = await getMetrics(cookieHeader);

  const cards = [
    { label: 'Pending orders', value: metrics.pendingOrders, sub: metrics.oldestPendingAge ? `Oldest: ${metrics.oldestPendingAge}` : null, color: 'text-pending' },
    { label: 'Failed orders', value: metrics.failedOrders, sub: null, color: 'text-failed' },
    { label: 'Bridge', value: metrics.bridge === 'healthy' ? 'Healthy' : 'Down', sub: null, color: metrics.bridge === 'healthy' ? 'text-success' : 'text-failed' },
    { label: 'Last sync', value: metrics.lastSync ? new Date(metrics.lastSync).toLocaleTimeString() : '—', sub: metrics.lastSync ? new Date(metrics.lastSync).toLocaleDateString() : null, color: 'text-ink' },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow-card p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-[0.07em]">{c.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
              {c.sub && <p className="text-xs text-muted mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-frame">
            <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
          </div>
          <ul className="divide-y divide-frame">
            {activity.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted">No recent activity</li>
            )}
            {activity.map((a: any) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-0.5 text-xs font-medium uppercase tracking-wide ${ACTIVITY_COLORS[a.type] ?? 'text-muted'}`}>
                  {a.type}
                </span>
                <span className="text-sm text-ink flex-1">{a.message}</span>
                <span className="text-xs text-muted whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
