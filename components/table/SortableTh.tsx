'use client';
import { SortIcon } from './icons';

export default function SortableTh({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: 'asc' | 'desc' | null;
  onClick: () => void;
}) {
  return (
    <th className="text-left px-4 py-[10px] text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em] whitespace-nowrap">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-ink transition-colors duration-100">
        {label}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
}
