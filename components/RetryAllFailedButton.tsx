'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toLocaleDateString('en-CA'); // YYYY-MM-DD, local

// Outage recovery (e.g. sof-bridge down): requeue every order and ShipStation
// job that failed on/after the chosen date, whatever the error. Asks sof-api
// for the counts first (dry run) and shows them before changing anything:
// on 14 Nov 2026 an unbounded version requeued months-old orders into
// Frameworks. sof-api only allows the unfiltered retry for the development
// account; the dashboard renders this only for that account.
export default function RetryAllFailedButton() {
  const router = useRouter();
  const [since, setSince] = useState(daysAgo(7));
  const [loading, setLoading] = useState(false);

  async function retryAll() {
    if (!since) return;
    setLoading(true);
    try {
      const body = (dryRun: boolean) => JSON.stringify({ since: new Date(`${since}T00:00`).toISOString(), dryRun });
      const post = async (path: string, dryRun: boolean) => {
        const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(dryRun) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? `Retry failed (${path})`);
        return data.count as number;
      };
      const both = (dryRun: boolean) => Promise.all([post('/api/orders/retry-failed', dryRun), post('/api/jobs/retry-failed', dryRun)]);

      const [o, j] = await both(true);
      if (!o && !j) return void toast.info(`Nothing failed since ${since}`);
      if (!confirm(`Requeue ${o} failed order${o === 1 ? '' : 's'} and ${j} failed ShipStation job${j === 1 ? '' : 's'} created since ${since}?\n\nOrders go straight into Frameworks.`)) return;

      const [orders, jobs] = await both(false);
      toast.success(`${orders} order${orders === 1 ? '' : 's'} and ${jobs} job${jobs === 1 ? '' : 's'} queued for retry`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-muted flex items-center gap-1">
        Failed since
        <Input type="date" value={since} max={daysAgo(0)} onChange={e => setSince(e.target.value)} className="h-8 w-auto text-xs" />
      </label>
      <Button variant="outline" size="sm" onClick={retryAll} disabled={loading || !since} title="Shows how many first, then requeues failed orders and ShipStation jobs from that date on (development account only)">
        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {loading ? 'Checking…' : 'Retry all failed'}
      </Button>
    </div>
  );
}
