'use client';
import { useState } from 'react';

type User = { id: number; email: string; role: string; isActive: boolean; createdAt: string };

const ROLES = ['viewer', 'operator', 'admin'];

const inputClass =
  'border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]';

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
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
            <label className="text-xs font-medium text-ink">Email</label>
            <input
              type="email"
              required
              value={form.email}
              placeholder="name@burdens.com.au"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={`${inputClass} w-60`}
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-medium text-ink">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              placeholder="Min. 8 characters"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={`${inputClass} w-44`}
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-medium text-ink">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={inputClass}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-white rounded-lg px-5 py-[9px] text-sm font-medium hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            {creating ? 'Adding…' : 'Add user'}
          </button>

          {error && (
            <p className="text-sm text-failed w-full" role="alert">{error}</p>
          )}
        </form>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-frame">
            <tr>
              {['Email', 'Role', 'Status', 'Created', ''].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-frame">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                  No users yet
                </td>
              </tr>
            )}
            {users.map(u => (
              <tr
                key={u.id}
                className={`transition-colors duration-100 hover:bg-surface-hover${u.isActive ? '' : ' opacity-50'}`}
              >
                <td className="px-4 py-3 text-sm text-ink">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e => updateUser(u.id, { role: e.target.value })}
                    className="border border-frame-input rounded-md px-2 py-1 text-xs text-ink bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
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
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                    className="text-xs font-medium text-primary hover:text-primary-deep transition-colors duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
