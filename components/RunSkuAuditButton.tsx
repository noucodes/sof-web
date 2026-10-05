'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
    <Button onClick={run} disabled={busy} className="shrink-0">
      <RefreshCw className={busy ? 'animate-spin' : undefined} />
      {busy ? 'Running…' : 'Run now'}
    </Button>
  );
}
