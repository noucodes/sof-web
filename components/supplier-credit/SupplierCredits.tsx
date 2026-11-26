'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronDown, ChevronRight, Columns3, Inbox, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StatusPill, { type Tone } from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';
import RejectDialog from '@/components/routing/RejectDialog';
import { cn } from '@/lib/utils';

export type CreditLine = {
  code: string; desc?: string; qty: number; stockType?: string | null; onHand?: number | null; lastBuyCost?: number | null;
  supplier?: string | null; supplierName?: string | null; action: 'return' | 'none' | 'check'; why: string;
};
export type SupplierCredit = {
  id: number; creditNo: string; state: string; branchId: number | null; customerName: string | null; creditDate: string | null;
  total: number | null; reason: { code: string | null; desc: string | null; mapped: string | null } | null;
  lines: CreditLine[] | null; flags: string[] | null; history: { at: string; text: string; by?: string }[] | null;
  sendOut?: SendOut[] | null;
};
export type SendOut = {
  po: string; supplier: string; supplierName?: string | null; stage: 'store' | 'ready' | 'sent' | 'failed' | 'receipted'; link: string;
  enteredBy?: string; note?: string; sentAt?: string; receiptedAt?: string;
};

// Where a credit is in its life: approve → raised (store enters cartons/pallets) → supplier emailed
// → receipted out 7 days later. Anything stuck lands in Problems so it can't be missed.
type Bucket = 'approve' | 'store' | 'supplier' | 'problem' | 'done';
const BUCKETS: { id: Bucket; label: string; hint: string }[] = [
  { id: 'approve', label: 'Needs approval', hint: 'Check the plan, then approve or reject.' },
  { id: 'store', label: 'Waiting on store', hint: 'The store enters cartons and pallets on its link.' },
  { id: 'supplier', label: 'With supplier', hint: 'Supplier emailed. Receipted out after 7 days.' },
  { id: 'problem', label: 'Problems', hint: 'Needs someone to step in.' },
  { id: 'done', label: 'Done', hint: 'Receipted out or rejected.' },
];

function bucketOf(c: SupplierCredit): Bucket {
  const so = c.sendOut ?? [];
  if (c.state === 'rejected') return 'done';
  if (c.state === 'failed' || /^PARTLY raised/.test(c.history?.at(-1)?.text ?? '') || so.some(s => s.stage === 'failed')) return 'problem';
  if (c.state === 'new' || c.state === 'planned' || c.state === 'approved') return 'approve';
  if (!so.length) return 'done'; // raised before send-outs existed
  if (so.some(s => s.stage === 'store' || s.stage === 'ready')) return 'store';
  if (so.some(s => s.stage === 'sent')) return 'supplier';
  return 'done';
}

const STATE: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'Reading from Frameworks…', tone: 'neutral' },
  planned: { label: 'Needs your approval', tone: 'pending' },
  approved: { label: 'Approved: raising…', tone: 'pending' },
  raised: { label: 'Raised', tone: 'success' },
  failed: { label: 'Not raised: approve to retry', tone: 'failed' },
  rejected: { label: 'Rejected', tone: 'neutral' },
};
const SEND: Record<SendOut['stage'], { label: string; tone: Tone }> = {
  store: { label: 'Waiting for store', tone: 'pending' },
  ready: { label: 'Emailing supplier…', tone: 'pending' },
  sent: { label: 'Supplier emailed', tone: 'success' },
  failed: { label: 'Supplier email failed', tone: 'failed' },
  receipted: { label: 'Receipted out', tone: 'success' },
};
const ACTION: Record<CreditLine['action'], { label: string; tone: Tone }> = {
  return: { label: 'Return to supplier', tone: 'info' },
  none: { label: 'Back on the shelf', tone: 'neutral' },
  check: { label: 'Check first', tone: 'pending' },
};
const money = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' }));
const DAY = 86_400_000;
const shortDate = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' });

