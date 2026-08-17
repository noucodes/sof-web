'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FetchPriceButton({ orderId, hasError }: { orderId: string | number; hasError: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function fetchPrice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/fetch-price`, { method: 'POST' });
      if (res.ok) router.refresh();
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
