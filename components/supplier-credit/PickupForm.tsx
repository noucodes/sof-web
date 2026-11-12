'use client';
import { useState, type FormEvent } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Party = { name?: string | null; address?: string | null; suburb?: string | null; state?: string | null; postcode?: string | null; phone?: string | null };
export type Pickup = {
  creditNo: string; po: string; supplier: string; supplierName?: string | null;
  stage: 'store' | 'ready' | 'sent' | 'failed'; note?: string;
  lines: { code: string; desc: string; qty: number }[];
  info: { creditDate?: string | null; contact?: string | null; branch?: Party; supplier?: Party };
  cartons?: number; cartonsKg?: number; pallets?: number; palletsKg?: number; enteredBy?: string; sentAt?: string;
};

// Same fields as the worker's rules.pickupRows (the supplier email's "Collection details").
function rows(p: Pickup): [string, string][] {
  const b = p.info.branch ?? {}, s = p.info.supplier ?? {};
  const qty = (q?: number, kg?: number) => (q == null ? '' : q ? `${q} (${kg} kg)` : '0');
  return [
    ['Date', p.info.creditDate ? p.info.creditDate.slice(0, 10).split('-').reverse().join('/') : ''],
    ['Pick up from', b.name ? `Burdens ${b.name}` : ''],
    ['Address', b.address ? [b.address, b.suburb, 'VIC', b.postcode].filter(Boolean).join(', ') : ''],
    ['Phone', b.phone ?? ''],
    ['Contact name', p.info.contact ?? ''],
    ['Cartons', qty(p.cartons, p.cartonsKg)],
    ['Pallets', qty(p.pallets, p.palletsKg)],
    ['Time ready', '6:30am'],
    ['Time closing', '3:30pm'],
    ['Charge to', s.name ?? p.supplierName ?? ''],
    ['Return address', [s.address, [s.suburb, s.state, s.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')],
  ];
}

function NumberField({ label, name, step, hint }: { label: string; name: string; step: string; hint: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{label}</span>
      <Input name={name} type="number" inputMode={step === '1' ? 'numeric' : 'decimal'} min="0" step={step} defaultValue="0" required aria-describedby={`${name}-hint`} />
      <span id={`${name}-hint`} className="text-xs text-muted">{hint}</span>
    </label>
  );
}

export default function PickupForm({ initial, path }: { initial: Pickup; path: string }) {
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canSend = p.stage === 'store' || p.stage === 'failed';
  const store = p.info.branch?.name ? `Burdens ${p.info.branch.name}` : 'Burdens';

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const num = (k: string) => Number(f.get(k));
    setBusy(true);
    try {
      const res = await fetch(`/api/pickup/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartons: num('cartons'), cartonsKg: num('cartonsKg'), pallets: num('pallets'), palletsKg: num('palletsKg'), name: String(f.get('name') ?? '') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Something went wrong');
      setP(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <header className="space-y-1 print:hidden">
        <p className="text-xs font-medium uppercase tracking-[0.07em] text-muted">{store} · Stock Return {p.po}</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          {canSend ? 'Enter cartons and pallets' : 'Pick up request'}
        </h1>
        <p className="text-sm text-muted">
          Return to {p.supplierName || p.supplier} for customer credit {p.creditNo}.
        </p>
      </header>

      {p.stage === 'failed' && (
        <p role="alert" className="rounded-lg bg-failed-bg px-4 py-3 text-sm text-failed print:hidden">
          The supplier email didn’t go out. Check the numbers and press Send again. {p.note && <span className="block text-xs">{p.note}</span>}
        </p>
      )}
      {p.stage === 'ready' && (
        <p role="status" className="rounded-lg bg-success-bg px-4 py-3 text-sm text-success print:hidden">
          Thanks{p.enteredBy ? `, ${p.enteredBy}` : ''}. The supplier will get the Credit Request and these pick-up details within a few minutes. Nothing else to do.
        </p>
      )}
      {p.stage === 'sent' && (
        <p role="status" className="rounded-lg bg-success-bg px-4 py-3 text-sm text-success print:hidden">
          Sent to the supplier{p.sentAt ? ` on ${new Date(p.sentAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })}` : ''}.
        </p>
      )}

      <section className="rounded-xl bg-white p-4 shadow-card print:hidden" aria-labelledby="goods">
        <h2 id="goods" className="text-sm font-semibold text-ink">Goods to put aside</h2>
        {p.lines.length ? (
          <ul className="mt-2 divide-y divide-hair text-sm">
            {p.lines.map(l => (
              <li key={l.code} className="flex justify-between gap-4 py-2">
                <span><span className="font-mono">{l.code}</span> <span className="text-muted">{l.desc}</span></span>
                <span className="font-mono">x{l.qty}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">See the Stock Return attached to the email.</p>}
      </section>

      {canSend && (
        <form onSubmit={send} className="space-y-4 rounded-xl bg-white p-4 shadow-card print:hidden">
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Cartons" name="cartons" step="1" hint="How many boxes (0 if none)" />
            <NumberField label="Cartons weight (kg)" name="cartonsKg" step="0.1" hint="All cartons together" />
            <NumberField label="Pallets" name="pallets" step="1" hint="How many pallets (0 if none)" />
            <NumberField label="Pallets weight (kg)" name="palletsKg" step="0.1" hint="All pallets together" />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Your name</span>
            <Input name="name" required maxLength={80} autoComplete="name" />
          </label>
          {error && <p role="alert" className="text-sm text-failed">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy && <Loader2 className="animate-spin" />}Send to supplier
          </Button>
          <p className="text-xs text-muted">Sends the Stock Return and the pick-up details below to the supplier, copying accounts and your store.</p>
        </form>
      )}

      <section className="rounded-xl bg-white p-4 shadow-card print:rounded-none print:p-0 print:shadow-none" aria-labelledby="form-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="form-title" className="text-sm font-semibold text-ink print:w-full print:text-center print:text-2xl print:tracking-widest">PICK UP REQUEST</h2>
          {!canSend && (
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
              <Printer />Print
            </Button>
          )}
        </div>
        <p className="hidden text-center text-sm print:block">Burdens · Stock Return {p.po}</p>
        <table className="mt-3 w-full border-collapse text-sm">
          <tbody>
            {rows(p).map(([k, v]) => (
              <tr key={k} className="border border-frame">
                <th scope="row" className="w-2/5 bg-surface px-3 py-2 text-left font-medium">{k}</th>
                <td className="px-3 py-2">{v || <span className="text-muted print:hidden">{['Cartons', 'Pallets'].includes(k) ? 'entered above' : '—'}</span>}</td>
              </tr>
            ))}
            <tr className="border border-frame">
              <th scope="row" className="bg-surface px-3 py-2 text-left font-medium">R/A number</th>
              <td className="px-3 py-2" />
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
