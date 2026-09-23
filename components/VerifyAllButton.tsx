'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <Button
      variant="outline"
      size="sm"
      onClick={verifyAll}
      disabled={loading}
      title="Re-check every order still missing a contribution figure against Frameworks"
    >
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {loading ? 'Verifying…' : 'Verify all'}
    </Button>
  );
}
