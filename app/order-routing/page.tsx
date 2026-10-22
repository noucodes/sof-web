import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import RoutingMap from '@/components/routing/RoutingMap';
import RoutingTable from '@/components/routing/RoutingTable';
import { TABS, type RoutingOrder } from '@/lib/routing';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ListResponse = { rows: RoutingOrder[]; counts: Record<string, number>; doneToday: number };

async function getRouting(cookieHeader: string, state: string, q?: string): Promise<ListResponse> {
  const qs = new URLSearchParams({ state });
  if (q) qs.set('q', q);
  const res = await fetch(`${API}/routing?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load order routing: ${res.status} ${await res.text()}`);
  return res.json();
}

export default async function OrderRoutingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const params = await searchParams;
  const table = params.view === 'table';
  const tab = TABS.some(t => t.id === params.state) ? params.state : 'open';
  const { rows, counts, doneToday } = await getRouting(cookieHeader, table ? tab : 'open', table ? params.q : undefined);

  const open = Object.entries(counts).filter(([s]) => s !== 'done' && s !== 'rejected').reduce((n, [, c]) => n + c, 0);
  const tabCount = (id: string) => (id === 'open' ? open : id === 'done' ? doneToday : counts[id] ?? 0);
  const cards = [
    { label: 'Awaiting approval', state: 'awaiting_approval', value: counts.awaiting_approval ?? 0, color: 'text-pending' },
    { label: 'Needs review', state: 'needs_review', value: counts.needs_review ?? 0, color: 'text-ink' },
    { label: 'On hold', state: 'on_hold', value: counts.on_hold ?? 0, color: 'text-ink' },
    { label: 'Done today', state: 'done', value: doneToday, color: 'text-success' },
    { label: 'Failed', state: 'failed', value: counts.failed ?? 0, color: 'text-failed' },
  ];
  const href = (p: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries({ view: table ? 'table' : undefined, state: tab === 'open' ? undefined : tab, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/order-routing${qs.size ? `?${qs}` : ''}`;
  };

  return (
    <AppShell>
      <PageHeader crumbs={['Orders', 'Order routing']}>
        <Link href="/order-routing/states" className="text-[0.8125rem] text-primary hover:underline">Order states</Link>
        <nav aria-label="View" className="inline-flex h-9 items-center rounded-lg bg-surface-strong p-1 text-muted">
          {[['Map', href({ view: undefined, state: undefined }), !table], ['Table', href({ view: 'table' }), table]].map(([label, to, active]) => (
            <Link
              key={label as string}
              href={to as string}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none ${active ? 'bg-white text-ink shadow-card' : 'hover:text-ink'}`}
            >
              {label as string}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <div className="space-y-5 p-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold tracking-tight text-ink">Order routing</h1>
          <p className="text-sm text-muted">New online orders on branch 20, checked against stock at every branch. Nothing goes to a supplier or a printer until it’s approved.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {cards.map(c => (
            <Link
              key={c.label}
              href={`/order-routing?view=table&state=${c.state}`}
              aria-current={table && tab === c.state ? 'page' : undefined}
              className={`rounded-xl bg-white p-4 shadow-card transition-colors hover:bg-surface-hover focus-visible:shadow-focus-ring focus-visible:outline-none ${table && tab === c.state ? 'ring-2 ring-primary' : ''}`}
            >
              <p className="text-xs font-medium uppercase tracking-[0.07em] text-muted">{c.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</p>
            </Link>
          ))}
        </div>

        {table ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <nav aria-label="Filter by state" className="flex flex-wrap gap-1 border-b border-frame">
                {TABS.map(t => (
                  <Link
                    key={t.id}
                    href={href({ state: t.id === 'open' ? undefined : t.id })}
                    aria-current={tab === t.id ? 'page' : undefined}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t.id ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted hover:text-ink'}`}
                  >
                    {t.label} <span className="font-mono text-xs">{tabCount(t.id)}</span>
                  </Link>
                ))}
              </nav>
              <form action="/order-routing" className="flex gap-2">
                <input type="hidden" name="view" value="table" />
                {tab !== 'open' && <input type="hidden" name="state" value={tab} />}
                <label className="sr-only" htmlFor="routing-q">Search</label>
                <input id="routing-q" name="q" type="search" defaultValue={params.q} placeholder="Order #, customer or brand" className="h-9 w-72 rounded-lg border-[1.5px] border-frame-input bg-white px-3 text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none" />
              </form>
            </div>
            <RoutingTable rows={rows} />
          </>
        ) : (
          <RoutingMap rows={rows} />
        )}
      </div>
    </AppShell>
  );
}
