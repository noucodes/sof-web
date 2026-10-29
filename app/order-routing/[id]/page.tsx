import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import RoutingDecision from '@/components/routing/RoutingDecision';
import { actionLabel, actionSub, fmtTime, stateMeta, type RoutingOrder } from '@/lib/routing';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MAIN_BRANCHES = ['20', '11', '8'];

export default async function RoutingOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const cookieStore = await cookies();
  const res = await fetch(`${API}/routing/${id}`, { headers: { cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ') }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load routing order: ${res.status} ${await res.text()}`);
  const o: RoutingOrder = await res.json();

  const meta = stateMeta(o.state);
  const label = o.customerOrderNo ?? o.orderNo;
  const lines = o.lines ?? [];
  const d = o.detail ?? {};
  const facts = [
    ['Supplier', [d.supplierName, d.supplier].filter(Boolean).join(' · ')],
    ['Ship to', d.shipTo],
    ['Printer', d.printer],
    ['Branch', d.branch],
    ['PO value', d.poValue != null ? `$${d.poValue.toFixed(2)} ex GST` : null],
    ['PO number', d.poNumber],
    ['Rejected because', d.rejectReason],
    ['Approved by', o.approvedBy && `${o.approvedBy}${o.approvedAt ? `, ${fmtTime(o.approvedAt)}` : ''}`],
  ].filter(([, v]) => v);

  return (
    <AppShell>
      <PageHeader crumbs={['Orders', { label: 'Order routing', href: '/order-routing' }, label]} />
      <div className="space-y-5 p-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-lg font-semibold">{label}</h1>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
          <p className="text-sm text-muted">
            SO <span className="font-mono">{o.orderNo}</span> · {o.customerName ?? 'Unknown customer'} · {o.brand ?? 'Mixed brands'}
            {o.despatchMethod && ` · ${o.despatchMethod}`} · first seen <span className="font-mono">{fmtTime(o.createdAt)}</span>
          </p>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <section aria-labelledby="pa" className="space-y-4 rounded-xl bg-white p-5 shadow-card">
              <div>
                <h2 id="pa" className="text-[0.9375rem] font-semibold">{o.action ? actionLabel(o.action) : o.state === 'on_hold' ? 'On hold' : 'No action proposed'}</h2>
                <p className="text-sm text-muted">{actionSub(o) ?? meta.meaning}</p>
              </div>
              {facts.length > 0 && (
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {facts.map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{k}</dt>
                      <dd className="mt-0.5 text-sm">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {!!o.flags?.length && (
                <div className="space-y-2">
                  {o.flags.map(f => <div key={f} className="rounded-lg bg-pending-bg px-3.5 py-2.5 text-sm text-pending">{f}</div>)}
                </div>
              )}
              {o.error && <div className="rounded-lg bg-failed-bg px-3.5 py-2.5 text-sm text-failed">{o.error}</div>}
              <RoutingDecision order={o} />
            </section>

            <section aria-labelledby="ls" className="overflow-hidden rounded-xl bg-white shadow-card">
              <div className="border-b border-frame px-5 py-4">
                <h2 id="ls" className="text-[0.9375rem] font-semibold">Lines and available stock</h2>
                <p className="text-[0.8125rem] text-muted">Available only. Stock on hand that’s already allocated doesn’t count. Branch 998 is display stock and is never used.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface text-left text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
                      {['Product', 'Qty', 'Ecom 20', 'Dandenong 11', 'Branch 8', 'Other branches'].map(h => <th key={h} scope="col" className="border-b border-frame px-4 py-2.5">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const others = Object.entries(l.available ?? {}).filter(([b, n]) => !MAIN_BRANCHES.includes(b) && b !== '998' && n > 0);
                      return (
                        <tr key={i} className={`border-b border-hair last:border-0 ${l.skip ? 'text-muted' : ''}`}>
                          <td className="px-4 py-3"><span className="font-mono text-[0.8125rem]">{l.code}</span>{l.desc && <div className="text-[0.8125rem] text-muted">{l.desc}</div>}</td>
                          <td className="px-4 py-3 font-mono text-[0.8125rem]">{l.qty}</td>
                          {MAIN_BRANCHES.map(b => (
                            <td key={b} className="px-4 py-3 font-mono text-[0.8125rem]">
                              {l.skip ? '—' : l.available?.[b] ?? 0}
                              {!l.skip && !l.available?.[b] && !!l.onHand?.[b] && <span className="text-muted"> · {l.onHand[b]} on hand</span>}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-[0.8125rem]">{l.skip ? 'Never ordered' : others.length ? others.map(([b, n]) => `${b}: ${n}`).join(', ') : 'None'}</td>
                        </tr>
                      );
                    })}
                    {!lines.length && <tr><td colSpan={6} className="py-8 text-center text-muted">No lines recorded.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section aria-labelledby="hi" className="space-y-3 rounded-xl bg-white p-5 shadow-card">
            <h2 id="hi" className="text-[0.9375rem] font-semibold">History</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {(o.history ?? []).map((h, i, a) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i === a.length - 1 ? 'bg-pending' : 'bg-primary'}`} />
                  <div className="flex flex-col">
                    <span className={i === a.length - 1 ? 'font-medium' : ''}>{h.text}</span>
                    <span className="font-mono text-xs text-muted">{fmtTime(h.at)}{h.by && ` · ${h.by}`}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
