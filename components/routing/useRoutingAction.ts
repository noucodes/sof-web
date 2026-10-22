'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Verb = 'approve' | 'action' | 'reject' | 'retry';

// One place for every routing button: POST, toast, refresh the page's data.
export function useRoutingAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: number, verb: Verb, body: Record<string, unknown> = {}, done?: string) {
    setBusy(`${id}:${verb}`);
    try {
      const res = await fetch(`/api/routing/${id}/${verb}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Something went wrong');
      if (done) toast.success(done);
      router.refresh();
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  return { run, busy, isBusy: (id: number, verb: Verb) => busy === `${id}:${verb}` };
}
