export function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === null) {
    return (
      <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {direction === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 15l4-4 4 4" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />}
    </svg>
  );
}

export function KebabIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}
