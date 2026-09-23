'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Recurring bridge-down symptom: every push in the wave fails with one of
// these exact error strings. Two formats show up depending on which service
// wrote the row: sof-bridge's own response body (type + error fields,
// written as-is when the row predates sof-api's rollout) and sof-api's
// processOrder wrapping axios's default message for a thrown 5xx
// (`[processing_error] Request failed with status code <n>` — see
// webhooks.service.ts). A 404 never reaches sof-api's failed state — it's
// treated as bridge_unreachable and left pending for the cron to retry
// automatically, so it's not listed here.
const BRIDGE_ERRORS = [
  '[bridge_server_error] unknown_bridge_error: Bridge server error: 403 Forbidden',
  '[bridge_server_error] unknown_bridge_error: Bridge server error: 404 Not Found',
  '[bridge_server_error] unknown_bridge_error: Bridge server error: 502 Bad Gateway',
  '[processing_error] Request failed with status code 403',
  '[processing_error] Request failed with status code 500',
  '[processing_error] Request failed with status code 502',
  '[processing_error] Request failed with status code 503',
  '[processing_error] Request failed with status code 504',
];

export default function RetryFailedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retryAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/retry-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: BRIDGE_ERRORS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Retry failed');
      toast.success(data.count > 0 ? `${data.count} order${data.count === 1 ? '' : 's'} queued for retry` : 'No matching failed orders');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={retryAll}
      disabled={loading}
      title="Retry every failed order with a bridge 403, 404, or 502 error"
    >
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {loading ? 'Retrying…' : 'Retry bridge 403/404/502s'}
    </Button>
  );
}
