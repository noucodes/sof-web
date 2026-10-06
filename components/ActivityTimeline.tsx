import Link from 'next/link';
import StatusPill from '@/components/StatusPill';
import { actionLabel, pageLabel, type ActivityEntry } from '@/lib/activity';
import { roleLabel } from '@/lib/roles';

const when = (d: string) => new Date(d).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' });
const TH = 'px-4 py-[10px] text-left text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';

// Field names people know, for the "what it sent" lines.
const FIELD: Record<string, string> = {
  stores: 'Stores',
  startDate: 'From',
  endDate: 'To',
  financialStatus: 'Payment status',
  dryRun: 'Preview only',
  days: 'Days',
  error: 'Errors matching',
  orders: 'Orders',
  notifyCustomer: 'Email customer',
  email: 'Email',
  role: 'Role',
  isActive: 'Active',
};

const show = (v: unknown): string => {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) return v.length > 3 ? `${v.length} items` : v.map(show).join(', ');
  if (typeof v === 'object') return `${Object.keys(v).length} fields`;
  return String(v);
};

// "Role: Viewer → Operator", "Status: Active → Inactive", "Password: changed".
function changeLines(changes: Record<string, [unknown, unknown]>) {
  return Object.entries(changes).map(([field, [from, to]]) => {
    if (field === 'password') return 'Password changed';
    if (field === 'isActive') return `Status: ${from ? 'Active' : 'Inactive'} → ${to ? 'Active' : 'Inactive'}`;
    if (field === 'role') return from == null ? `Role: ${roleLabel(String(to))}` : `Role: ${roleLabel(String(from))} → ${roleLabel(String(to))}`;
    return `${FIELD[field] ?? field}: ${show(from)} → ${show(to)}`;
  });
}

function Details({ e }: { e: ActivityEntry }) {
  const p = e.params ?? {};
  const lines: string[] = [];
  if (p.target) lines.push(p.target);
  if (p.changes) lines.push(...changeLines(p.changes));
  // What it sent, unless the before/after above already says it.
  else if (p.body)
    for (const [k, v] of Object.entries(p.body)) {
      if (v === '[hidden]') continue;
      lines.push(`${FIELD[k] ?? k}: ${show(v)}`);
    }
  const res = e.result?.response as { message?: string; count?: number } | undefined;
  const outcome = e.result?.ok === false ? e.result.error : res?.message ?? (typeof res?.count === 'number' ? `${res.count} affected` : undefined);

  if (!lines.length && !outcome) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted">
      {lines.map(l => <li key={l}>{l}</li>)}
      {outcome && <li className={e.result?.ok === false ? 'text-failed' : 'text-ink'}>→ {outcome}</li>}
    </ul>
  );
}

// One row per page opened or button pressed: when, who, what, which page, and the specifics.
export default function ActivityTimeline({ entries, showUser = true, emptyText = 'Nothing yet' }: { entries: ActivityEntry[]; showUser?: boolean; emptyText?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-strong border-b border-frame">
          <tr>
            <th className={`${TH} w-44`}>When</th>
            {showUser && <th className={TH}>Who</th>}
            <th className={TH}>What</th>
            <th className={TH}>On page</th>
            <th className={`${TH} w-24`}>Result</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan={showUser ? 5 : 4} className="px-4 py-10 text-center text-muted">{emptyText}</td>
            </tr>
          )}
          {entries.map(e => {
            const view = e.action === 'page_view';
            const page = view ? e.params?.path : e.params?.page;
            return (
              <tr key={e.id} className="border-t border-hair first:border-t-0 align-top hover:bg-surface-hover">
                <td className="px-4 py-2.5 text-muted whitespace-nowrap">{when(e.createdAt)}</td>
                {showUser && <td className="px-4 py-2.5 text-ink">{e.userEmail}</td>}
                <td className="px-4 py-2.5">
                  {view ? (
                    <span className="text-muted">Opened the page</span>
                  ) : (
                    <>
                      <span className="font-medium text-ink">{actionLabel(e.params)}</span>
                      <Details e={e} />
                    </>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {page ? (
                    <Link href={page} className="text-primary hover:underline">{pageLabel(page.split('?')[0])}</Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5" title={e.result?.error}>
                  {!view && <StatusPill tone={e.result?.ok ? 'success' : 'failed'}>{e.result?.ok ? 'Done' : 'Failed'}</StatusPill>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
