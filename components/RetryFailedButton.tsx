'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Recurring bridge-down symptom: Frameworks bridge 404s and every push in
// the wave fails with this exact error string.
const BRIDGE_404_ERROR = '[bridge_server_error] unknown_bridge_error: Bridge server error: 404 Not Found';

export default function RetryFailedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retryAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/retry-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: BRIDGE_404_ERROR }),
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
    <button
      onClick={retryAll}
      disabled={loading}
      title="Retry every failed order with a bridge 404 error"
      className="flex items-center gap-2 px-4 py-2 border border-frame-input text-ink text-sm font-medium rounded-lg hover:bg-surface-hover disabled:opacity-50 transition-colors duration-150"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? 'Retrying…' : 'Retry bridge 404s'}
    </button>
  );
}
