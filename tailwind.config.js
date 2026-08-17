/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT:    'var(--color-primary)',
          foreground: 'oklch(1 0 0)',
        },
        'primary-deep':'var(--color-primary-deep)',
        'primary-wash':'var(--color-primary-wash)',
        surface:       'var(--color-surface)',
        'surface-hover':'var(--color-surface-hover)',
        frame:         'var(--color-border)',
        'frame-input': 'var(--color-border-input)',
        muted:         'var(--color-muted)',
        ink:           'var(--color-ink)',
        success:       'var(--color-success)',
        'success-bg':  'var(--color-success-bg)',
        failed:        'var(--color-failed)',
        'failed-bg':   'var(--color-failed-bg)',
        pending:       'var(--color-pending)',
        'pending-bg':  'var(--color-pending-bg)',
        // shadcn/ui primitives (components/ui/*) reference these generic slots.
        // Kept as thin aliases onto the Cobalt Ink tokens above -- one source
        // of truth, not a second parallel palette.
        background:  'var(--color-bg)',
        foreground:  'var(--color-ink)',
        ring:        'var(--color-primary)',
        destructive: {
          DEFAULT:    'var(--color-failed)',
          foreground: 'oklch(1 0 0)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        raised:     '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        header:     '0 1px 2px rgba(0,0,0,0.04)',
        'focus-ring':'0 0 0 3px var(--color-primary-wash)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
