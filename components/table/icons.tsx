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

export function Spinner() {
  return (
    <svg className="w-3 h-3 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
