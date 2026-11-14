'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Outage recovery (e.g. sof-bridge down): requeue EVERY failed order and every
// failed ShipStation job, whatever the error. Sending no error filter is what
// makes sof-api retry everything, and sof-api only allows that for the
// development account. Rendered only for that account (dashboard page).
export default function RetryAllFailedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retryAll() {
    if (!confirm('Requeue every failed order and every failed ShipStation job?')) return;
    setLoading(true);
    try {
      const post = async (path: string) => {
        const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? `Retry failed (${path})`);
        return data.count as number;
      };
      const [orders, jobs] = await Promise.all([post('/api/orders/retry-failed'), post('/api/jobs/retry-failed')]);
      toast.success(`${orders} order${orders === 1 ? '' : 's'} and ${jobs} job${jobs === 1 ? '' : 's'} queued for retry`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={retryAll} disabled={loading} title="Requeue every failed order and ShipStation job (development account only)">
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {loading ? 'Retrying…' : 'Retry all failed'}
    </Button>
  );
}
