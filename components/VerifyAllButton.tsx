'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function VerifyAllButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function verifyAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/contribution/verify-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Verification failed');
      toast.success(data.message);
      // Sweep runs in the background on the API; give it a moment then refresh.
      setTimeout(() => router.refresh(), 3000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={verifyAll}
      disabled={loading}
      title="Re-check every order still missing a contribution figure against Frameworks"
      className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border border-frame-input text-ink hover:bg-surface-hover disabled:opacity-50 transition-colors duration-[120ms]"
    >
      {loading ? 'Verifying…' : 'Verify all'}
    </button>
  );
}
