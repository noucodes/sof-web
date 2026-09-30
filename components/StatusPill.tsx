import { cn } from '@/lib/utils';

export type Tone = 'success' | 'failed' | 'pending' | 'neutral';

const TONES: Record<Tone, string> = {
  success: 'bg-success-bg text-success',
  failed: 'bg-failed-bg text-failed',
  pending: 'bg-pending-bg text-pending',
  neutral: 'bg-surface-strong text-muted',
};

// The app's one status look: coloured dot + sentence-case label. The dot keeps
// status readable for anyone who can't tell the colours apart.
export default function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-medium leading-[1.4] before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-[""]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// "partially_refunded" -> "Partially refunded"
export const humanize = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, ' ');
