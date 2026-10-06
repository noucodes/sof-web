import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ProfileView, { type Activity, type Profile } from '@/components/ProfileView';
import ChangePassword from './ChangePassword';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Every signed-in person's own page: who they are, their role, their password, their activity.
export default async function MyProfilePage() {
  const cookieStore = await cookies();
  const headers = { cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ') };

  const [res, activity] = await Promise.all([
    fetch(`${API}/auth/profile`, { headers, cache: 'no-store' }),
    fetch(`${API}/audit/mine`, { headers, cache: 'no-store' })
      .then(r => (r.ok ? (r.json() as Promise<Activity>) : null))
      .catch(() => null),
  ]);
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load your profile: ${res.status} ${await res.text()}`);
  const user: Profile = await res.json();

  return (
    <AppShell>
      <PageHeader crumbs={['My profile']} />
      <div className="p-6">
        <ProfileView user={user} activity={activity} isMe sideTitle="Change password" side={<ChangePassword />} />
      </div>
    </AppShell>
  );
}
