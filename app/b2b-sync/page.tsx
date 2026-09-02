import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { readStatus } from '@/lib/statusStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
};

// This page's data comes from lib/statusStore, not sof-api — b2b-push (a
// separate Catsy/Shopify sync, unrelated to the orders/ERP domain sof-api
// owns) posts here directly. There's no sof-api cookie to naturally 401
// against, so we make one cheap authenticated call just to validate the
// session, same as every other page does via its own sof-api fetch.
async function requireSession(cookieHeader: string) {
  const res = await fetch(`${API}/metrics`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

export default async function B2BSyncPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  await requireSession(cookieHeader);

  const { latest, history } = readStatus();

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
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">B2B Price Sync</h1>
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
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-frame">
              <tr>
                {['Status', 'Source', 'Synced', 'Unmatched', 'Finished', 'Error'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-frame">
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No runs recorded yet</td>
                </tr>
              )}
              {history.map((h, i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors duration-100">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${STATUS_COLORS[h.status] ?? 'bg-surface text-muted'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{h.source ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink">{h.itemsSynced ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink">{h.itemsFailed ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{formatDate(h.finishedAt)}</td>
                  <td className="px-4 py-3 text-[0.8125rem] text-failed max-w-[280px] truncate">{h.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
