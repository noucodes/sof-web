import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import UsersClient from './UsersClient';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function load(cookieHeader: string) {
  const [res, me] = await Promise.all([
    fetch(`${API}/users`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${API}/auth/me`, { headers: { cookie: cookieHeader }, cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/orders');
  if (!res.ok) throw new Error(`Failed to load users: ${res.status} ${await res.text()}`);
  return { users: await res.json(), meId: (me?.user?.id as number | undefined) ?? null };
}

export default async function UsersPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const { users, meId } = await load(cookieHeader);

  return (
    <AppShell>
      <PageHeader crumbs={['Admin', 'Users']} />
      <div className="p-6 space-y-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Users</h1>
          <p className="text-sm text-muted">Who can sign in to the portal and what they’re allowed to do. Open someone to change their role, reset their password or see what they’ve done.</p>
        </div>
        <UsersClient initialUsers={users} meId={meId} />
      </div>
    </AppShell>
  );
}
