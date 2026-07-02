'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-muted hover:text-ink transition-colors duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded"
    >
      Sign out
    </button>
  );
}
