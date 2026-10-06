'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RolePicker } from '@/components/UserBits';
import { roleLabel } from '@/lib/roles';
import type { Role } from '@/lib/session';

type User = { id: number; email: string; role: string; isActive: boolean };

// Role, on/off and password for one person. Every change is saved straight
// away and shows up in their activity log with its before and after.
export default function UserAccess({ user, isMe }: { user: User; isMe: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');

  async function save(data: Partial<{ role: string; isActive: boolean; password: string }>, done: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? 'Couldn’t save');
      toast.success(done);
      router.refresh();
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="divide-y divide-hair">
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Role</h3>
          <p className="text-xs text-muted">{isMe ? 'You can’t change your own role. Ask another admin.' : 'What they can do in the portal.'}</p>
        </div>
        <RolePicker name="role" value={role} onChange={setRole} disabled={isMe || busy} />
        {role !== user.role && (
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => save({ role }, `${user.email} is now ${roleLabel(role)}`)}>
              Make {roleLabel(role)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRole(user.role)}>Cancel</Button>
          </div>
        )}
        <p className="text-[0.6875rem] text-muted">A new role applies within 15 minutes, or straight away when they next sign in.</p>
      </div>

      <form
        className="p-5 space-y-3"
        onSubmit={async e => {
          e.preventDefault();
          if (await save({ password }, `Password reset for ${user.email}`)) setPassword('');
        }}
      >
        <div>
          <h3 className="text-sm font-semibold text-ink">Reset password</h3>
          <p className="text-xs text-muted">Set a temporary password and tell them it. They can change it from My profile.</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="password"
            aria-label="New password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="max-w-64"
          />
          <Button type="submit" size="sm" variant="outline" className="h-9" disabled={busy || password.length < 8}>Reset</Button>
        </div>
      </form>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{user.isActive ? 'Deactivate' : 'Reactivate'}</h3>
          <p className="text-xs text-muted">
            {user.isActive
              ? 'They can’t sign in any more, within 15 minutes. Their history stays.'
              : 'They can sign in again with their existing password.'}
          </p>
        </div>
        <Button
          size="sm"
          variant={user.isActive ? 'destructive' : 'outline'}
          disabled={busy || (isMe && user.isActive)}
          onClick={() => save({ isActive: !user.isActive }, user.isActive ? `${user.email} deactivated` : `${user.email} reactivated`)}
        >
          {user.isActive ? 'Deactivate user' : 'Reactivate user'}
        </Button>
        {isMe && user.isActive && <p className="text-[0.6875rem] text-muted">You can’t deactivate yourself.</p>}
      </div>
    </div>
  );
}