// One plain sentence for the plan: what happens if you approve.
function planText(c: SupplierCredit) {
  const lines = c.lines ?? [];
  if (c.state === 'new') return 'Reading the credit from Frameworks…';
  if (c.state === 'rejected') return 'Rejected';
  const ret = lines.filter(l => l.action === 'return');
  const chk = lines.filter(l => l.action === 'check');
  const shelf = lines.filter(l => l.action === 'none');
  const suppliers = [...new Set(ret.map(l => l.supplierName || l.supplier).filter(Boolean))];
  const parts = [];
  if (ret.length) parts.push(`Return ${ret.length} line${ret.length === 1 ? '' : 's'}${suppliers.length ? ` to ${suppliers.join(' and ')}` : ''}`);
  if (chk.length) parts.push(`check ${chk.length} first`);
  if (shelf.length) parts.push(`${shelf.length} back on the shelf`);
  const s = parts.join(', ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : c.history?.at(-1)?.text ?? '—';
}

// What happens next, for the side of each card.
function nextText(c: SupplierCredit, b: Bucket) {
  const so = c.sendOut ?? [];
  if (b === 'approve') return c.state === 'approved' ? 'Raising the Stock Return in Frameworks now.' : c.state === 'new' ? 'The plan shows here in a few seconds.' : 'Approving raises the Stock Return in Frameworks and emails the store.';
  if (b === 'problem') return c.history?.at(-1)?.text ?? 'Something went wrong.';
  if (b === 'store') return 'The store hasn’t entered cartons and pallets yet. Open the store page to check or resend.';
  if (b === 'supplier') {
    const sent = so.filter(s => s.stage === 'sent' && s.sentAt).map(s => new Date(s.sentAt!).getTime());
    if (!sent.length) return 'Supplier emailed.';
    const at = Math.min(...sent);
    const day = Math.min(7, Math.max(1, Math.ceil((Date.now() - at) / DAY)));
    return `Receipted out automatically on ${shortDate(new Date(at + 7 * DAY))} (day ${day} of 7).`;
  }
  return c.state === 'rejected' ? c.history?.at(-1)?.text ?? 'Rejected.' : 'Receipted out.';
}

const STEPS = ['Raised in Frameworks', 'Store entered cartons', 'Supplier emailed', 'Receipted out'];
function stepOf(c: SupplierCredit) {
  const so = c.sendOut ?? [];
  if (!so.length) return c.state === 'raised' ? 1 : 0;
  if (so.every(s => s.stage === 'receipted')) return 4;
  if (so.some(s => s.stage === 'sent' || s.stage === 'receipted')) return 3;
  if (so.some(s => s.stage === 'ready')) return 2;
  return 1;
}

async function post(path: string, body: unknown) {
  const res = await fetch(`/api/supplier-credits${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Something went wrong');
  return data;
}

function AddCredits({ onDone }: { onDone: () => void }) {
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
      onDone();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-frame bg-white p-4 shadow-card">
      <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Completed customer credit numbers</span>
        <textarea
          id="add-credit-numbers"
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

function BranchChip({ id }: { id: number | null }) {
  return <span className="rounded-md bg-primary-wash px-2 py-px text-xs font-semibold text-primary-deep">{id ?? '—'}</span>;
}

function Lines({ c }: { c: SupplierCredit }) {
  const lines = c.lines ?? [];
  if (!lines.length) return <p className="text-sm text-muted">No lines read yet.</p>;
  return (
    <div className="space-y-1.5">
      {lines.map(l => (
        <div key={l.code} className="grid grid-cols-[minmax(110px,auto)_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg bg-surface px-3 py-2 text-[0.8125rem]">
          <span className="font-mono">{l.code}</span>
          <span className="min-w-0 truncate text-muted" title={`${l.desc ?? ''}${l.why ? ` · ${l.why}` : ''}`}>
            {l.desc}{l.onHand != null && ` · on hand ${l.onHand}`}{l.supplier && ` · ${l.supplierName || l.supplier}`}
          </span>
          <span className="font-mono">x{l.qty}</span>
          <StatusPill tone={ACTION[l.action].tone}>{ACTION[l.action].label}</StatusPill>
        </div>
      ))}
    </div>
  );
}

function History({ c }: { c: SupplierCredit }) {
  return (
    <ol className="space-y-1 text-xs text-muted">
      {[...(c.history ?? [])].reverse().map((h, i) => (
        <li key={i}><span className="font-mono">{new Date(h.at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span> · {h.text}{h.by && ` · ${h.by}`}</li>
      ))}
    </ol>
  );
}

function SendOuts({ c }: { c: SupplierCredit }) {
  const so = c.sendOut ?? [];
  if (!so.length) return null;
  return (
    <div className="space-y-1">
      {so.map(s => (
        <div key={s.po} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono">SR {s.po}</span>
          <span className="text-muted">{s.supplierName || s.supplier}</span>
          <StatusPill tone={SEND[s.stage].tone}>{SEND[s.stage].label}</StatusPill>
          <a href={s.link} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">store page</a>
        </div>
      ))}
    </div>
  );
}

function Steps({ c }: { c: SupplierCredit }) {
  const n = stepOf(c);
  return (
    <ol className="space-y-1.5" aria-label="Progress">
      {STEPS.map((label, i) => (
        <li key={label} className={cn('flex items-center gap-2 text-xs', i < n ? 'text-ink' : 'text-muted')}>
          <span className={cn('size-2.5 shrink-0 rounded-full', i < n ? 'bg-success' : i === n ? 'border-2 border-pending' : 'border-2 border-frame')} />
          {label}{i < n && <span className="sr-only"> (done)</span>}
        </li>
      ))}
    </ol>
  );
}

type Act = { canAct: boolean; busy: string | null; approve: (c: SupplierCredit) => void; reject: (c: SupplierCredit) => void };

function Actions({ c, act, size = 'default' }: { c: SupplierCredit; act: Act; size?: 'default' | 'sm' }) {
  if (!act.canAct) return null;
  const toReturn = (c.lines ?? []).filter(l => l.action === 'return').length;
  if (c.state === 'planned' || c.state === 'failed') {
    return (
      <div className="flex gap-2">
        {toReturn > 0 && (
          <Button size={size} className="flex-1" disabled={act.busy === `${c.id}:approve`} onClick={() => act.approve(c)}>
            {act.busy === `${c.id}:approve` && <Loader2 className="animate-spin" />}{c.state === 'failed' ? 'Retry' : 'Approve'}
          </Button>
        )}
        <Button size={size} variant="outline" onClick={() => act.reject(c)}>Reject</Button>
      </div>
    );
  }
  if (c.state === 'new') return <Button size={size} variant="outline" onClick={() => act.reject(c)}>Remove</Button>;
  return null;
}

function statusFor(c: SupplierCredit, b: Bucket): { label: string; tone: Tone } {
  if (b === 'problem') return { label: 'Needs a hand', tone: 'failed' };
  if (b === 'store') return { label: 'Waiting on store', tone: 'pending' };
  if (b === 'supplier') return { label: 'Supplier emailed', tone: 'success' };
  if (b === 'done' && c.state === 'raised') return { label: 'Receipted out', tone: 'success' };
  return STATE[c.state] ?? { label: c.state, tone: 'neutral' };
}

// Inbox card: everything needed to decide, without opening anything.
function CreditCard({ c, act }: { c: SupplierCredit; act: Act }) {
  const [open, setOpen] = useState(false);
  const b = bucketOf(c);
  const st = statusFor(c, b);
  const flags = c.flags ?? [];
  return (
    <article className="grid overflow-hidden rounded-xl border border-frame bg-white shadow-card md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-3 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-[0.9375rem] font-medium">{c.creditNo}</span>
          <BranchChip id={c.branchId} />
          <span className="text-sm">{c.customerName ?? '—'}</span>
          <span className="text-[0.8125rem] text-muted">{[c.creditDate, c.total != null && money(c.total)].filter(Boolean).join(' · ')}</span>
          {c.reason && <span className="text-[0.8125rem] text-muted md:ml-auto">{c.reason.desc || c.reason.code}{c.reason.mapped ? ` → ${c.reason.mapped}` : ''}</span>}
        </div>
        <p className="text-[0.9375rem] font-medium">{planText(c)}</p>
        {b === 'approve' ? <Lines c={c} /> : <SendOuts c={c} />}
        {flags.map(f => (
          <p key={f} className="flex items-start gap-1.5 text-[0.8125rem] text-pending"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{f}</p>
        ))}
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}{open ? 'Hide' : 'Show'} {b === 'approve' ? 'history' : 'lines and history'}
        </button>
        {open && (
          <div className="space-y-3 border-t border-hair pt-3">
            {b !== 'approve' && <Lines c={c} />}
            <History c={c} />
          </div>
        )}
      </div>
      <aside className="flex flex-col gap-3 border-t border-frame bg-surface/60 p-4 md:border-l md:border-t-0 md:p-5">
        <StatusPill tone={st.tone} className="self-start">{st.label}</StatusPill>
        <p className="text-[0.8125rem] text-muted">{nextText(c, b)}</p>
        {(b === 'store' || b === 'supplier' || (b === 'done' && c.state === 'raised')) && <Steps c={c} />}
        <div className="mt-auto"><Actions c={c} act={act} /></div>
      </aside>
    </article>
  );
}

// Board card: compact, one line of plan, the next step underneath.
function BoardCard({ c, act }: { c: SupplierCredit; act: Act }) {
  const [open, setOpen] = useState(false);
  const b = bucketOf(c);
  const flags = c.flags ?? [];
  const so = c.sendOut ?? [];
  return (
    <article className="space-y-2 rounded-lg border border-frame bg-white p-3 shadow-[0_1px_2px_oklch(0_0_0/0.05)]">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{c.creditNo}</span>
        <BranchChip id={c.branchId} />
        <span className="ml-auto font-mono text-xs">{money(c.total)}</span>
      </div>
      <p className="text-[0.8125rem] font-medium">{b === 'approve' ? planText(c) : so.map(s => `SR ${s.po} · ${s.supplierName || s.supplier}`).join(', ') || planText(c)}</p>
      <p className="text-xs text-muted">{nextText(c, b)}</p>
      {b === 'approve' && flags.map(f => <p key={f} className="rounded-md bg-pending-bg px-2 py-1 text-xs text-pending">{f}</p>)}
      {(b === 'store' || b === 'supplier') && (
        <div className="h-1.5 overflow-hidden rounded-full bg-primary-wash" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={stepOf(c)} aria-label="Progress">
          <div className="h-full rounded-full bg-success" style={{ width: `${(stepOf(c) / 4) * 100}%` }} />
        </div>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}Details
      </button>
      {open && <div className="space-y-2 border-t border-hair pt-2"><Lines c={c} /><SendOuts c={c} /><History c={c} /></div>}
      <Actions c={c} act={act} size="sm" />
    </article>
  );
}

const VIEW_KEY = 'sof:supplier-credits:view';

export default function SupplierCredits({ rows }: { rows: SupplierCredit[] }) {
  const router = useRouter();
  const canAct = useCanAct();
  // While a credit is waiting to be read or raised, refresh every 5 s so it moves on by itself
  // (the job reads new credits within ~15 s). ponytail: gives up after 3 min, e.g. job down.
  const waiting = rows.some(r => r.state === 'new' || r.state === 'approved');
  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const t = setInterval(() => (Date.now() - started > 180_000 ? clearInterval(t) : router.refresh()), 5000);
    return () => clearInterval(t);
  }, [waiting, router]);

  // Inbox or board: each person's choice, kept in this browser.
  const [view, setView] = useState<'inbox' | 'board'>('inbox');
  useEffect(() => { try { if (localStorage.getItem(VIEW_KEY) === 'board') setView('board'); } catch {} }, []);
  const pickView = (v: 'inbox' | 'board') => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch {} };

  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SupplierCredit | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(c => [c.creditNo, c.customerName, String(c.branchId ?? ''), ...(c.sendOut ?? []).flatMap(o => [o.po, o.supplier, o.supplierName]), ...(c.lines ?? []).flatMap(l => [l.code, l.supplier, l.supplierName])]
      .some(v => v && String(v).toLowerCase().includes(s)));
  }, [rows, q]);
  const byBucket = useMemo(() => {
    const m: Record<Bucket, SupplierCredit[]> = { approve: [], store: [], supplier: [], problem: [], done: [] };
    for (const c of filtered) m[bucketOf(c)].push(c);
    return m;
  }, [filtered]);
  const [tab, setTab] = useState<Bucket>('approve');

  async function call(c: SupplierCredit, verb: 'approve' | 'reject', body: Record<string, unknown> = {}) {
    setBusy(`${c.id}:${verb}`);
    try {
      await post(`/${c.id}/${verb}`, body);
      toast.success(`Credit ${c.creditNo} ${verb === 'approve' ? 'approved: raising it in Frameworks now' : 'rejected'}`);
      setRejecting(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }
  const act: Act = { canAct, busy, approve: c => call(c, 'approve'), reject: c => setRejecting(c) };
  const problems = byBucket.problem;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="View" className="inline-flex rounded-lg border-[1.5px] border-frame-input bg-white p-0.5">
          {([['inbox', 'Needs action', Inbox], ['board', 'Pipeline', Columns3]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => pickView(v)}
              className={cn('inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none', view === v ? 'bg-primary text-white' : 'text-ink hover:bg-surface-hover')}>
              <Icon className="size-4" aria-hidden />{label}
            </button>
          ))}
        </div>
        <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-lg border-[1.5px] border-frame-input bg-white px-3 focus-within:border-primary focus-within:shadow-focus-ring sm:max-w-xs">
          <Search className="size-4 text-muted" aria-hidden />
          <input id="supplier-credit-search" type="search" value={q} onChange={e => setQ(e.target.value)} aria-label="Search credits" placeholder="Credit, Stock Return, customer or supplier" className="w-full bg-transparent text-sm outline-none" />
        </label>
        {canAct && (
          <Button variant="outline" className="ml-auto" onClick={() => setAdding(a => !a)} aria-expanded={adding}>
            <Plus />Add credit numbers
          </Button>
        )}
      </div>

      {adding && canAct && <AddCredits onDone={() => setAdding(false)} />}

      {view === 'board' && problems.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-failed-bg px-4 py-3 text-sm text-failed">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span><strong className="font-semibold">{problems.length} credit{problems.length === 1 ? '' : 's'} need{problems.length === 1 ? 's' : ''} a hand:</strong> {problems.slice(0, 3).map(c => c.creditNo).join(', ')}{problems.length > 3 ? '…' : ''}</span>
          <button type="button" className="ml-auto font-medium underline-offset-2 hover:underline" onClick={() => { pickView('inbox'); setTab('problem'); }}>Open</button>
        </div>
      )}

      {!rows.length ? (
        <p className="rounded-xl bg-white py-16 text-center text-sm text-muted shadow-card">No credits yet. Add a completed customer credit number to start.</p>
      ) : view === 'inbox' ? (
        <>
          <nav aria-label="Credit status" className="flex flex-wrap gap-2">
            {BUCKETS.map(b => {
              const on = tab === b.id, n = byBucket[b.id].length, bad = b.id === 'problem' && n > 0;
              return (
                <button key={b.id} type="button" aria-pressed={on} onClick={() => setTab(b.id)}
                  className={cn('inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none',
                    on ? 'border-primary bg-primary text-white' : 'border-frame bg-white text-ink hover:bg-surface-hover')}>
                  {b.label}
                  <span className={cn('min-w-[22px] rounded-full px-1.5 py-px text-xs font-semibold', on ? 'bg-white/20 text-white' : bad ? 'bg-failed-bg text-failed' : 'bg-primary-wash text-primary')}>{n}</span>
                </button>
              );
            })}
          </nav>
          <p className="text-[0.8125rem] text-muted">{BUCKETS.find(b => b.id === tab)!.hint}</p>
          {byBucket[tab].length ? (
            <div className="space-y-3">{byBucket[tab].slice(0, tab === 'done' ? 50 : undefined).map(c => <CreditCard key={c.id} c={c} act={act} />)}</div>
          ) : (
            <p className="rounded-xl bg-white py-12 text-center text-sm text-muted shadow-card">{q ? 'Nothing matches your search here.' : 'Nothing here right now.'}</p>
          )}
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BUCKETS.filter(b => b.id !== 'problem').map(b => (
            <section key={b.id} className="flex min-w-0 flex-col gap-2.5 rounded-xl bg-surface-hover p-3" aria-label={b.label}>
              <div className="flex items-baseline gap-2 px-1">
                <h2 className="text-sm font-semibold">{b.id === 'done' ? 'Done' : b.label}</h2>
                <span className="text-[0.8125rem] text-muted">{byBucket[b.id].length}</span>
              </div>
              <p className="px-1 text-xs text-muted">{b.hint}</p>
              {byBucket[b.id].slice(0, b.id === 'done' ? 20 : undefined).map(c => <BoardCard key={c.id} c={c} act={act} />)}
              {!byBucket[b.id].length && <p className="px-1 py-4 text-center text-xs text-muted">Nothing here.</p>}
            </section>
          ))}
        </div>
      )}

      {rejecting && (
        <RejectDialog
          label={`credit ${rejecting.creditNo}`}
          hint="Say why the plan is wrong and what should be done instead, e.g. “Already returned on PO 10820281” or “Wrong number, it's 797251”. Nothing is raised in Frameworks."
          busy={busy === `${rejecting.id}:reject`}
          onReject={reason => call(rejecting, 'reject', { reason })}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}
