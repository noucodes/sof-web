'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RunSkuAuditButton({ running }: { running: boolean }) {
  const [busy, setBusy] = useState(running);

  async function run() {
    setBusy(true);
    const res = await fetch('/api/sku-audit/run', { method: 'POST' });
    if (!res.ok) {
      toast.error(res.status === 403 ? 'Only admins can start a run' : 'Could not start the audit');
      setBusy(false);
      return;
    }
    toast.success('Audit started. It takes a few minutes, refresh to see results.');
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="shrink-0 rounded-lg bg-ink text-white text-sm font-medium px-3.5 py-2 disabled:opacity-50"
    >
      {busy ? 'Running…' : 'Run now'}
    </button>
  );
}
