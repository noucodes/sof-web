import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill, { type Tone } from '@/components/StatusPill';
import { TableSkeleton } from '@/components/PageLoading';
import ContributionFilters from '@/components/ContributionFilters';
import RowSheet from '@/components/RowSheet';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Row = {
  orderName: string;
  storeLabel: string;
  refundedAt: string | null;
  shopifyAmount: number | null;
  gateways: string[];
  frameworks: { type: string; number: number; amount: number; date: string | null }[];
  frameworksAmount: number | null;
  status: 'matched' | 'voided' | 'differs' | 'missing' | 'frameworks_only';
};
type Data = {
  from: string;
  to: string;
  rows: Row[];
  errors: string[];
  summary: { shopifyTotal: number; frameworksTotal: number; needsAttention: number };
};

const STATUS: Record<Row['status'], { tone: Tone; label: string; help: string }> = {
  matched: { tone: 'success', label: 'Matched', help: 'Frameworks has a credit note for the same amount.' },
  voided: { tone: 'success', label: 'Order voided', help: 'The order was cancelled in Frameworks before it was invoiced, so no credit note is needed.' },
  differs: { tone: 'pending', label: 'Amount differs', help: 'Frameworks has a credit note, but not for the amount Shopify refunded.' },
  missing: { tone: 'failed', label: 'Not in Frameworks', help: 'Shopify refunded the customer, but Frameworks has no credit note and the order isn’t voided.' },
  frameworks_only: { tone: 'pending', label: 'Frameworks only', help: 'Frameworks has a credit note in these dates, but Shopify has no refund for the order in these dates.' },
};
const ATTENTION = new Set<Row['status']>(['differs', 'missing', 'frameworks_only']);

async function getRefunds(cookieHeader: string, params: Record<string, string>): Promise<Data> {
  const qs = new URLSearchParams();
  for (const key of ['store', 'from', 'to']) if (params[key] && params[key] !== 'all') qs.set(key, params[key]);
  const res = await fetch(`${API}/orders/refunds?${qs}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to load refunds');
  return res.json();
}

const money = (n: number | null) => (n == null ? '—' : `$${n.toFixed(2)}`);
const ymd = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-AU');

export default async function RefundsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const attentionOnly = params.attention === '1';
  const toggle = new URLSearchParams(params);
  if (attentionOnly) toggle.delete('attention');
  else toggle.set('attention', '1');

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const data = getRefunds(cookieHeader, params);
  const key = new URLSearchParams(params).toString();

  return (
    <AppShell>
      <PageHeader crumbs={['Refunds']}>
        <Button asChild size="sm" variant={attentionOnly ? 'default' : 'outline'}>
          <Link href={`/refunds?${toggle}`} aria-pressed={attentionOnly}>
            {attentionOnly ? 'Showing what needs attention' : 'Show what needs attention'}
          </Link>
        </Button>
      </PageHeader>
      <div className="p-4 md:p-6 space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Refunds</h1>
          <p className="text-sm text-muted">
            Every Shopify refund next to the Frameworks credit note or voided order for the same order. Dates filter on the refund date; the last 7 days if none are picked.
          </p>
        </div>

        <Suspense>
          <ContributionFilters basePath="/refunds" showStatus={false} />
        </Suspense>

        <Suspense key={key} fallback={<TableSkeleton columns={7} />}>
          <RefundsContent data={data} attentionOnly={attentionOnly} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function RefundsContent({ data, attentionOnly }: { data: Promise<Data>; attentionOnly: boolean }) {
  const { from, to, rows, errors, summary } = await data;
  const visible = attentionOnly ? rows.filter(r => ATTENTION.has(r.status)) : rows;

  return (
    <>
      {errors.map(e => (
        <div key={e} role="alert" className="px-4 py-3 rounded-lg bg-failed-bg text-failed text-sm">{e}</div>
      ))}

      <p className="text-sm text-muted">
        {ymd(from)} – {ymd(to)}: Shopify refunded <span className="font-medium text-ink tabular-nums">{money(summary.shopifyTotal)}</span>, Frameworks credit notes{' '}
        <span className="font-medium text-ink tabular-nums">{money(summary.frameworksTotal)}</span>.{' '}
        {summary.needsAttention > 0 ? (
          <span className="font-medium text-pending">{summary.needsAttention} need{summary.needsAttention === 1 ? 's' : ''} attention.</span>
        ) : (
          <span className="font-medium text-success">Everything matches.</span>
        )}
      </p>

      <div className="bg-white rounded-xl shadow-card overflow-x-auto">
        <RowSheet>
        <table data-compact className="stack-table w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              {['Shopify Order', 'Store', 'Refunded', 'Shopify Refund', 'Frameworks', 'Frameworks Credit', 'Status'].map(h => (
                <th key={h} className={`${h === 'Shopify Refund' || h === 'Frameworks Credit' ? 'text-right' : 'text-left'} px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  {attentionOnly ? 'Nothing needs attention in these dates' : 'No refunds in these dates'}
                </td>
              </tr>
            )}
            {visible.map(r => {
              const s = STATUS[r.status];
              return (
                <tr key={`${r.storeLabel}${r.orderName}`} className="border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100">
                  <td data-primary className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{r.orderName}</td>
                  <td data-label="Store" className="px-4 py-3 text-ink">{r.storeLabel}</td>
                  <td data-label="Refunded" className="px-4 py-3 font-mono text-[0.8125rem] text-muted">
                    {r.refundedAt ? new Date(r.refundedAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }) : '—'}
                  </td>
                  <td data-label="Shopify refund" data-key className="px-4 py-3 text-right tabular-nums text-ink">
                    {money(r.shopifyAmount)}
                    {r.gateways.some(g => g !== 'shopify_payments') && (
                      <span className="block text-[0.75rem] text-muted">{r.gateways.map(g => g.replace(/_/g, ' ')).join(' + ')}</span>
                    )}
                  </td>
                  <td data-label="Frameworks" className="px-4 py-3 text-muted">
                    {r.frameworks.length
                      ? r.frameworks.map(f => (
                          <span key={f.number} className="block">
                            {f.type} <span className="font-mono text-[0.8125rem]">{f.number}</span>
                          </span>
                        ))
                      : '—'}
                  </td>
                  <td data-label="Frameworks credit" className="px-4 py-3 text-right tabular-nums text-ink">{money(r.frameworksAmount)}</td>
                  <td data-label="Status" data-key className="px-4 py-3">
                    <StatusPill tone={s.tone}>{s.label}</StatusPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </RowSheet>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-[0.8125rem] text-muted sm:grid-cols-[auto_1fr]">
        {Object.values(STATUS).map(s => (
          <div key={s.label} className="contents">
            <dt><StatusPill tone={s.tone}>{s.label}</StatusPill></dt>
            <dd>{s.help}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
