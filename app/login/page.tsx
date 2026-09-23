'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Invalid credentials');
        return;
      }
      toast.success('Signed in successfully');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error — check your connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-card px-8 py-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/favicon.png" alt="Burdens" className="h-20 w-20 object-contain mb-3" />
          <p className="text-[0.9375rem] font-semibold text-ink tracking-tight">Burdens Integrations</p>
          <p className="text-xs text-muted mt-0.5">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-medium text-ink" htmlFor="login-email">Email</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-medium text-ink" htmlFor="login-password">Password</label>
            <Input
              id="login-password"
              name="password"
              type="password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-failed" role="alert">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
