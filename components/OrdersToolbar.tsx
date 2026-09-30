'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Toolbar = { compact: boolean; setDensity: (c: boolean) => void; slot: HTMLElement | null; setSlot: (el: HTMLElement | null) => void };
const Ctx = createContext<Toolbar>({ compact: false, setDensity: () => {}, slot: null, setSlot: () => {} });

// Shares the Orders filter row with OrdersTable: the density choice, and a slot
// the table portals its "N selected" bulk bar into, so nothing above the table
// changes height when rows are selected.
export function OrdersToolbarProvider({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  // Density is a per-browser preference. Storage can be blocked, so it's best-effort.
  useEffect(() => { try { setCompact(localStorage.getItem('sof.orders.density') === 'compact'); } catch {} }, []);
  function setDensity(c: boolean) {
    setCompact(c);
    try { localStorage.setItem('sof.orders.density', c ? 'compact' : 'comfortable'); } catch {}
  }
  return <Ctx.Provider value={{ compact, setDensity, slot, setSlot }}>{children}</Ctx.Provider>;
}

export const useOrdersToolbar = () => useContext(Ctx);

export default function OrdersToolbar() {
  const { compact, setDensity, setSlot } = useOrdersToolbar();
  return (
    <div className="ml-auto flex items-center gap-3">
      <div ref={setSlot} className="contents" />
      <div role="group" aria-label="Row density" className="inline-flex h-9 items-center rounded-lg bg-surface-strong p-1">
        {([['Comfortable', false], ['Compact', true]] as const).map(([label, value]) => (
          <button
            key={label}
            aria-pressed={compact === value}
            onClick={() => setDensity(value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none',
              compact === value ? 'bg-white font-medium text-ink shadow-card' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
