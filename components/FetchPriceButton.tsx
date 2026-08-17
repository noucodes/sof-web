'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function FetchPriceButton({ orderId, hasError }: { orderId: string | number; hasError: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function fetchPrice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/fetch-price`, { method: 'POST' });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.message ?? 'Payment not found on Frameworks');
        return;
      }
      if (data?.frameworksPriceError) {
        toast.error('Payment not found on Frameworks');
      } else {
        toast.success('Verified on Frameworks');
      }
      router.refresh();
    } catch {
      toast.error('Payment not found on Frameworks');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={fetchPrice}
      disabled={loading}
      title={hasError ? 'Last verification failed — retry' : 'Verify against Frameworks'}
      className="text-[0.6875rem] font-medium text-primary hover:text-primary-deep disabled:opacity-50 transition-colors duration-[120ms]"
    >
      {loading ? 'Verifying…' : hasError ? 'Retry' : 'Verify'}
    </button>
  );
}
