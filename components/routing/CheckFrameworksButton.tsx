'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCanAct } from '@/components/RoleProvider';

type Item = { id: number; ref: string; why: string };
type Approved = { done_by_hand: Item[]; manual: Item[]; check: Item[]; will_run: Item[]; error: Item[] };
type Last = {
  requestedAt: string | null;
  finishedAt: string;
  created?: number;
  closed?: number;
  executed?: number;
  executeFailed?: number;
  execute?: boolean;
  approved?: Approved;
  error?: string;
};

const POLL_MS = 3000;
const GIVE_UP_MS = 3 * 60_000; // workers poll every 20 s; a full run takes a minute or two
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const refs = (items: Item[]) => items.slice(0, 4).map(i => i.ref.split(' ')[0]).join(', ') + (items.length > 4 ? ` +${items.length - 4}` : '');

// Asks burdens-workers (the only side that reaches Frameworks) to run order routing now,
// waits for its report, and says what it found in a toast.
export default function CheckFrameworksButton() {
  const canAct = useCanAct();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    const id = toast.loading('Checking Frameworks…', { description: 'Waiting for the routing job on sql1' });
    try {
      const res = await fetch('/api/routing/sync', { method: 'POST' });
      const asked = await res.json().catch(() => null);
      if (!res.ok || !asked?.requestedAt) throw new Error(asked?.message ?? `Request failed (${res.status})`);
      const last = await waitFor(asked.requestedAt);
      if (!last) {
        toast.error('No answer from Frameworks', { id, closeButton: true, description: 'The routing job on sql1 didn’t pick this up. Is order-routing running in pm2?' });
        return;
      }
      report(id, last);
      router.refresh();
    } catch (e) {
      toast.error('Couldn’t check Frameworks', { id, closeButton: true, description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (!canAct) return null; // viewers are read-only
  return (
    <Button variant="outline" size="sm" onClick={check} disabled={busy}>
      {busy ? 'Checking…' : 'Check Frameworks'}
    </Button>
  );
}

async function waitFor(requestedAt: string): Promise<Last | null> {
  const until = Date.now() + GIVE_UP_MS;
  while (Date.now() < until) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const res = await fetch('/api/routing/sync', { cache: 'no-store' });
    if (!res.ok) continue;
    const { last } = (await res.json()) as { last: Last | null };
    if (last?.requestedAt === requestedAt) return last;
  }
  return null;
}

function report(id: string | number, last: Last) {
  if (last.error) {
    toast.error('Frameworks check failed', { id, closeButton: true, description: last.error });
    return;
  }
  const a = last.approved;
  const found: string[] = [];
  if (last.created) found.push(`${plural(last.created, 'new order')} to review`);
  if (last.closed) found.push(`${plural(last.closed, 'order')} closed: done in Frameworks`);
  if (last.executed) found.push(`${plural(last.executed, 'approved order')} carried out`);
  if (last.executeFailed) found.push(`${plural(last.executeFailed, 'order')} failed: see the Failed tab`);
  if (a?.done_by_hand.length) found.push(`Approved, already done by hand: ${a.done_by_hand.length}${last.execute ? '' : ' (closed once execution is on)'}`);
  if (a?.check.length) found.push(`Check, assigned but no PO: ${refs(a.check)}`);
  if (a?.manual.length) found.push(`Needs doing by hand: ${refs(a.manual)}`);
  if (a?.will_run.length) found.push(`Will run${last.execute ? ' next' : ' once execution is on'}: ${refs(a.will_run)}`);
  if (a?.error.length) found.push(`Couldn’t read: ${refs(a.error)}`);

  if (!found.length) {
    toast.success('Frameworks checked: nothing new', { id, closeButton: true, description: undefined });
    return;
  }
  const attention = Boolean(a?.check.length || a?.manual.length || a?.error.length || last.executeFailed);
  (attention ? toast.warning : toast.success)('Frameworks checked', {
    id,
    closeButton: true,
    description: <ul className="list-disc space-y-0.5 pl-4">{found.map(f => <li key={f}>{f}</li>)}</ul>,
    duration: 15_000,
  });
}
