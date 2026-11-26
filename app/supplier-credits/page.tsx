import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import SupplierCredits, { type SupplierCredit } from '@/components/supplier-credit/SupplierCredits';
import SupplierCreditsHelp from '@/components/supplier-credit/SupplierCreditsHelp';
import CheckCreditsButton from '@/components/supplier-credit/CheckCreditsButton';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function SupplierCreditsPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${API}/supplier-credits`, { headers: { cookie }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load supplier credits: ${res.status} ${await res.text()}`);
  const { rows } = (await res.json()) as { rows: SupplierCredit[] };

  return (
    <AppShell>
      <PageHeader crumbs={['Orders', 'Supplier credits']}>
        <CheckCreditsButton />
        <SupplierCreditsHelp />
      </PageHeader>
      <div className="space-y-5 p-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold tracking-tight text-ink">Supplier credits</h1>
          <p className="text-sm text-muted">Completed customer credits checked for a supplier Stock Return. Approve a credit and the Stock Return is raised in Frameworks, the store is emailed, then the supplier. It&rsquo;s receipted out 7 days later.</p>
        </div>
        <SupplierCredits rows={rows} />
      </div>
    </AppShell>
  );
}
