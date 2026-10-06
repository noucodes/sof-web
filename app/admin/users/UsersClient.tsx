'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { ChevronRight, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StatusPill from '@/components/StatusPill';
import { RoleBadge, RolePicker, UserAvatar } from '@/components/UserBits';
import { ROLES } from '@/lib/roles';
import type { Role } from '@/lib/session';
import { cn } from '@/lib/utils';

export type User = { id: number; email: string; role: string; isActive: boolean; createdAt: string; lastSeen: string | null };

const TH = 'px-4 py-[10px] text-left text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap';
const seen = (d: string | null) => (d ? `${formatDistanceToNowStrict(new Date(d))} ago` : 'Never');

export default function UsersClient({ initialUsers, meId }: { initialUsers: User[]; meId: number | null }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);

  const active = users.filter(u => u.isActive);
  const inactiveCount = users.length - active.length;
  const shown = useMemo(
    () =>
      users
        .filter(u => (showInactive ? !u.isActive : u.isActive))
        .filter(u => role === 'all' || u.role === role)
        .filter(u => u.email.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => +new Date(b.lastSeen ?? 0) - +new Date(a.lastSeen ?? 0)),
    [users, q, role, showInactive],
  );

  return (
    <div className="space-y-6">
      {/* Who has which role; each card filters the list. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map(r => {
          const n = active.filter(u => u.role === r.key).length;
          const on = role === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(on ? 'all' : r.key)}
              aria-pressed={on}
              className={cn(
                'rounded-xl bg-white p-4 text-left shadow-card ring-1 transition-colors',
                on ? 'ring-primary' : 'ring-transparent hover:ring-frame',
              )}
            >
              <div className="flex items-center justify-between">
                <RoleBadge role={r.key} />
                <span className="text-2xl font-semibold tabular-nums text-ink">{n}</span>
              </div>
              <p className="mt-2 text-xs text-muted">{r.summary}</p>
            </button>
          );
        })}
      </div>

      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-frame flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by email" aria-label="Search by email" className="h-8 w-64 pl-8 text-[0.8125rem]" />
          </div>
          <div className="flex rounded-md bg-surface-strong p-0.5" role="group" aria-label="Show">
            {[false, true].map(v => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={showInactive === v}
                onClick={() => setShowInactive(v)}
                className={cn('rounded px-2.5 py-0.5 text-xs', showInactive === v ? 'bg-white shadow-card font-semibold text-ink' : 'text-muted hover:text-ink')}
              >
                {v ? `Deactivated (${inactiveCount})` : `Active (${active.length})`}
              </button>
            ))}
          </div>
          {role !== 'all' && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setRole('all')}>
              Showing {ROLES.find(r => r.key === role)?.label}s · show all
            </Button>
          )}
          <Button size="sm" className="ml-auto" onClick={() => setAdding(true)}>
            <UserPlus />
            Add user
          </Button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              <th className={TH}>Person</th>
              <th className={TH}>Role</th>
              <th className={TH}>Status</th>
              <th className={TH}>Last seen</th>
              <th className={TH}>Added</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  {q || role !== 'all' ? 'No one matches' : showInactive ? 'No deactivated users' : 'No users yet'}
                </td>
              </tr>
            )}
            {shown.map(u => (
              <tr
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                className="group cursor-pointer border-t border-hair first:border-t-0 hover:bg-surface-hover"
              >
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 focus-visible:outline-none">
                    <UserAvatar email={u.email} />
                    <span className="text-ink group-hover:text-primary">{u.email}</span>
                    {u.id === meId && <span className="rounded bg-surface-strong px-1.5 text-[0.6875rem] text-muted">You</span>}
                  </Link>
                </td>
                <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-2.5">
                  <StatusPill tone={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Deactivated'}</StatusPill>
                </td>
                <td className="px-4 py-2.5 text-muted">{seen(u.lastSeen)}</td>
                <td className="px-4 py-2.5 text-muted">
                  {new Date(u.createdAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <ChevronRight className="inline size-4 text-muted group-hover:text-primary" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AddUserDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={u => {
          setUsers(prev => [{ ...u, lastSeen: null }, ...prev]);
          toast.success(`${u.email} added as ${ROLES.find(r => r.key === u.role)?.label}`);
        }}
      />
    </div>
  );
}

function AddUserDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (u: Omit<User, 'lastSeen'>) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? 'Couldn’t add the user');
      onAdded(d);
      setEmail('');
      setPassword('');
      setRole('viewer');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>They sign in with this email and password. Ask them to change the password from My profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="add-email" className="text-xs font-medium text-ink">Email</label>
            <Input id="add-email" type="email" required value={email} placeholder="name@burdens.com.au" onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="add-password" className="text-xs font-medium text-ink">Temporary password</label>
            <Input id="add-password" type="password" required minLength={8} autoComplete="new-password" value={password} placeholder="At least 8 characters" onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-ink">Role</span>
            <RolePicker name="add-role" value={role} onChange={setRole} />
          </div>
          {error && <p className="text-sm text-failed" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add user'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
