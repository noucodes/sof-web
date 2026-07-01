import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import UsersClient from './UsersClient';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getUsers(cookieHeader: string) {
  const res = await fetch(`${API}/users`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/orders');
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export default async function UsersPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const users = await getUsers(cookieHeader);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-800">Orders</Link>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">
        <UsersClient initialUsers={users} />
      </main>
    </div>
  );
}
