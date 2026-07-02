import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import UsersClient from './UsersClient';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getUsers(cookieHeader: string) {
  const res = await fetch(`${API}/users`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/orders');
  if (!res.ok) throw new Error(`Failed to load users: ${res.status} ${await res.text()}`);
  return res.json();
}

export default async function UsersPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const users = await getUsers(cookieHeader);

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Users</h1>
          <p className="text-sm text-muted">Manage who has access to this portal and their permission level.</p>
        </div>
        <UsersClient initialUsers={users} />
      </div>
    </AppShell>
  );
}
