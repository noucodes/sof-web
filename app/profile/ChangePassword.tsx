'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('The new passwords don’t match.');
    if (next === current) return setError('Pick a password different from your current one.');
    setBusy(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message ?? 'Couldn’t change your password');
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-5 space-y-3">
      <p className="text-xs text-muted">Use at least 8 characters. You stay signed in on this device.</p>
      <Field id="current-password" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <Field id="new-password" label="New password" value={next} onChange={setNext} autoComplete="new-password" minLength={8} />
      <Field id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={8} />
      {error && <p className="text-sm text-failed" role="alert">{error}</p>}
      <Button type="submit" size="sm" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Button>
    </form>
  );
}

function Field({ id, label, value, onChange, autoComplete, minLength }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink">{label}</label>
      <Input id={id} type="password" required minLength={minLength} autoComplete={autoComplete} value={value} onChange={e => onChange(e.target.value)} className="max-w-72" />
    </div>
  );
}
