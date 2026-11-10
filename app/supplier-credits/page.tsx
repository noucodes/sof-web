import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import SupplierCredits, { type SupplierCredit } from '@/components/supplier-credit/SupplierCredits';
import SupplierCreditsHelp from '@/components/supplier-credit/SupplierCreditsHelp';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function SupplierCreditsPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${API}/supplier-credits`, { headers: { cookie }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load supplier credits: ${res.status} ${await res.text()}`);
  const { rows, counts } = (await res.json()) as { rows: SupplierCredit[]; counts: Record<string, number> };

  const cards = [
    { label: 'Waiting to be read', value: counts.new ?? 0, color: 'text-ink' },
    { label: 'Awaiting approval', value: counts.planned ?? 0, color: 'text-pending' },
    { label: 'Raised on TEST', value: (counts.approved ?? 0) + (counts.raised ?? 0), color: 'text-success' },
    { label: 'Rejected', value: counts.rejected ?? 0, color: 'text-failed' },
  ];

  return (
    <AppShell>
      <PageHeader crumbs={['Orders', 'Supplier credits']}>
        <SupplierCreditsHelp />
      </PageHeader>
      <div className="space-y-5 p-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold tracking-tight text-ink">Supplier credits</h1>
          <p className="text-sm text-muted">Completed customer credits checked for a supplier Stock Return. Test mode: approving raises the Stock Return on Frameworks TEST only. Nothing is raised, emailed or printed in live Frameworks.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl bg-white p-4 shadow-card">
              <p className="text-xs font-medium uppercase tracking-[0.07em] text-muted">{c.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
        <SupplierCredits rows={rows} />
      </div>
    </AppShell>
  );
}
