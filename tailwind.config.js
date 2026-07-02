/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       'var(--color-primary)',
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
    },
  },
  plugins: [],
};
