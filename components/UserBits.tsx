'use client';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/roles';
import type { Role } from '@/lib/session';

// "elton.escudero@…" → "EE"; the email is the only name we have.
export function UserAvatar({ email, size = 'md' }: { email: string; size?: 'md' | 'lg' }) {
  const parts = email.split('@')[0].split(/[._-]+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-wash font-semibold text-primary',
        size === 'lg' ? 'size-12 text-base' : 'size-8 text-xs',
      )}
    >
      {initials}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const label = ROLES.find(r => r.key === role)?.label ?? role;
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold',
        role === 'admin' ? 'bg-primary text-white' : role === 'operator' ? 'bg-primary-wash text-primary' : 'bg-surface-strong text-muted',
      )}
    >
      {label}
    </span>
  );
}

// Role chooser that says what each role can do, so nobody picks blind.
export function RolePicker({ value, onChange, disabled, name }: { value: string; onChange: (r: Role) => void; disabled?: boolean; name: string }) {
  return (
    <div role="radiogroup" aria-label="Role" className="grid gap-2">
      {ROLES.map(r => {
        const on = value === r.key;
        return (
          <label
            key={r.key}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              on ? 'border-primary bg-primary-wash' : 'border-frame hover:bg-surface-hover',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={r.key}
              checked={on}
              disabled={disabled}
              onChange={() => onChange(r.key)}
              className="mt-0.5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{r.label}</span>
              <span className="block text-xs text-muted">{r.summary}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
