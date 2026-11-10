'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCanAct } from '@/components/RoleProvider';

type Last = { requestedAt: string | null; added?: number; skipped?: number; error?: string };

const POLL_MS = 5000;
const GIVE_UP_MS = 10 * 60_000; // Frameworks takes 2-4 min to list the credit notes
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Asks burdens-workers to pull completed credit notes from Frameworks now (instead of
// waiting for 11:37 / 14:37 / 17:37) and says what came in. Same idea as order routing's button.
export default function CheckCreditsButton() {
  const canAct = useCanAct();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    const id = toast.loading('Checking Frameworks for credits…', { description: 'This takes a few minutes. You can keep working.' });
    try {
      const res = await fetch('/api/supplier-credits/pull', { method: 'POST' });
      const asked = await res.json().catch(() => null);
      if (!res.ok || !asked?.requestedAt) throw new Error(asked?.message ?? `Request failed (${res.status})`);
      const last = await waitFor(asked.requestedAt);
      if (!last) toast.error('No answer from Frameworks', { id, closeButton: true, description: 'The supplier-credit job on sql1 didn’t pick this up. Is it running in pm2?' });
      else if (last.error) toast.error('Frameworks check failed', { id, closeButton: true, description: last.error });
      else toast.success(last.added ? `${plural(last.added, 'new credit')} added` : 'Frameworks checked: no new credits', {
        id, closeButton: true, duration: 15_000,
        description: last.skipped ? `${plural(last.skipped, 'credit')} skipped (overcharged / incorrectly charged)` : undefined,
      });
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
    const res = await fetch('/api/supplier-credits/pull', { cache: 'no-store' });
    if (!res.ok) continue;
    const { last } = (await res.json()) as { last: Last | null };
    if (last?.requestedAt === requestedAt) return last;
  }
  return null;
}
