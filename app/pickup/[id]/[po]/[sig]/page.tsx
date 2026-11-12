import type { Metadata } from 'next';
import PickupForm, { type Pickup } from '@/components/supplier-credit/PickupForm';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = { title: 'Pick up request · Burdens', robots: { index: false, follow: false } };

// Public page from the store email (no login): enter cartons/pallets, press Send, and the supplier
// gets the Credit Request + pick-up details. After that it's the printable pick-up request.
export default async function PickupPage({ params }: { params: Promise<{ id: string; po: string; sig: string }> }) {
  const { id, po, sig } = await params;
  const valid = /^\d+$/.test(id) && /^\d{6,10}$/.test(po) && /^[\w-]{32}$/.test(sig);
  const res = valid ? await fetch(`${API}/supplier-credits/pickup/${id}/${po}/${sig}`, { cache: 'no-store' }) : null;
  if (!res?.ok) {
    return (
      <main className="mx-auto w-full max-w-xl p-6">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h1 className="text-base font-semibold text-ink">This link doesn’t work</h1>
          <p className="mt-2 text-sm text-muted">Open the link straight from the Stock Return email. If it still doesn’t work, call E-commerce.</p>
        </div>
      </main>
    );
  }
  return <PickupForm initial={(await res.json()) as Pickup} path={`${id}/${po}/${sig}`} />;
}
