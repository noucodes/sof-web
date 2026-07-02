'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoFocus
              className="border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink placeholder:text-muted bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-medium text-ink" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              className="border-[1.5px] border-frame-input rounded-lg px-3 py-[9px] text-sm text-ink placeholder:text-muted bg-white focus:outline-none focus:border-primary focus:shadow-focus-ring transition-[border-color,box-shadow] duration-[120ms]"
            />
          </div>

          {error && (
            <p className="text-sm text-failed" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-[9px] text-sm font-medium hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
