'use client';
import { useState } from 'react';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type User = { id: number; email: string; role: string; isActive: boolean; createdAt: string };

const ROLES = ['viewer', 'operator', 'admin'];

const COLUMNS = [
  { key: 'email', label: 'Email', getValue: (u: User) => u.email },
  { key: 'role', label: 'Role', getValue: (u: User) => u.role },
  { key: 'status', label: 'Status', getValue: (u: User) => (u.isActive ? 1 : 0) },
  { key: 'created', label: 'Created', getValue: (u: User) => new Date(u.createdAt).getTime() },
];

const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const { sorted, sort, toggleSort } = useClientSort(users, GETTERS);
  const [form, setForm] = useState({ email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? 'Failed to create user');
      }
      const user = await res.json();
      setUsers(prev => [user, ...prev]);
      setForm({ email: '', password: '', role: 'viewer' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(id: number, data: Partial<User>) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
  }

  return (
    <div className="space-y-6">
      {/* Add user form */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-[0.9375rem] font-semibold text-ink tracking-tight mb-5">Add user</h2>
        <form onSubmit={createUser} className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-[5px]">
            <label htmlFor="new-user-email" className="text-xs font-medium text-ink">Email</label>
            <Input
              id="new-user-email"
              type="email"
              required
              value={form.email}
              placeholder="name@burdens.com.au"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-60"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label htmlFor="new-user-password" className="text-xs font-medium text-ink">Password</label>
            <Input
              id="new-user-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              placeholder="Min. 8 characters"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label htmlFor="new-user-role" className="text-xs font-medium text-ink">Role</label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger id="new-user-role" className="w-32">
                <SelectValue>{form.role.charAt(0).toUpperCase() + form.role.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={creating}>
            {creating ? 'Adding…' : 'Add user'}
          </Button>

          {error && (
            <p className="text-sm text-failed w-full" role="alert">{error}</p>
          )}
        </form>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-strong border-b border-frame">
            <tr>
              {COLUMNS.map(col => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  direction={sort?.key === col.key ? sort.dir : null}
                  onClick={() => toggleSort(col.key)}
                />
              ))}
              <th className="text-left px-4 py-[10px] text-xs font-medium text-muted" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                  No users yet
                </td>
              </tr>
            )}
            {sorted.map((u, idx) => (
              <tr
                key={u.id}
                className={`${idx % 2 === 1 ? 'bg-surface' : 'bg-white'} transition-colors duration-100 hover:bg-surface-hover${u.isActive ? '' : ' opacity-50'}`}
              >
                <td className="px-4 py-3 text-sm text-ink">{u.email}</td>
                <td className="px-4 py-3">
                  <Select value={u.role} onValueChange={v => updateUser(u.id, { role: v })}>
                    <SelectTrigger aria-label={`Role for ${u.email}`} className="h-8 w-28 border text-xs">
                      <SelectValue>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-[0.05em] ${
                      u.isActive ? 'bg-success-bg text-success' : 'bg-surface text-muted'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">
                  {new Date(u.createdAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => updateUser(u.id, { isActive: !u.isActive })}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
