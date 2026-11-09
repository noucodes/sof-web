'use client';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StatusPill, { type Tone } from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';
import RejectDialog from '@/components/routing/RejectDialog';

export type CreditLine = {
  code: string; desc?: string; qty: number; stockType?: string | null; onHand?: number | null; lastBuyCost?: number | null;
  supplier?: string | null; supplierName?: string | null; action: 'return' | 'none' | 'check'; why: string;
};
export type SupplierCredit = {
  id: number; creditNo: string; state: string; branchId: number | null; customerName: string | null; creditDate: string | null;
  total: number | null; reason: { code: string | null; desc: string | null; mapped: string | null } | null;
  lines: CreditLine[] | null; flags: string[] | null; history: { at: string; text: string; by?: string }[] | null;
};

const STATE: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'Waiting to be read', tone: 'neutral' },
  planned: { label: 'Awaiting approval', tone: 'pending' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'failed' },
};
const ACTION: Record<CreditLine['action'], { label: string; tone: Tone }> = {
  return: { label: 'Return to supplier', tone: 'info' },
  none: { label: 'Back on the shelf', tone: 'neutral' },
  check: { label: 'Check first', tone: 'pending' },
};
const money = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' }));

async function post(path: string, body: unknown) {
  const res = await fetch(`/api/supplier-credits${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Something went wrong');
  return data;
}

function AddCredits() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const creditNos = text.split(/[\s,]+/).filter(Boolean);

  async function add() {
    setBusy(true);
    try {
      const r = await post('', { creditNos });
      toast.success(`${r.added.length} credit${r.added.length === 1 ? '' : 's'} added${r.alreadyThere.length ? `, ${r.alreadyThere.length} already on the list` : ''}. Reading them from Frameworks now: the plan shows here in a few seconds.`);
      setText('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-card">
      <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Completed customer credit numbers</span>
        <textarea
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. 797250, 799256 (one per line or comma separated)"
          className="resize-y rounded-lg border-[1.5px] border-frame-input bg-white px-3 py-2 font-mono text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none"
        />
      </label>
      <Button disabled={!creditNos.length || busy} onClick={add}>
        {busy && <Loader2 className="animate-spin" />}Add {creditNos.length > 1 ? `${creditNos.length} credits` : 'credit'}
      </Button>
    </div>
  );
}

export default function SupplierCredits({ rows }: { rows: SupplierCredit[] }) {
  const router = useRouter();
  const canAct = useCanAct();
  // While a credit is waiting to be read, refresh every 5 s so its plan shows up by itself
  // (the job reads new credits within ~15 s). ponytail: gives up after 3 min, e.g. job down.
  const waiting = rows.some(r => r.state === 'new');
  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const t = setInterval(() => (Date.now() - started > 180_000 ? clearInterval(t) : router.refresh()), 5000);
    return () => clearInterval(t);
  }, [waiting, router]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SupplierCredit | null>(null);
  const toggle = (id: number) => setOpen(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function act(c: SupplierCredit, verb: 'approve' | 'reject', body: Record<string, unknown> = {}) {
    setBusy(`${c.id}:${verb}`);
    try {
      await post(`/${c.id}/${verb}`, body);
      toast.success(`Credit ${c.creditNo} ${verb === 'approve' ? 'approved' : 'rejected'}`);
      setRejecting(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {canAct && <AddCredits />}
      {!rows.length ? (
        <p className="rounded-lg bg-white py-16 text-center text-sm text-muted shadow-card">No credits yet. Add a completed customer credit number above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-card">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-left text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
                {['', 'Credit', 'Branch', 'Customer', 'Reason', 'Plan', 'Flags', 'State', ''].map((h, i) => (
                  <th key={i} scope="col" className="border-b border-frame px-4 py-2.5">{h || <span className="sr-only">{i ? 'Actions' : 'Expand'}</span>}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const lines = c.lines ?? [];
                const isOpen = open.has(c.id);
                const toReturn = lines.filter(l => l.action === 'return').length;
                const state = STATE[c.state] ?? { label: c.state, tone: 'neutral' as Tone };
                return (
                  <Fragment key={c.id}>
                    <tr className="border-b border-hair align-top hover:bg-surface-hover">
                      <td className="py-3 pl-4">
                        <Button variant="ghost" size="icon" className="h-6 w-6" aria-expanded={isOpen} aria-label={`Show lines and history for credit ${c.creditNo}`} onClick={() => toggle(c.id)}>
                          {isOpen ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-mono text-[0.8125rem] font-medium">{c.creditNo}</div>
                        <div className="text-xs text-muted">{c.creditDate ?? ''} {c.total != null && `· ${money(c.total)}`}</div>
                      </td>
                      <td className="px-4 py-3">{c.branchId ?? '—'}</td>
                      <td className="px-4 py-3">{c.customerName ?? '—'}</td>
                      <td className="px-4 py-3">
                        {c.reason ? (
                          <>
                            <div>{c.reason.desc || c.reason.code}</div>
                            <div className="text-xs text-muted">{c.reason.mapped ? `→ ${c.reason.mapped}` : 'Not mapped: you choose'}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.history?.at(-1)?.text ?? '—'}</div>
                        {!!lines.length && <div className="text-xs text-muted">{lines.length} line{lines.length === 1 ? '' : 's'} · {toReturn} to return</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {(c.flags ?? []).map(f => <span key={f} className="rounded-md bg-pending-bg px-2 py-px text-xs text-pending">{f}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusPill tone={state.tone}>{state.label}</StatusPill></td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        {canAct && c.state === 'planned' && (
                          <div className="flex justify-end gap-2">
                            {toReturn > 0 && (
                              <Button size="sm" disabled={busy === `${c.id}:approve`} onClick={() => act(c, 'approve')}>
                                {busy === `${c.id}:approve` && <Loader2 className="animate-spin" />}Approve
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setRejecting(c)}>Reject</Button>
                          </div>
                        )}
                        {canAct && c.state === 'new' && <Button size="sm" variant="outline" onClick={() => setRejecting(c)}>Remove</Button>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-hair bg-surface">
                        <td />
                        <td colSpan={8} className="space-y-4 px-4 py-4">
                          {lines.length ? (
                            <table className="w-full border-collapse text-[0.8125rem]">
                              <thead>
                                <tr className="text-left text-[0.6875rem] uppercase tracking-[0.07em] text-muted">
                                  {['Product', 'Qty', 'Branch stock type', 'On hand', 'Last buy cost', 'Supplier', 'Action'].map(h => <th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {lines.map(l => (
                                  <tr key={l.code} className="align-top">
                                    <td className="py-1.5 pr-4"><span className="font-mono">{l.code}</span><div className="text-xs text-muted">{l.desc}</div></td>
                                    <td className="py-1.5 pr-4 font-mono">{l.qty}</td>
                                    <td className="py-1.5 pr-4">{l.stockType ?? '—'}</td>
                                    <td className="py-1.5 pr-4 font-mono">{l.onHand ?? '—'}</td>
                                    <td className="py-1.5 pr-4 font-mono">{money(l.lastBuyCost)}</td>
                                    <td className="py-1.5 pr-4">{l.supplier ?? '—'}<div className="text-xs text-muted">{l.supplierName}</div></td>
                                    <td className="py-1.5 pr-4"><StatusPill tone={ACTION[l.action].tone}>{ACTION[l.action].label}</StatusPill><div className="mt-1 text-xs text-muted">{l.why}</div></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-muted">No lines read yet.</p>
                          )}
                          <ol className="space-y-1 text-xs text-muted">
                            {(c.history ?? []).map((h, i) => (
                              <li key={i}><span className="font-mono">{new Date(h.at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</span> · {h.text}{h.by && ` · ${h.by}`}</li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rejecting && (
        <RejectDialog
          label={`credit ${rejecting.creditNo}`}
          hint="Say why the plan is wrong and what should be done instead, e.g. “Already returned on PO 10820281” or “Wrong number, it's 797251”. Nothing is raised in Frameworks."
          busy={busy === `${rejecting.id}:reject`}
          onReject={reason => act(rejecting, 'reject', { reason })}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}
