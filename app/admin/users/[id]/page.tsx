import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ProfileView, { type Activity, type Profile } from '@/components/ProfileView';
import UserAccess from './UserAccess';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const cookieStore = await cookies();
  const headers = { cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ') };

  const [res, me] = await Promise.all([
    fetch(`${API}/users/${id}`, { headers, cache: 'no-store' }),
    fetch(`${API}/auth/me`, { headers, cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/orders');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load user: ${res.status} ${await res.text()}`);
  const user: Profile = await res.json();

  const activity: Activity | null = await fetch(`${API}/audit/activity?days=30&user=${encodeURIComponent(user.email)}`, { headers, cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);

  return (
    <AppShell>
      <PageHeader crumbs={['Admin', 'Users', user.email]} />
      <div className="p-6 space-y-4">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ChevronLeft className="size-4" />
          All users
        </Link>
        <ProfileView user={user} activity={activity} isMe={me?.user?.id === user.id} sideTitle="Access" side={<UserAccess user={user} isMe={me?.user?.id === user.id} />} />
      </div>
    </AppShell>
  );
}
